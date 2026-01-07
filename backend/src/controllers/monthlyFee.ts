import { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import Student from "../models/Student";
import StudentMonthlyFee, { StudentMonthlyFeeStatus } from "../models/StudentMonthlyFee";
import StudentMonthlyFeeItem, { FeeItemType, StudentMonthlyFeeItemCreationAttributes } from "../models/StudentMonthlyFeeItem";
import ClassFeePricing from "../models/ClassFeePricing";
import TransportationAreaPricing from "../models/TransportationAreaPricing";
import StudentFeePayment from "../models/StudentFeePayment";
import User from "../models/User";

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
  discount?: number;
  discountReason?: string;
}

export const generateMonthlyFee = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { month, calendarYear, hostel = false, transportationAreaId, discount = 0, discountReason, newAdmission = false }: GenerateFeeRequest = req.body;
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

    //Check duplicate
    const existingFee = await StudentMonthlyFee.findOne({
      where: {
        studentId,
        month,
        calendarYear,
      },
    });

    if (existingFee) {
      return sendError(res, `Monthly fee already generated for ${month}/${calendarYear}`, 409);
    }

    //Verify student exists and get class info
    const student = await Student.findByPk(studentId);

    if (!student) {
      return sendError(res, "Student not found", 404);
    }

    if (!student.classId) {
      return sendError(res, "Student is not assigned to any class", 400);
    }

    // 3️⃣ Calculate fee items based on student's preferences
    const feeItems: StudentMonthlyFeeItemCreationAttributes[] = await calculateFeeItems(
      student.classId,
      hostel,
      transportationAreaId,
      newAdmission
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
  newAdmission?: boolean
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
      // TODO: Get hostel fee from configuration or settings
      // For now, using a default value - you may want to add this to a settings table
      const hostelFeeAmount = 3000; // Default hostel fee
      feeItems.push({
        feeType: FeeItemType.HOSTEL_FEE,
        amount: hostelFeeAmount,
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
      // TODO: Get admission fee from configuration or settings
      // For now, using a default value - you may want to add this to a settings table
      const admissionFeeAmount = 2000; // Default admission fee
      feeItems.push({
        feeType: FeeItemType.ADMISSION_FEE,
        amount: admissionFeeAmount,
      });
    }

    return feeItems;
  } catch (error) {
    console.error("Error calculating fee items:", error);
    throw error;
  }
}

// export const getStudentMonthlyFees = async (req: Request, res: Response) => {
//   try {
//     const { studentId } = req.params;
//     const { page = 1, limit = 10, month, year } = req.query;

//     const whereClause: any = { studentId };

//     if (month && year) {
//       whereClause.month = parseInt(month as string);
//       whereClause.calendarYear = parseInt(year as string);
//     }

//     const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

//     const { count, rows: monthlyFees } = await StudentMonthlyFee.findAndCountAll({
//       where: whereClause,
//       include: [
//         {
//           model: StudentMonthlyFeeItem,
//           include: [FeeCategory],
//         },
//       ],
//       limit: parseInt(limit as string),
//       offset,
//       order: [["calendarYear", "DESC"], ["month", "DESC"]],
//     });

//     return successResponse(res, "Student monthly fees retrieved successfully", {
//       monthlyFees,
//       pagination: {
//         currentPage: parseInt(page as string),
//         totalPages: Math.ceil(count / parseInt(limit as string)),
//         totalItems: count,
//         itemsPerPage: parseInt(limit as string),
//       },
//     });
//   } catch (error) {
//     console.error("Error fetching student monthly fees:", error);
//     return errorResponse(res, "Failed to fetch student monthly fees", 500);
//   }
// };

// export const getMonthlyFeeById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;

//     const monthlyFee = await StudentMonthlyFee.findByPk(id, {
//       include: [
//         {
//           model: StudentMonthlyFeeItem,
//           include: [FeeCategory],
//         },
//         {
//           model: Student,
//           attributes: ["id", "firstName", "lastName", "admissionNumber"],
//         },
//       ],
//     });

//     if (!monthlyFee) {
//       return errorResponse(res, "Monthly fee not found", 404);
//     }

//     return successResponse(res, "Monthly fee retrieved successfully", monthlyFee);
//   } catch (error) {
//     console.error("Error fetching monthly fee:", error);
//     return errorResponse(res, "Failed to fetch monthly fee", 500);
//   }
// };

// export const updateMonthlyFeeStatus = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     if (!status || !["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"].includes(status)) {
//       return errorResponse(res, "Invalid status", 400);
//     }

//     const monthlyFee = await StudentMonthlyFee.findByPk(id);
//     if (!monthlyFee) {
//       return errorResponse(res, "Monthly fee not found", 404);
//     }

//     await monthlyFee.update({ status });

//     return successResponse(res, "Monthly fee status updated successfully", monthlyFee);
//   } catch (error) {
//     console.error("Error updating monthly fee status:", error);
//     return errorResponse(res, "Failed to update monthly fee status", 500);
//   }
// };

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

  const admissionDate = new Date(student.createdAt);
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

  if (!amountPaid || amountPaid <= 0) {
    return sendError(res, 'Amount paid must be greater than 0', 400);
  }

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
    if (amountPaid > dueAmount) {
      return sendError(res, `Amount paid cannot exceed due amount of ₹${dueAmount.toLocaleString('en-IN')}`, 400);
    }

    // Create payment record
    const payment = await StudentFeePayment.create({
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
