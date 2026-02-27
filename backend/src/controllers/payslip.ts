import { Request, Response } from 'express';
import Payslip from '../models/Payslip';
import PayslipPayment from '../models/PayslipPayment';
import Expense from '../models/Expense';
import ExpenseCategory from '../models/ExpenseCategory';
import Staff from '../models/Staff';
import School from '../models/School';
import User from '../models/User';
import { sendSuccess, sendError } from '../utils/response';
import sequelize from '../config/database';
import { Op } from 'sequelize';

// Helper function to get month name
const getMonthName = (month: number): string => {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
};

// Helper function to generate payslip number
const generatePayslipNumber = async (month: number, year: number, staffId: number): Promise<string> => {
    const monthStr = month.toString().padStart(2, '0');
    const staffStr = staffId.toString().padStart(2, '0');
    
    // Get the next sequence number for this month/year
    const existingPayslips = await Payslip.count({
        where: { month, year }
    });
    const sequence = (existingPayslips + 1).toString().padStart(2, '0');
    
    return `PS-${year}-${monthStr}-${staffStr}-${sequence}`;
};

// Helper function to get staff details
const getStaffDetails = async (staffId: number) => {
    return await Staff.findByPk(staffId);
};

// Helper function to calculate next available month for a staff member
const calculateNextAvailableMonth = async (staffId: number) => {
    // Get the latest payslip for this staff member
    const latestPayslip = await Payslip.findOne({
        where: { staffId },
        order: [['year', 'DESC'], ['month', 'DESC']]
    });

    const currentDate = new Date();
    let nextMonth: number;
    let nextYear: number;
    let lastGeneratedMonth: string | null = null;

    if (!latestPayslip) {
        // No previous payslips - use staff's joining date as the starting point
        const staff = await getStaffDetails(staffId);

        if (!staff) {
            throw new Error('Staff member not found');
        }

        // Use dateOfJoiningService as reference date
        const joiningDate = new Date(staff.dateOfJoiningService);
        
        // First available month is the month of joining
        nextMonth = joiningDate.getMonth() + 1; // Convert 0-based to 1-based
        nextYear = joiningDate.getFullYear();
    } else {
        // Calculate next month based on latest payslip
        lastGeneratedMonth = `${getMonthName(latestPayslip.month)} ${latestPayslip.year}`;
        
        if (latestPayslip.month === 12) {
            // December -> January of next year
            nextMonth = 1;
            nextYear = latestPayslip.year + 1;
        } else {
            // Any other month -> next month same year
            nextMonth = latestPayslip.month + 1;
            nextYear = latestPayslip.year;
        }
    }

    // Validate that we're not trying to generate for a future month
    // Get previous month from current date (max allowed month)
    let maxAllowedMonth = currentDate.getMonth(); // 0-11
    let maxAllowedYear = currentDate.getFullYear();

    if (maxAllowedMonth === 0) {
        maxAllowedMonth = 12;
        maxAllowedYear = maxAllowedYear - 1;
    }

    // Check if we can generate (not beyond previous month)
    const canGenerate = !(nextYear > maxAllowedYear || 
        (nextYear === maxAllowedYear && nextMonth > maxAllowedMonth));

    return {
        nextAvailableMonth: nextMonth,
        nextAvailableYear: nextYear,
        nextAvailableMonthName: getMonthName(nextMonth),
        lastGeneratedMonth: lastGeneratedMonth,
        canGenerate: canGenerate
    };
};

export const generatePayslip = async (req: Request, res: Response) => {
    try {
        const {
            staffId,
            month,
            year,
            workingDays = 26,
            absentDays = 0,
            casualLeave = 0,
            halfDays = 0,
            deductions = 0
        } = req.body;

        // Validate required fields
        if (!staffId || !month || !year) {
            return sendError(res, 'Missing required fields: staffId, month, year', 400);
        }

        // Validate month and year
        if (month < 1 || month > 12) {
            return sendError(res, 'Month must be between 1 and 12', 400);
        }

        if (year < 2020 || year > 2050) {
            return sendError(res, 'Year must be between 2020 and 2050', 400);
        }

        // Validate working days
        if (workingDays < 20 || workingDays > 31) {
            return sendError(res, 'Working days must be between 20 and 31', 400);
        }

        // Validate attendance data
        if (absentDays < 0 || casualLeave < 0 || halfDays < 0) {
            return sendError(res, 'Attendance values cannot be negative', 400);
        }

        if (absentDays + casualLeave + halfDays > workingDays) {
            return sendError(res, 'Total absent days, casual leave, and half days cannot exceed working days', 400);
        }

        if (absentDays + halfDays > 30) {
            return sendError(res, 'Total absent days and half days cannot exceed 30', 400);
        }

        // Check if payslip already exists for this staff/month/year
        const existingPayslip = await Payslip.findOne({
            where: { staffId, month, year }
        });

        if (existingPayslip) {
            return sendError(res, 'Payslip already exists for this staff member and month', 400);
        }

        // Validate sequential month generation
        const nextAvailableData = await calculateNextAvailableMonth(staffId);
        
        if (!nextAvailableData.canGenerate) {
            return sendError(res, 'Cannot generate payslip for future months. All payslips are up to date.', 400);
        }

        // Validate that the requested month/year matches the expected sequential month
        if (month !== nextAvailableData.nextAvailableMonth || year !== nextAvailableData.nextAvailableYear) {
            const expectedMonthName = nextAvailableData.nextAvailableMonthName;
            const requestedMonthName = getMonthName(month);
            const lastGeneratedMonth = nextAvailableData.lastGeneratedMonth || 'None';
            
            return sendError(res, 
                `Invalid month sequence. Expected: ${expectedMonthName} ${nextAvailableData.nextAvailableYear}, ` +
                `Requested: ${requestedMonthName} ${year}. ` +
                `Last generated: ${lastGeneratedMonth}. ` +
                `Payslips must be generated in sequential order.`, 
                400
            );
        }

        // Get staff details
        const staff = await getStaffDetails(staffId);
        if (!staff) {
            return sendError(res, 'Staff member not found', 404);
        }

        if (!staff.active) {
            return sendError(res, 'Cannot generate payslip for inactive staff member', 400);
        }

        if (!staff.salaryPerMonth) {
            return sendError(res, 'Staff member does not have salary information', 400);
        }

        // Validate that the payslip month is not before the joining date
        const joiningDate = new Date(staff.dateOfJoiningService);
        const joiningYear = joiningDate.getFullYear();
        const joiningMonth = joiningDate.getMonth() + 1; // Convert 0-based to 1-based

        if (year < joiningYear || (year === joiningYear && month < joiningMonth)) {
            const joiningMonthName = getMonthName(joiningMonth);
            return sendError(res, 
                `Cannot generate payslip for ${getMonthName(month)} ${year}. ` +
                `Staff joined in ${joiningMonthName} ${joiningYear}. ` +
                `Payslips can only be generated from the joining month onwards.`,
                400
            );
        }

        // Get school details
        const school = await School.findByPk(staff.schoolId);
        if (!school) {
            return sendError(res, 'School not found', 404);
        }

        // Calculate salary using new logic
        const baseSalary = parseFloat(staff.salaryPerMonth.toString());
        const perDaySalary = baseSalary / 30;
        
        // Present days = working days - absent - CL - (half day)/2
        const presentDays = workingDays - absentDays - casualLeave - (halfDays / 2);
        
        // Effective salary days = 30 - absent - (half day)/2
        const effectiveSalaryDays = 30 - absentDays - (halfDays / 2);
        
        // Gross salary = effective salary days * per day salary
        const grossSalary = effectiveSalaryDays * perDaySalary;
        const netSalary = grossSalary - deductions;

        // Generate payslip number
        const payslipNumber = await generatePayslipNumber(month, year, staffId);

        // Get user ID from request (assuming it's set by auth middleware)
        const userId = (req as any).user?.id || 1; // Fallback to 1 if not available

        // Create payslip
        const payslip = await Payslip.create({
            payslipNumber,
            staffId,
            month,
            year,
            monthName: getMonthName(month),
            
            // Staff details snapshot
            staffName: staff.name,
            staffEmail: staff.email,
            staffMobile: staff.mobileNumber,
            staffRole: (staff as any).role || 'Not specified',
            staffAadhaar: staff.aadhaarNumber,
            staffAccountNumber: staff.accountNumber || '',
            staffIfscCode: staff.ifscCode || '',
            
            // School details snapshot
            schoolName: school.name,
            schoolAddress: `${school.street}, ${school.city}, ${school.district}, ${school.state} - ${school.pincode}`,
            schoolPhone: school.mobile || '',
            schoolEmail: school.email || '',
            
            // Salary calculation
            baseSalary,
            perDaySalary,
            workingDays,
            totalDays: 30,
            presentDays,
            effectiveSalaryDays,
            absentDays,
            casualLeave,
            halfDays,
            grossSalary,
            deductions,
            netSalary,
            
            // Payment tracking (initialize as unpaid)
            totalPaidAmount: 0,
            remainingAmount: netSalary,
            paymentStatus: 'UNPAID',
            lastPaymentDate: null,
            
            // Audit information
            generatedBy: userId,
            generatedDate: new Date(),
            schoolId: staff.schoolId
        });

        return sendSuccess(res, payslip, 'Payslip generated successfully', 201);
    } catch (error: any) {
        console.error('Error generating payslip:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getPayslipsByStaff = async (req: Request, res: Response) => {
    try {
        const { staffId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!staffId) {
            return sendError(res, 'Staff ID is required', 400);
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const { count, rows: payslips } = await Payslip.findAndCountAll({
            where: { staffId: parseInt(staffId) },
            order: [['year', 'DESC'], ['month', 'DESC']],
            limit: parseInt(limit as string),
            offset
        });

        return sendSuccess(res, {
            payslips,
            pagination: {
                total: count,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                totalPages: Math.ceil(count / parseInt(limit as string))
            }
        }, 'Payslips retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching payslips:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getPayslipById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const payslip = await Payslip.findByPk(id);

        if (!payslip) {
            return sendError(res, 'Payslip not found', 404);
        }

        return sendSuccess(res, payslip, 'Payslip retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching payslip:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const checkPayslipExists = async (req: Request, res: Response) => {
    try {
        const { staffId, month, year } = req.params;

        const payslip = await Payslip.findOne({
            where: {
                staffId: parseInt(staffId),
                month: parseInt(month),
                year: parseInt(year)
            }
        });

        return sendSuccess(res, { exists: !!payslip, payslip }, 'Check completed');
    } catch (error: any) {
        console.error('Error checking payslip:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getAllPayslips = async (req: Request, res: Response) => {
    try {
        const { schoolId, month, year, page = 1, limit = 20 } = req.query;

        if (!schoolId) {
            return sendError(res, 'School ID is required', 400);
        }

        const whereClause: any = { schoolId: parseInt(schoolId as string) };
        
        if (month) {
            whereClause.month = parseInt(month as string);
        }
        
        if (year) {
            whereClause.year = parseInt(year as string);
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const { count, rows: payslips } = await Payslip.findAndCountAll({
            where: whereClause,
            order: [['year', 'DESC'], ['month', 'DESC'], ['staffName', 'ASC']],
            limit: parseInt(limit as string),
            offset
        });

        return sendSuccess(res, {
            payslips,
            pagination: {
                total: count,
                page: parseInt(page as string),
                limit: parseInt(limit as string),
                totalPages: Math.ceil(count / parseInt(limit as string))
            }
        }, 'Payslips retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching all payslips:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const deletePayslip = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const payslip = await Payslip.findByPk(id);

        if (!payslip) {
            return sendError(res, 'Payslip not found', 404);
        }

        await payslip.destroy();

        return sendSuccess(res, null, 'Payslip deleted successfully');
    } catch (error: any) {
        console.error('Error deleting payslip:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

// Payment Management Functions

export const makePayment = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { paymentAmount, paymentMethod, notes } = req.body;

        // Validate required fields
        if (!paymentAmount || !paymentMethod) {
            await transaction.rollback();
            return sendError(res, 'Payment amount and method are required', 400);
        }

        // Validate payment amount
        if (paymentAmount <= 0) {
            await transaction.rollback();
            return sendError(res, 'Payment amount must be greater than 0', 400);
        }

        // Validate payment method
        const validMethods = ['Cash', 'UPI', 'Bank Transfer'];
        if (!validMethods.includes(paymentMethod)) {
            await transaction.rollback();
            return sendError(res, 'Invalid payment method. Must be Cash, UPI, or Bank Transfer', 400);
        }

        // Round payment amount to 2 decimal places to avoid floating-point precision issues
        const roundedPaymentAmount = parseFloat(parseFloat(paymentAmount.toString()).toFixed(2));

        // Get payslip
        const payslip = await Payslip.findByPk(id, { transaction });
        if (!payslip) {
            await transaction.rollback();
            return sendError(res, 'Payslip not found', 404);
        }

        // Check if payslip is already fully paid
        if (payslip.paymentStatus === 'PAID') {
            await transaction.rollback();
            return sendError(res, 'Payslip is already fully paid', 400);
        }

        // Check if payment amount exceeds remaining amount
        if (roundedPaymentAmount > payslip.remainingAmount) {
            await transaction.rollback();
            return sendError(res, `Payment amount (₹${roundedPaymentAmount}) exceeds remaining amount (₹${payslip.remainingAmount})`, 400);
        }

        // Get user ID from request
        const userId = (req as any).user?.id || 1;

        // Find the SALARY expense category for this school (case-insensitive)
        const salaryCategory = await ExpenseCategory.findOne({
            where: {
                name: sequelize.where(
                    sequelize.fn('UPPER', sequelize.col('name')), 
                    'SALARY'
                ),
                schoolId: payslip.schoolId,
                isActive: true
            },
            transaction
        });

        if (!salaryCategory) {
            await transaction.rollback();
            return sendError(res, 'SALARY expense category not found for this school. Please create a SALARY category first.', 400);
        }

        // Create expense entry first
        const expenseName = `${payslip.staffName}-SALARY-${payslip.payslipNumber}`;
        const expense = await Expense.create({
            amount: roundedPaymentAmount,
            name: expenseName,
            categoryId: salaryCategory.id,
            userId: userId,
            schoolId: payslip.schoolId,
            isPayslipPayment: true
        }, { transaction });

        // Create payment record
        const payment = await PayslipPayment.create({
            payslipId: payslip.id,
            paymentAmount: roundedPaymentAmount,
            paymentDate: new Date(),
            paymentMethod: paymentMethod,
            notes: notes || null,
            paidBy: userId,
            expenseId: expense.id,
            schoolId: payslip.schoolId
        }, { transaction });

        // Update payslip payment tracking
        const newTotalPaid = parseFloat(parseFloat(payslip.totalPaidAmount.toString()).toFixed(2)) + roundedPaymentAmount;
        const newRemainingAmount = parseFloat(parseFloat(payslip.netSalary.toString()).toFixed(2)) - newTotalPaid;
        
        let newPaymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'PARTIAL';
        if (newRemainingAmount === 0) {
            newPaymentStatus = 'PAID';
        } else if (newTotalPaid === 0) {
            newPaymentStatus = 'UNPAID';
        }

        await payslip.update({
            totalPaidAmount: newTotalPaid,
            remainingAmount: newRemainingAmount,
            paymentStatus: newPaymentStatus,
            lastPaymentDate: new Date()
        }, { transaction });

        await transaction.commit();

        // Fetch updated payslip with payment details (without transaction since it's committed)
        const updatedPayslip = await Payslip.findByPk(id);

        return sendSuccess(res, {
            payslip: updatedPayslip,
            payment: payment,
            expense: expense
        }, 'Payment recorded successfully', 201);

    } catch (error: any) {
        // Only rollback if transaction is still active
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            // Transaction was already committed or rolled back
            console.log('Transaction already finished, cannot rollback');
        }
        console.error('Error making payment:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getPaymentHistory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const payslip = await Payslip.findByPk(id, {
            include: [{
                model: PayslipPayment,
                as: 'payments',
                include: [{
                    model: User,
                    as: 'paidByUser',
                    attributes: ['id', 'name', 'email']
                }, {
                    model: Expense,
                    as: 'expense',
                    attributes: ['id', 'name', 'amount']
                }],
                order: [['paymentDate', 'DESC']]
            }]
        });

        if (!payslip) {
            return sendError(res, 'Payslip not found', 404);
        }

        return sendSuccess(res, {
            payslip: payslip,
            payments: payslip.payments || []
        }, 'Payment history retrieved successfully');

    } catch (error: any) {
        console.error('Error fetching payment history:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getPayslipWithPayments = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const payslip = await Payslip.findByPk(id);
        if (!payslip) {
            return sendError(res, 'Payslip not found', 404);
        }

        // Get payments separately to avoid complex join issues
        const payments = await PayslipPayment.findAll({
            where: { payslipId: id },
            order: [['paymentDate', 'DESC']]
        });

        // Add payments to payslip object
        const payslipWithPayments = {
            ...payslip.toJSON(),
            payments: payments
        };

        return sendSuccess(res, payslipWithPayments, 'Payslip with payments retrieved successfully');

    } catch (error: any) {
        console.error('Error fetching payslip with payments:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const deletePayment = async (req: Request, res: Response) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id, paymentId } = req.params;

        // Get payment with payslip
        const payment = await PayslipPayment.findOne({
            where: { id: paymentId, payslipId: id },
            include: [{
                model: Payslip,
                as: 'payslip'
            }, {
                model: Expense,
                as: 'expense'
            }],
            transaction
        });

        if (!payment) {
            await transaction.rollback();
            return sendError(res, 'Payment not found', 404);
        }

        const payslip = payment.payslip;

        // Update payslip payment tracking
        const newTotalPaid = parseFloat(payslip.totalPaidAmount.toString()) - parseFloat(payment.paymentAmount.toString());
        const newRemainingAmount = parseFloat(payslip.netSalary.toString()) - newTotalPaid;
        
        let newPaymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'PARTIAL';
        if (newRemainingAmount === parseFloat(payslip.netSalary.toString())) {
            newPaymentStatus = 'UNPAID';
        } else if (newRemainingAmount === 0) {
            newPaymentStatus = 'PAID';
        }

        // Get last payment date (excluding current payment)
        const lastPayment = await PayslipPayment.findOne({
            where: { 
                payslipId: id,
                id: { [Op.ne]: paymentId }
            },
            order: [['paymentDate', 'DESC']],
            transaction
        });

        await payslip.update({
            totalPaidAmount: newTotalPaid,
            remainingAmount: newRemainingAmount,
            paymentStatus: newPaymentStatus,
            lastPaymentDate: lastPayment ? lastPayment.paymentDate : null
        }, { transaction });

        // Delete associated expense
        if (payment.expense) {
            await payment.expense.destroy({ transaction });
        }

        // Delete payment
        await payment.destroy({ transaction });

        await transaction.commit();

        return sendSuccess(res, null, 'Payment deleted successfully');

    } catch (error: any) {
        await transaction.rollback();
        console.error('Error deleting payment:', error);
        return sendError(res, 'Internal server error', 500);
    }
};

export const getNextAvailableMonth = async (req: Request, res: Response) => {
    try {
        const { staffId } = req.params;

        if (!staffId) {
            return sendError(res, 'Staff ID is required', 400);
        }

        // Use the helper function to calculate next available month
        const nextAvailableData = await calculateNextAvailableMonth(parseInt(staffId));

        
        if (!nextAvailableData.canGenerate) {
            return sendError(res, 'Cannot generate payslip for future months. All payslips are up to date.', 400);
        }

        return sendSuccess(res, nextAvailableData, 'Next available month retrieved successfully');

    } catch (error: any) {
        console.error('Error getting next available month:', error);
        return sendError(res, 'Internal server error', 500);
    }
};
