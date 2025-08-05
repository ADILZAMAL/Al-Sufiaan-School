import { Request, Response } from 'express';
import Payslip from '../models/Payslip';
import TeachingStaff from '../models/TeachingStaff';
import NonTeachingStaff from '../models/NonTeachingStaff';
import School from '../models/School';
import { sendSuccess, sendError } from '../utils/response';

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
    const staffStr = staffId.toString().padStart(3, '0');
    
    // Get the next sequence number for this month/year
    const existingPayslips = await Payslip.count({
        where: { month, year }
    });
    const sequence = (existingPayslips + 1).toString().padStart(3, '0');
    
    return `PS-${year}-${monthStr}-${staffStr}-${sequence}`;
};

// Helper function to get staff details
const getStaffDetails = async (staffId: number, staffType: 'teaching' | 'non-teaching') => {
    if (staffType === 'teaching') {
        return await TeachingStaff.findByPk(staffId);
    } else {
        return await NonTeachingStaff.findByPk(staffId);
    }
};

export const generatePayslip = async (req: Request, res: Response) => {
    try {
        const {
            staffId,
            staffType,
            month,
            year,
            workingDays = 26,
            absentDays = 0,
            casualLeave = 0,
            halfDays = 0,
            deductions = 0
        } = req.body;

        // Validate required fields
        if (!staffId || !staffType || !month || !year) {
            return sendError(res, 'Missing required fields: staffId, staffType, month, year', 400);
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
            where: { staffId, staffType, month, year }
        });

        if (existingPayslip) {
            return sendError(res, 'Payslip already exists for this staff member and month', 400);
        }

        // Get staff details
        const staff = await getStaffDetails(staffId, staffType);
        if (!staff) {
            return sendError(res, 'Staff member not found', 404);
        }

        if (!staff.active) {
            return sendError(res, 'Cannot generate payslip for inactive staff member', 400);
        }

        if (!staff.salaryPerMonth) {
            return sendError(res, 'Staff member does not have salary information', 400);
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
            staffType,
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
        const { staffType, staffId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        if (!staffType || !staffId) {
            return sendError(res, 'Staff type and ID are required', 400);
        }

        const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

        const { count, rows: payslips } = await Payslip.findAndCountAll({
            where: { staffId: parseInt(staffId), staffType },
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
        const { staffType, staffId, month, year } = req.params;

        const payslip = await Payslip.findOne({
            where: {
                staffId: parseInt(staffId),
                staffType,
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
