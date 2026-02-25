import { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import Student from "../models/Student";
import School from "../models/School";
import StudentMonthlyFee, { StudentMonthlyFeeStatus } from "../models/StudentMonthlyFee";
import StudentMonthlyFeeItem, { FeeItemType, StudentMonthlyFeeItemCreationAttributes } from "../models/StudentMonthlyFeeItem";
import ClassFeePricing from "../models/ClassFeePricing";
import TransportationAreaPricing from "../models/TransportationAreaPricing";
import StudentFeePayment from "../models/StudentFeePayment";
import User from "../models/User";
import AcademicSession from "../models/AcademicSession";
import StudentEnrollment from "../models/StudentEnrollment";
import { Op } from "sequelize";

const MONTH_NAMES = [
  '', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL',
  'MAY', 'JUNE', 'JULY', 'AUGUST',
  'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

interface GenerateFeeRequest {
  month: number;
  calendarYear: number;
  hostel?: boolean;
  newAdmission?: boolean;
  transportationAreaId?: number;
  dayboarding?: boolean;
  discount?: number;
  discountReason?: string;
}

export const generateMonthlyFee = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { month, calendarYear, hostel = false, transportationAreaId, discount = 0, discountReason, newAdmission = false, dayboarding = false }: GenerateFeeRequest = req.body;
    const userId = parseInt(req.userId);

    // Validate inputs
    if (!studentId) {
      return sendError(res, "studentId param is missing in URL", 400);
    }
    if (!month || !calendarYear) {
      return sendError(res, "Missing required fields: month, calendarYear", 400);
    }

    if (month < 1 || month > 12) {
      return sendError(res, "Invalid month. Must be between 1 and 12", 400);
    }

    if (discount < 0) {
      return sendError(res, "Discount cannot be negative", 400);
    }

    if(hostel && transportationAreaId){
      return sendError(res, "Student cannot have both hostel and transportation services", 400);  
    }

    //Verify student exists
    const student = await Student.findByPk(studentId);

    if (!student) {
      return sendError(res, "Student not found", 404);
    }

    if (!student.active) {
      return sendError(res, "Cannot generate fee for student who has left school", 400);
    }

    // Resolve active session and enrollment to get classId
    const activeSession = await AcademicSession.findOne({
      where: { schoolId: student.schoolId, isActive: true },
    });
    if (!activeSession) {
      return sendError(res, "No active academic session found", 400);
    }

    const enrollment = await StudentEnrollment.findOne({
      where: { studentId: student.id, sessionId: activeSession.id },
    });
    if (!enrollment) {
      return sendError(res, "Student has no enrollment in the active session", 400);
    }

    //Check duplicate (scoped to session)
    const existingFee = await StudentMonthlyFee.findOne({
      where: {
        studentId,
        sessionId: activeSession.id,
        month,
        calendarYear,
      },
    });

    if (existingFee) {
      return sendError(res, `Monthly fee already generated for ${month}/${calendarYear}`, 409);
    }

    // Fetch school data for hostel and admission fees
    const school = await School.findByPk(student.schoolId);

    if (!school) {
      return sendError(res, "School not found", 404);
    }

    // 3️⃣ Calculate fee items based on student's enrollment class
    const feeItems: StudentMonthlyFeeItemCreationAttributes[] = await calculateFeeItems(
      enrollment.classId,
      hostel,
      transportationAreaId,
      newAdmission,
      dayboarding,
      school
    );

    if (feeItems.length === 0) {
      return sendError(res, "No fee items could be calculated", 400);
    }

    // 4️⃣ Calculate subtotal
    const subtotal = feeItems.reduce((sum, item) => sum + item.amount, 0);

    // 5️⃣ Apply discount
    if (discount > subtotal) {
      return sendError(res, "Discount cannot exceed total amount", 400);
    }

    const finalAmount = subtotal - discount;

    // 6️⃣ Create StudentMonthlyFee
    const monthlyFee = await StudentMonthlyFee.create({
      studentId,
      schoolId: student.schoolId,
      sessionId: activeSession.id,
      month,
      calendarYear,
      totalConfiguredAmount: subtotal,
      totalAdjustment: discount,
      totalPayableAmount: finalAmount,
      status: StudentMonthlyFeeStatus.UNPAID,
      generatedBy: userId,
      generatedAt: new Date(),
      discountReason,
    });

    // 7️⃣ Create StudentMonthlyFeeItems with bulk insert
    const feeItemsToCreate = feeItems.map(item => ({
      studentMonthlyFeeId: monthlyFee.id,
      feeType: item.feeType,
      amount: item.amount,
    }));

    await StudentMonthlyFeeItem.bulkCreate(feeItemsToCreate);

    // 8️⃣ Return the created monthly fee with items
    const createdFeeWithItems = await StudentMonthlyFee.findByPk(monthlyFee.id, {
      include: [
        {
          model: StudentMonthlyFeeItem,
          as: 'feeItems',
          attributes: ['id', 'feeType', 'amount']
        },
      ],
    });

    return sendSuccess(res, createdFeeWithItems, "Fee generated successfully", 201);
  } catch (error) {
    console.error("Error generating monthly fee:", error);
    return sendError(res, "Failed to generate monthly fee", 500);
  }
};

async function calculateFeeItems(
  classId: number,
  hostel: boolean,
  transportationAreaId?: number,
  newAdmission?: boolean,
  dayboarding?: boolean,
  school?: School
): Promise<StudentMonthlyFeeItemCreationAttributes[]> {
  const feeItems: StudentMonthlyFeeItemCreationAttributes[] = [];

  try {
    // 1. Tuition Fee (always included)
    const classFeePricing = await ClassFeePricing.findOne({
      where: { classId },
    });

    if (classFeePricing && classFeePricing.amount) {
      feeItems.push({
        feeType: FeeItemType.TUITION_FEE,
        amount: parseFloat(classFeePricing.amount.toString())
      });
    }

    // 2. Hostel Fee (if hostel is true)
    if (hostel) {
      if (!school || !school.hostelFee || school.hostelFee <= 0) {
        throw new Error('Please configure hostel fee in School Settings first');
      }
      feeItems.push({
        feeType: FeeItemType.HOSTEL_FEE,
        amount: parseFloat(school.hostelFee.toString()),
      });
    }

    // 3. Transportation Fee (if transportationAreaId is provided)
    if (transportationAreaId) {
      const transportPricing = await TransportationAreaPricing.findByPk(transportationAreaId);

      if (transportPricing && transportPricing.price) {
        feeItems.push({
          feeType: FeeItemType.TRANSPORT_FEE,
          amount: parseFloat(transportPricing.price.toString()),
        });
      }
    }

    // 4. New Admission Fee (if newAdmission is true)
    if (newAdmission) {
      if (!school || !school.admissionFee || school.admissionFee <= 0) {
        throw new Error('Please configure admission fee in School Settings first');
      }
      feeItems.push({
        feeType: FeeItemType.ADMISSION_FEE,
        amount: parseFloat(school.admissionFee.toString()),
      });
    }

    // 5. Dayboarding Fee (if dayboarding is true)
    if (dayboarding) {
      if (!school || !school.dayboardingFee || school.dayboardingFee <= 0) {
        throw new Error('Please configure dayboarding fee in School Settings first');
      }
      feeItems.push({
        feeType: FeeItemType.DAYBOARDING_FEE,
        amount: parseFloat(school.dayboardingFee.toString()),
      });
    }

    return feeItems;
  } catch (error) {
    console.error("Error calculating fee items:", error);
    throw error;
  }
}

// Helper function to generate timeline from admission
function generateTimelineFromAdmission(
  admissionMonth: number,
  admissionYear: number,
  lastGeneratedMonth?: number,
  lastGeneratedYear?: number
) {
  const timeline = [];
  
  // Determine the end month/year - always use month after last generated fee
  let endMonth: number;
  let endYear: number;
  
  if (lastGeneratedMonth && lastGeneratedYear) {
    // Calculate the month after the last generated fee
    endMonth = lastGeneratedMonth + 1;
    endYear = lastGeneratedYear;
    if (endMonth > 12) {
      endMonth = 1;
      endYear++;
    }
  } else {
    // No fees generated yet, show only the admission month
    endMonth = admissionMonth;
    endYear = admissionYear;
  }
  
  // Calculate months from admission to end date
  const monthsCount = (endYear - admissionYear) * 12 + (endMonth - admissionMonth) + 1;

  let month = admissionMonth;
  let year = admissionYear;

  for (let i = 0; i < monthsCount; i++) {
    timeline.push({
      month,
      calendarYear: year,
      label: `${MONTH_NAMES[month]} ${year}`,
    });

    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }

  return timeline;
}

// Service function to get student fee timeline
export async function getStudentFeeTimeline(studentId: number) {
  // 1️⃣ Fetch student
  const student = await Student.findByPk(studentId);

  if (!student) {
    throw new Error('Student not found');
  }

  const admissionDate = new Date(student.admissionDate);
  const admissionMonth = admissionDate.getMonth() + 1;
  const admissionYear = admissionDate.getFullYear();

  // 2️⃣ Fetch generated monthly fees
  const monthlyFees = await StudentMonthlyFee.findAll({
    where: { studentId },
    include: [
      {
        model: StudentMonthlyFeeItem,
        as: 'feeItems',
        attributes: ['feeType', 'amount'],
      },
      {
        model: StudentFeePayment,
        as: 'payments',
        include: [
          {
            model: User,
            as: 'receiver',
            attributes: ['id', 'firstName', 'lastName'],
          },
        ],
      },
    ],
    order: [['calendarYear', 'DESC'], ['month', 'DESC']],
  });

  // Find the most recently generated fee
  let lastGeneratedMonth: number | undefined;
  let lastGeneratedYear: number | undefined;
  
  if (monthlyFees.length > 0) {
    // Get the first one (already ordered DESC)
    const lastFee = monthlyFees[0];
    lastGeneratedMonth = lastFee.month;
    lastGeneratedYear = lastFee.calendarYear;
  }

  // 3️⃣ Generate timeline from admission (past months + next pending month)
  const timeline = generateTimelineFromAdmission(
    admissionMonth,
    admissionYear,
    lastGeneratedMonth,
    lastGeneratedYear
  );

  // 4️⃣ Build lookup map
  const feeMap = new Map<string, any>();

  for (const fee of monthlyFees) {
    const key = `${fee.calendarYear}-${fee.month}`;

    const paidAmount =
      fee.payments?.reduce(
        (sum: number, p: any) => sum + Number(p.amountPaid),
        0
      ) ?? 0;

    const totalPayable = Number(fee.totalPayableAmount);
    const dueAmount = totalPayable - paidAmount;

    // Extract fee items as array
    const feeItemsArray = fee.feeItems?.map((item: any) => ({
      feeType: item.feeType,
      amount: Number(item.amount),
    })) || [];

    // Format payment details
    const paymentDetails = fee.payments?.map((p: any) => ({
      id: p.id,
      amountPaid: Number(p.amountPaid),
      paymentDate: p.paymentDate,
      paymentMode: p.paymentMode,
      referenceNumber: p.referenceNumber,
      remarks: p.remarks,
      receivedBy: p.receiver ? `${p.receiver.firstName} ${p.receiver.lastName}` : null,
    })) || [];

    feeMap.set(key, {
      id: fee.id,
      status: fee.status.toLowerCase(),
      totalConfiguredAmount: Number(fee.totalConfiguredAmount),
      totalAdjustment: Number(fee.totalAdjustment),
      totalPayableAmount: totalPayable,
      paidAmount,
      dueAmount,
      discountReason: fee.discountReason,
      feeItems: feeItemsArray,
      payments: paymentDetails,
    });
  }

  // 5️⃣ Merge timeline with DB data
  return timeline.map((t) => {
    const key = `${t.calendarYear}-${t.month}`;
    const fee = feeMap.get(key);

    if (!fee) {
    return {
      ...t,
      status: 'not_generated',
      feeItems: null,
      totalConfiguredAmount: null,
      totalAdjustment: null,
      discountReason: null,
    };
    }

    return {
      ...t,
      status: fee.status,
      monthlyFeeId: fee.id,
      totalConfiguredAmount: fee.totalConfiguredAmount,
      totalAdjustment: fee.totalAdjustment,
      totalPayableAmount: fee.totalPayableAmount,
      paidAmount: fee.paidAmount,
      dueAmount: fee.dueAmount,
      discountReason: fee.discountReason,
      feeItems: fee.feeItems,
      payments: fee.payments,
    };
  });
}

// Controller to get student fee timeline
export async function getStudentFeeTimelineController(req: Request, res: Response) {
  const studentId = parseInt(req.params.studentId);

  if (!studentId) {
    return sendError(res, 'studentId is requiredss', 400);
  }

  try {
    const timeline = await getStudentFeeTimeline(studentId);

    return sendSuccess(res, timeline, 'Student fee timeline retrieved successfully');
  } catch (error) {
    console.error('Error fetching student fee timeline:', error);
    if (error instanceof Error && error.message === 'Student not found') {
      return sendError(res, 'Student not found', 404);
    }
    return sendError(res, 'Failed to fetch student fee timeline', 500);
  }
}

// Controller to collect fee payment
export async function collectFeePaymentController(req: Request, res: Response) {
  const { studentId, monthlyFeeId } = req.params;
  const { amountPaid, paymentMode, referenceNumber, remarks } = req.body;
  const userId = parseInt(req.userId);

  if (!paymentMode || paymentMode.trim() === '') {
    return sendError(res, 'Payment mode is required', 400);
  }

  try {
    // Verify the monthly fee exists and belongs to the student
    const monthlyFee = await StudentMonthlyFee.findOne({
      where: {
        id: monthlyFeeId,
        studentId: studentId,
      },
      include: [
        {
          model: StudentFeePayment,
          as: 'payments',
          attributes: ['amountPaid'],
        },
      ],
    });

    if (!monthlyFee) {
      return sendError(res, 'Monthly fee not found', 404);
    }

    const totalPayable = Number(monthlyFee.totalPayableAmount);
    
    // Calculate total already paid
    const alreadyPaid = monthlyFee.payments?.reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0) || 0;
    const dueAmount = totalPayable - alreadyPaid;

    // Validate payment amount
    // Allow 0 amount only when due amount is 0 and status is UNPAID
    if (dueAmount === 0 && monthlyFee.status === StudentMonthlyFeeStatus.UNPAID) {
      // Allow 0 payment to change status from unpaid to paid
      if (amountPaid < 0) {
        return sendError(res, 'Amount paid cannot be negative', 400);
      }
    } else {
      // For all other cases, require amount > 0
      if (!amountPaid || amountPaid <= 0) {
        return sendError(res, 'Amount paid must be greater than 0', 400);
      }
    }

    if (amountPaid > dueAmount) {
      return sendError(res, `Amount paid cannot exceed due amount of ₹${dueAmount.toLocaleString('en-IN')}`, 400);
    }

    // Create payment record
    const payment = await StudentFeePayment.create({
      schoolId: monthlyFee.schoolId,
      studentId: parseInt(studentId),
      studentMonthlyFeeId: parseInt(monthlyFeeId),
      amountPaid,
      paymentDate: new Date(),
      paymentMode: paymentMode.trim(),
      referenceNumber: referenceNumber || null,
      receivedBy: userId,
      remarks: remarks || null,
    });

    // Recalculate paid amount and update status
    const newTotalPaid = alreadyPaid + amountPaid;
    let newStatus = StudentMonthlyFeeStatus.UNPAID;

    if (newTotalPaid >= totalPayable) {
      newStatus = StudentMonthlyFeeStatus.PAID;
    } else if (newTotalPaid > 0) {
      newStatus = StudentMonthlyFeeStatus.PARTIAL;
    }

    await monthlyFee.update({ status: newStatus });

    // Fetch the updated fee with payments
    const updatedFee = await StudentMonthlyFee.findByPk(monthlyFeeId, {
      include: [
        {
          model: StudentFeePayment,
          as: 'payments',
          include: [
            {
              model: User,
              as: 'receiver',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
    });

    return sendSuccess(res, updatedFee, 'Payment collected successfully', 201);
  } catch (error) {
    console.error('Error collecting fee payment:', error);
    return sendError(res, 'Failed to collect payment', 500);
  }
}

// Controller to get all incoming payments
export async function getAllIncomingPayments(req: Request, res: Response) {
  try {
    const { 
      page = '1', 
      limit = '10', 
      fromDate, 
      toDate, 
      paymentMode 
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for filters
    const whereClause: any = {};

    if (fromDate || toDate) {
      whereClause.paymentDate = {};
      if (fromDate) {
        whereClause.paymentDate[Op.gte] = new Date(fromDate as string);
      }
      if (toDate) {
        whereClause.paymentDate[Op.lte] = new Date(toDate as string);
      }
    }

    if (paymentMode && paymentMode !== 'all') {
      whereClause.paymentMode = paymentMode;
    }

    // Fetch payments with associations
    const { count, rows: payments } = await StudentFeePayment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'admissionNumber'],
        },
        {
          model: StudentMonthlyFee,
          as: 'studentMonthlyFee',
          attributes: ['month', 'calendarYear', 'sessionId'],
        },
        {
          model: User,
          as: 'receiver',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'firstName', 'lastName'],
          required: false,
        },
      ],
      order: [['paymentDate', 'DESC'], ['createdAt', 'DESC']],
      limit: limitNum,
      offset,
    });

    // Fetch class information for each payment via enrollment
    const paymentData = await Promise.all(
      payments.map(async (pmt: any) => {
        const sessionId = (pmt.studentMonthlyFee as any)?.sessionId;
        let className = 'N/A';
        let classId: number | undefined;

        if (sessionId) {
          const enrollment = await StudentEnrollment.findOne({
            where: { studentId: pmt.studentId, sessionId },
            include: [{ association: 'class', attributes: ['id', 'name'] }],
          });
          if (enrollment) {
            className = (enrollment as any).class?.name || 'N/A';
            classId = (enrollment as any).class?.id;
          }
        }

        return {
          id: pmt.id,
          studentId: pmt.studentId,
          studentName: `${pmt.student.firstName} ${pmt.student.lastName}`,
          admissionNumber: pmt.student.admissionNumber,
          className,
          classId,
          month: pmt.studentMonthlyFee?.month,
          year: pmt.studentMonthlyFee?.calendarYear,
          amountPaid: Number(pmt.amountPaid),
          paymentDate: pmt.paymentDate,
          paymentMode: pmt.paymentMode,
          referenceNumber: pmt.referenceNumber,
          receivedBy: pmt.receiver
            ? `${pmt.receiver.firstName} ${pmt.receiver.lastName}`
            : 'Unknown',
          receiverId: pmt.receivedBy,
          remarks: pmt.remarks,
          verified: pmt.verified,
          verifiedBy: pmt.verifier
            ? `${pmt.verifier.firstName} ${pmt.verifier.lastName}`
            : null,
          verifiedByUserId: pmt.verifiedBy,
          createdAt: pmt.createdAt,
          updatedAt: pmt.updatedAt,
        };
      })
    );

    return sendSuccess(res, {
      payments: paymentData,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count,
        itemsPerPage: limitNum,
      },
    }, 'Incoming payments fetched successfully');
  } catch (error) {
    console.error('Error fetching incoming payments:', error);
    return sendError(res, 'Failed to fetch incoming payments', 500);
  }
}

// Controller to verify a payment
export async function verifyPaymentController(req: Request, res: Response) {
  const { paymentId } = req.params;
  const userId = parseInt(req.userId);

  if (!paymentId) {
    return sendError(res, 'Payment ID is required', 400);
  }

  try {
    // Find the payment
    const payment = await StudentFeePayment.findByPk(paymentId);

    if (!payment) {
      return sendError(res, 'Payment not found', 404);
    }

    // Check if already verified
    if (payment.verified) {
      return sendError(res, 'Payment is already verified', 400);
    }

    // Update payment as verified
    await payment.update({
      verified: true,
      verifiedBy: userId,
    });

    return sendSuccess(res, {
      id: payment.id,
      verified: true,
      verifiedBy: userId,
    }, 'Payment verified successfully');
  } catch (error) {
    console.error('Error verifying payment:', error);
    return sendError(res, 'Failed to verify payment', 500);
  }
}

// Controller to regenerate monthly fee
export async function regenerateMonthlyFee(req: Request, res: Response) {
  try {
    const { studentId, monthlyFeeId } = req.params;
    const { month, calendarYear, hostel = false, transportationAreaId, discount = 0, discountReason, newAdmission = false, dayboarding = false }: GenerateFeeRequest = req.body;
    const userId = parseInt(req.userId);

    // Validate inputs
    if (!studentId || !monthlyFeeId) {
      return sendError(res, "studentId and monthlyFeeId params are required", 400);
    }

    if (!month || !calendarYear) {
      return sendError(res, "Missing required fields: month, calendarYear", 400);
    }

    if (month < 1 || month > 12) {
      return sendError(res, "Invalid month. Must be between 1 and 12", 400);
    }

    if (discount < 0) {
      return sendError(res, "Discount cannot be negative", 400);
    }

    if(hostel && transportationAreaId){
      return sendError(res, "Student cannot have both hostel and transportation services", 400);  
    }

    // Find existing StudentMonthlyFee
    const existingFee = await StudentMonthlyFee.findOne({
      where: {
        id: monthlyFeeId,
        studentId,
      },
      include: [
        {
          model: StudentFeePayment,
          as: 'payments',
        },
      ],
    });

    if (!existingFee) {
      return sendError(res, "Monthly fee not found", 404);
    }

    // Check if any payments exist - block regeneration if yes
    if (existingFee.payments && existingFee.payments.length > 0) {
      return sendError(res, "Cannot regenerate fee that has received payments", 400);
    }

    // Verify the month and year match
    if (existingFee.month !== month || existingFee.calendarYear !== calendarYear) {
      return sendError(res, "Month/year in request does not match existing fee", 400);
    }

    // Verify student exists and get enrollment for the fee's session
    const student = await Student.findByPk(studentId);

    if (!student) {
      return sendError(res, "Student not found", 404);
    }

    const regenEnrollment = await StudentEnrollment.findOne({
      where: { studentId: student.id, sessionId: existingFee.sessionId },
    });
    if (!regenEnrollment) {
      return sendError(res, "Student has no enrollment in the fee's session", 400);
    }

    // Fetch school data for hostel and admission fees
    const school = await School.findByPk(student.schoolId);

    if (!school) {
      return sendError(res, "School not found", 404);
    }

    // Recalculate fee items based on enrollment class
    const feeItems: StudentMonthlyFeeItemCreationAttributes[] = await calculateFeeItems(
      regenEnrollment.classId,
      hostel,
      transportationAreaId,
      newAdmission,
      dayboarding,
      school
    );

    if (feeItems.length === 0) {
      return sendError(res, "No fee items could be calculated", 400);
    }

    // Calculate subtotal
    const subtotal = feeItems.reduce((sum, item) => sum + item.amount, 0);

    // Apply discount
    if (discount > subtotal) {
      return sendError(res, "Discount cannot exceed total amount", 400);
    }

    const finalAmount = subtotal - discount;

    // Hard delete existing StudentMonthlyFeeItems (force: true to bypass soft delete)
    await StudentMonthlyFeeItem.destroy({
      where: {
        studentMonthlyFeeId: monthlyFeeId,
      },
      force: true, // Hard delete to avoid unique constraint violation
    });

    // Update StudentMonthlyFee with new totals
    await existingFee.update({
      totalConfiguredAmount: subtotal,
      totalAdjustment: discount,
      totalPayableAmount: finalAmount,
      status: StudentMonthlyFeeStatus.UNPAID,
      discountReason,
      lastEditedBy: userId,
      lastEditedAt: new Date(),
    });

    // Create new StudentMonthlyFeeItems
    const feeItemsToCreate = feeItems.map(item => ({
      studentMonthlyFeeId: parseInt(monthlyFeeId),
      feeType: item.feeType,
      amount: item.amount,
    }));

    await StudentMonthlyFeeItem.bulkCreate(feeItemsToCreate);

    // Return the updated monthly fee with items
    const updatedFeeWithItems = await StudentMonthlyFee.findByPk(monthlyFeeId, {
      include: [
        {
          model: StudentMonthlyFeeItem,
          as: 'feeItems',
          attributes: ['id', 'feeType', 'amount']
        },
      ],
    });

    return sendSuccess(res, updatedFeeWithItems, "Fee regenerated successfully", 200);
  } catch (error) {
    console.error("Error regenerating monthly fee:", error);
    return sendError(res, "Failed to regenerate monthly fee", 500);
  }
}

// Controller to get fee dashboard data for last 12 months
export async function getFeeDashboardController(req: Request, res: Response) {
  try {
    const schoolId = parseInt(req.schoolId);
    
    // Calculate last 12 months (from current month going backwards)
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    
    const months: Array<{ month: number; calendarYear: number }> = [];
    
    for (let i = 0; i < 12; i++) {
      let month = currentMonth - i;
      let year = currentYear;
      
      // Handle year boundaries
      while (month <= 0) {
        month += 12;
        year -= 1;
      }
      
      months.push({ month, calendarYear: year });
    }
    
    // Build where clause for all month/year combinations
    const whereConditions = months.map(m => ({
      month: m.month,
      calendarYear: m.calendarYear,
    }));
    
    // Fetch all monthly fees for these months with payments, filtered by schoolId
    const monthlyFees = await StudentMonthlyFee.findAll({
      where: {
        schoolId,
        [Op.or]: whereConditions,
      },
      include: [
        {
          model: StudentFeePayment,
          as: 'payments',
          attributes: ['amountPaid'],
        },
      ],
    });
    
    // Calculate stats for each month
    const monthlyStats = months.map(({ month, calendarYear }) => {
      // Find fees for this month
      const feesForMonth = monthlyFees.filter(
        (fee) => fee.month === month && fee.calendarYear === calendarYear
      );
      
      // Calculate total generated
      const totalGenerated = feesForMonth.reduce(
        (sum, fee) => sum + Number(fee.totalPayableAmount),
        0
      );
      
      // Calculate total collected
      const totalCollected = feesForMonth.reduce((sum, fee) => {
        const paymentsSum = fee.payments?.reduce(
          (paymentSum: number, payment: any) => paymentSum + Number(payment.amountPaid),
          0
        ) || 0;
        return sum + paymentsSum;
      }, 0);
      
      // Calculate total due
      const totalDue = totalGenerated - totalCollected;
      
      return {
        month,
        calendarYear,
        totalGenerated,
        totalCollected,
        totalDue,
      };
    });
    
    return sendSuccess(res, monthlyStats, 'Fee dashboard data retrieved successfully');
  } catch (error) {
    console.error('Error fetching fee dashboard:', error);
    return sendError(res, 'Failed to fetch fee dashboard data', 500);
  }
}

// Controller to get students with dues for a specific month
export async function getStudentsWithDuesController(req: Request, res: Response) {
  try {
    const schoolId = parseInt(req.schoolId);
    const { month, calendarYear } = req.query;

    if (!month || !calendarYear) {
      return sendError(res, 'Month and calendarYear query parameters are required', 400);
    }

    const monthNum = parseInt(month as string);
    const yearNum = parseInt(calendarYear as string);

    if (monthNum < 1 || monthNum > 12) {
      return sendError(res, 'Invalid month. Must be between 1 and 12', 400);
    }

    // Validate: Only allow past or present months, not future months
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();

    if (yearNum > currentYear || (yearNum === currentYear && monthNum > currentMonth)) {
      return sendError(res, 'Cannot query future months. Only past or present months are allowed', 400);
    }

    // Fetch all monthly fees for the specified month/year with student and payment info
    const monthlyFees = await StudentMonthlyFee.findAll({
      where: {
        schoolId,
        month: monthNum,
        calendarYear: yearNum,
      },
      include: [
        {
          model: Student,
          as: 'student',
          attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'email', 'phone', 'studentPhoto'],
          include: [
            {
              model: StudentEnrollment,
              as: 'enrollments',
              include: [{ association: 'class', attributes: ['id', 'name'] }],
            },
          ],
        },
        {
          model: StudentFeePayment,
          as: 'payments',
          attributes: ['amountPaid'],
        },
      ],
    });

    // Filter students with dues (unpaid or partial payments)
    const studentsWithDues = monthlyFees
      .map((fee: any) => {
        const totalPayable = Number(fee.totalPayableAmount);
        const paidAmount = fee.payments?.reduce(
          (sum: number, p: any) => sum + Number(p.amountPaid),
          0
        ) || 0;
        const dueAmount = totalPayable - paidAmount;

        // Get class from enrollment matching this fee's session
        const enrollment = fee.student?.enrollments?.find(
          (e: any) => e.sessionId === fee.sessionId
        ) || fee.student?.enrollments?.[0];

        // Only include if there's a due amount
        if (dueAmount > 0) {
          return {
            studentId: fee.studentId,
            monthlyFeeId: fee.id,
            student: {
              ...fee.student.toJSON(),
              class: enrollment?.class || null,
            },
            totalPayableAmount: totalPayable,
            paidAmount,
            dueAmount,
            status: fee.status,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    return sendSuccess(res, studentsWithDues, 'Students with dues retrieved successfully');
  } catch (error) {
    console.error('Error fetching students with dues:', error);
    return sendError(res, 'Failed to fetch students with dues', 500);
  }
}
