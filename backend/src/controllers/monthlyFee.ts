import { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import Student from "../models/Student";
import StudentMonthlyFee, { StudentMonthlyFeeStatus } from "../models/StudentMonthlyFee";
import StudentMonthlyFeeItem, { FeeItemType, StudentMonthlyFeeItemCreationAttributes } from "../models/StudentMonthlyFeeItem";
import TransportationAreaPricing from "../models/TransportationAreaPricing";
import StudentFeePayment from "../models/StudentFeePayment";
import User from "../models/User";
import AcademicSession from "../models/AcademicSession";
import StudentEnrollment from "../models/StudentEnrollment";
import Class from "../models/Class";
import FeeHead from "../models/FeeHead";
import FeeHeadClassPricing from "../models/FeeHeadClassPricing";
import { Op } from "sequelize";
import logger from '../utils/logger';

const MONTH_NAMES = [
  '', 'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL',
  'MAY', 'JUNE', 'JULY', 'AUGUST',
  'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

interface GenerateFeeRequest {
  month: number;
  calendarYear: number;
  // New-style fee selection
  feeHeadIds?: number[];
  customAmounts?: { [feeHeadId: string]: number };
  notes?: { [feeHeadId: string]: string };
  transportationAreaId?: number;
  discount?: number;
  discountReason?: string;
}

export const generateMonthlyFee = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { month, calendarYear, feeHeadIds, customAmounts, notes, transportationAreaId, discount = 0, discountReason }: GenerateFeeRequest = req.body;
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

    // 3️⃣ Calculate fee items based on student's enrollment class
    const feeItems: StudentMonthlyFeeItemCreationAttributes[] = await calculateFeeItems(
      enrollment.classId,
      student.schoolId,
      { feeHeadIds, customAmounts, notes, transportationAreaId }
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
      feeType: item.feeType ?? null,
      feeHeadId: item.feeHeadId ?? null,
      feeHeadName: item.feeHeadName ?? null,
      note: item.note ?? null,
      amount: item.amount,
      transportationAreaId: item.transportationAreaId ?? null,
    }));

    await StudentMonthlyFeeItem.bulkCreate(feeItemsToCreate);

    // 8️⃣ Return the created monthly fee with items
    const createdFeeWithItems = await StudentMonthlyFee.findByPk(monthlyFee.id, {
      include: [
        {
          model: StudentMonthlyFeeItem,
          as: 'feeItems',
          attributes: ['id', 'feeType', 'feeHeadId', 'feeHeadName', 'note', 'amount']
        },
      ],
    });

    return sendSuccess(res, createdFeeWithItems, "Fee generated successfully", 201);
  } catch (error) {
    logger.error("Error generating monthly fee:", { error });
    return sendError(res, "Failed to generate monthly fee", 500);
  }
};

interface CalculateFeeOptions {
  feeHeadIds?: number[];
  customAmounts?: { [feeHeadId: string]: number };
  notes?: { [feeHeadId: string]: string };
  transportationAreaId?: number;
}

async function calculateFeeItems(
  classId: number,
  schoolId: number,
  options: CalculateFeeOptions
): Promise<StudentMonthlyFeeItemCreationAttributes[]> {
  const { feeHeadIds, customAmounts = {}, notes = {}, transportationAreaId } = options;

  try {
    const schoolFeeHeads = await FeeHead.findAll({
      where: { schoolId, isActive: true },
      order: [['displayOrder', 'ASC']],
    });

    return await calculateFeeItemsFromHeads(classId, schoolFeeHeads, {
      feeHeadIds,
      customAmounts,
      notes,
      transportationAreaId,
    });
  } catch (error) {
    logger.error("Error calculating fee items:", { error });
    throw error;
  }
}

async function calculateFeeItemsFromHeads(
  classId: number,
  feeHeads: FeeHead[],
  options: CalculateFeeOptions
): Promise<StudentMonthlyFeeItemCreationAttributes[]> {
  const { feeHeadIds, customAmounts = {}, notes = {}, transportationAreaId } = options;
  const feeItems: StudentMonthlyFeeItemCreationAttributes[] = [];

  // Pre-fetch all PER_CLASS pricing in one query
  const perClassFeeHeadIds = feeHeads
    .filter(fh => fh.pricingType === 'PER_CLASS')
    .map(fh => fh.id);
  const classPricings = perClassFeeHeadIds.length > 0
    ? await FeeHeadClassPricing.findAll({ where: { feeHeadId: perClassFeeHeadIds, classId } })
    : [];
  const classPricingMap = new Map(
    classPricings.map(p => [p.feeHeadId, parseFloat(p.amount.toString())])
  );

  // Pre-fetch transportation area pricing once if needed
  const hasAreaBased = feeHeads.some(fh => fh.pricingType === 'AREA_BASED');
  const transportPricing = (hasAreaBased && transportationAreaId)
    ? await TransportationAreaPricing.findByPk(transportationAreaId)
    : null;

  for (const feeHead of feeHeads) {
    const shouldInclude =
      feeHead.applicability === 'AUTO' ||
      (Array.isArray(feeHeadIds) && feeHeadIds.includes(feeHead.id));

    if (!shouldInclude) continue;

    let amount: number;
    let itemTransportationAreaId: number | null = null;

    switch (feeHead.pricingType) {
      case 'FLAT': {
        if (!feeHead.flatAmount) continue;
        amount = parseFloat(feeHead.flatAmount.toString());
        break;
      }
      case 'PER_CLASS': {
        const classAmount = classPricingMap.get(feeHead.id);
        if (classAmount === undefined) continue;
        amount = classAmount;
        break;
      }
      case 'AREA_BASED': {
        if (!transportPricing) continue;
        amount = parseFloat(transportPricing.price.toString());
        itemTransportationAreaId = transportationAreaId!;
        break;
      }
      case 'CUSTOM': {
        const customAmount = customAmounts[feeHead.id.toString()];
        if (customAmount === undefined) continue;
        amount = customAmount;
        break;
      }
      default:
        continue;
    }

    feeItems.push({
      feeType: feeHead.legacyType ? (feeHead.legacyType as FeeItemType) : null,
      feeHeadId: feeHead.id,
      feeHeadName: feeHead.name,
      note: notes[feeHead.id.toString()] ?? null,
      amount,
      transportationAreaId: itemTransportationAreaId,
    });
  }

  return feeItems;
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
        attributes: ['feeType', 'feeHeadId', 'feeHeadName', 'note', 'amount', 'transportationAreaId'],
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
      feeHeadId: item.feeHeadId,
      feeHeadName: item.feeHeadName,
      note: item.note,
      amount: Number(item.amount),
      transportationAreaId: item.transportationAreaId ?? null,
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
    logger.error('Error fetching student fee timeline', { error });
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
    logger.error('Error collecting fee payment', { error });
    return sendError(res, 'Failed to collect payment', 500);
  }
}

// Controller to get all incoming payments
export async function getAllIncomingPayments(req: Request, res: Response) {
  try {
    const {
      page,
      limit,
      fromDate,
      toDate,
      paymentMode
    } = req.query;

    const pageNum = page ? parseInt(page as string) : 1;
    const limitNum = limit ? parseInt(limit as string) : null;
    const offset = limitNum ? (pageNum - 1) * limitNum : 0;

    // Build where clause for filters
    const whereClause: any = { schoolId: req.schoolId };

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
      ...(limitNum !== null && { limit: limitNum, offset }),
    });

    // Batch fetch class info for all payments (avoids N+1 queries)
    const studentIds = [...new Set(payments.map((p: any) => p.studentId))];
    const sessionIds = [...new Set(payments.map((p: any) => (p.studentMonthlyFee as any)?.sessionId).filter(Boolean))];

    const enrollments = studentIds.length && sessionIds.length
      ? await StudentEnrollment.findAll({
          where: {
            studentId: { [Op.in]: studentIds },
            sessionId: { [Op.in]: sessionIds },
          },
          include: [{ model: Class, as: 'class', attributes: ['id', 'name'] }],
        })
      : [];

    const enrollmentMap = new Map<string, { className: string; classId: number | undefined }>();
    for (const enrollment of enrollments) {
      const key = `${(enrollment as any).studentId}-${(enrollment as any).sessionId}`;
      enrollmentMap.set(key, {
        className: (enrollment as any).class?.name || 'N/A',
        classId: (enrollment as any).class?.id,
      });
    }

    const paymentData = payments.map((pmt: any) => {
      const sessionId = (pmt.studentMonthlyFee as any)?.sessionId;
      const enrollmentInfo = sessionId
        ? (enrollmentMap.get(`${pmt.studentId}-${sessionId}`) ?? { className: 'N/A', classId: undefined })
        : { className: 'N/A', classId: undefined };

      return {
        id: pmt.id,
        studentId: pmt.studentId,
        studentName: `${pmt.student.firstName} ${pmt.student.lastName}`,
        admissionNumber: pmt.student.admissionNumber,
        className: enrollmentInfo.className,
        classId: enrollmentInfo.classId,
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
    });

    return sendSuccess(res, {
      payments: paymentData,
      pagination: {
        currentPage: pageNum,
        totalPages: limitNum ? Math.ceil(count / limitNum) : 1,
        totalItems: count,
        itemsPerPage: limitNum,
      },
    }, 'Incoming payments fetched successfully');
  } catch (error) {
    logger.error('Error fetching incoming payments', { error });
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
    logger.error('Error verifying payment', { error });
    return sendError(res, 'Failed to verify payment', 500);
  }
}

// Controller to regenerate monthly fee
export async function regenerateMonthlyFee(req: Request, res: Response) {
  try {
    const { studentId, monthlyFeeId } = req.params;
    const { month, calendarYear, feeHeadIds, customAmounts, notes, transportationAreaId, discount = 0, discountReason }: GenerateFeeRequest = req.body;
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

    // Recalculate fee items based on enrollment class
    const feeItems: StudentMonthlyFeeItemCreationAttributes[] = await calculateFeeItems(
      regenEnrollment.classId,
      student.schoolId,
      { feeHeadIds, customAmounts, notes, transportationAreaId }
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
      feeType: item.feeType ?? null,
      feeHeadId: item.feeHeadId ?? null,
      feeHeadName: item.feeHeadName ?? null,
      note: item.note ?? null,
      amount: item.amount,
      transportationAreaId: item.transportationAreaId ?? null,
    }));

    await StudentMonthlyFeeItem.bulkCreate(feeItemsToCreate);

    // Return the updated monthly fee with items
    const updatedFeeWithItems = await StudentMonthlyFee.findByPk(monthlyFeeId, {
      include: [
        {
          model: StudentMonthlyFeeItem,
          as: 'feeItems',
          attributes: ['id', 'feeType', 'feeHeadId', 'feeHeadName', 'note', 'amount']
        },
      ],
    });

    return sendSuccess(res, updatedFeeWithItems, "Fee regenerated successfully", 200);
  } catch (error) {
    logger.error("Error regenerating monthly fee:", { error });
    return sendError(res, "Failed to regenerate monthly fee", 500);
  }
}

// Get the most recently generated fee for a student (used to pre-populate fee generation form)
export async function getLastGeneratedFee(req: Request, res: Response) {
  try {
    const { studentId } = req.params;

    const fee = await StudentMonthlyFee.findOne({
      where: { studentId: parseInt(studentId), schoolId: 1 },
      order: [['calendarYear', 'DESC'], ['month', 'DESC']],
      include: [
        {
          model: StudentMonthlyFeeItem,
          as: 'feeItems',
          attributes: ['feeHeadId', 'feeHeadName', 'feeType', 'amount', 'note', 'transportationAreaId'],
        },
      ],
    });

    if (!fee) {
      return sendSuccess(res, null, "No generated fee found");
    }

    return sendSuccess(res, {
      feeItems: fee.feeItems?.map((item: any) => ({
        feeHeadId: item.feeHeadId,
        amount: Number(item.amount),
        note: item.note ?? null,
        transportationAreaId: item.transportationAreaId ?? null,
      })) ?? [],
      totalAdjustment: Number(fee.totalAdjustment),
      discountReason: fee.discountReason ?? null,
    });
  } catch (error) {
    logger.error("Error fetching last generated fee:", { error });
    return sendError(res, "Failed to fetch last generated fee", 500);
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
    logger.error('Error fetching fee dashboard', { error });
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
    logger.error('Error fetching students with dues', { error });
    return sendError(res, 'Failed to fetch students with dues', 500);
  }
}

// Controller to get active students who have NO fee generated for a specific month
export async function getStudentsWithoutFeesController(req: Request, res: Response) {
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

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (yearNum > currentYear || (yearNum === currentYear && monthNum > currentMonth)) {
      return sendError(res, 'Cannot query future months. Only past or present months are allowed', 400);
    }

    // Get the active academic session
    const activeSession = await AcademicSession.findOne({ where: { schoolId, isActive: true } });
    if (!activeSession) {
      return sendError(res, 'No active academic session found', 404);
    }

    // Last day of the queried month — students admitted after this date are excluded
    const lastDayOfQueriedMonth = new Date(yearNum, monthNum, 0); // day 0 of next month = last day of this month

    // Get all active students enrolled in the active session, with their class info
    // Only include students admitted on or before the last day of the queried month
    const enrollments = await StudentEnrollment.findAll({
      where: { sessionId: activeSession.id },
      include: [
        {
          model: Student,
          as: 'student',
          where: {
            schoolId,
            active: true,
            admissionDate: { [Op.lte]: lastDayOfQueriedMonth },
          },
          attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'studentPhoto'],
        },
        { model: Class, as: 'class', attributes: ['id', 'name'] },
      ],
    });

    // Get student IDs that already have a fee record for this month/year
    const existingFees = await StudentMonthlyFee.findAll({
      where: { schoolId, month: monthNum, calendarYear: yearNum },
      attributes: ['studentId'],
    });
    const feeStudentIds = new Set(existingFees.map((f: any) => f.studentId));

    // Return students who don't have a fee record
    const studentsWithoutFees = enrollments
      .filter((e: any) => !feeStudentIds.has(e.student.id))
      .map((e: any) => ({
        studentId: e.student.id,
        student: {
          ...e.student.toJSON(),
          class: (e as any).class || null,
        },
      }));

    return sendSuccess(res, studentsWithoutFees, 'Students without fees retrieved successfully');
  } catch (error) {
    logger.error('Error fetching students without fees', { error });
    return sendError(res, 'Failed to fetch students without fees', 500);
  }
}
