import { Request, Response } from "express";
import { sendError, sendSuccess } from "../utils/response";
import Student from "../models/Student";
import StudentMonthlyFee, { StudentMonthlyFeeStatus } from "../models/StudentMonthlyFee";
import StudentMonthlyFeeItem from "../models/StudentMonthlyFeeItem";
import FeeCategory from "../models/FeeCategory";
import ClassFeePricing from "../models/ClassFeePricing";
import TransportationAreaPricing from "../models/TransportationAreaPricing";
import {StudentMonthlyFeeItemCreationAttributes} from "../models/StudentMonthlyFeeItem";

interface GenerateFeeRequest {
  month: number;
  calendarYear: number;
  hostel?: boolean;
  transportationAreaId?: number;
  discount?: number;
  discountReason?: string;
}

interface CalculatedFeeItem {
  feeCategoryId: number;
  categoryName: string;
  configuredAmount: number;
  finalAmount: number;
  remarks?: string;
}

interface GenerateFeeRequest {
  month: number;
  calendarYear: number;
  hostel?: boolean;
  transportationAreaId?: number;
  discount?: number;
  discountReason?: string;
}



export const generateMonthlyFee = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const { month, calendarYear, hostel = false, transportationAreaId, discount = 0, discountReason }: GenerateFeeRequest = req.body;
    const userId = parseInt(req.userId);
    const schoolId = parseInt(req.schoolId);

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
      transportationAreaId
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
      feeCategoryId: item.feeCategoryId,
      amount: item.amount,
    }));

    await StudentMonthlyFeeItem.bulkCreate(feeItemsToCreate);

    // 8️⃣ Return the created monthly fee with items
    const createdFeeWithItems = await StudentMonthlyFee.findByPk(monthlyFee.id, {
      include: [
        {
          model: StudentMonthlyFeeItem,
          include: [FeeCategory],
        },
      ],
    });

    return sendSuccess(res, 201);
  } catch (error) {
    console.error("Error generating monthly fee:", error);
    return sendError(res, "Failed to generate monthly fee", 500);
  }
};

async function calculateFeeItems(
  classId: number,
  hostel: boolean,
  transportationAreaId?: number
): Promise<StudentMonthlyFeeItemCreationAttributes[]> {
  const feeItems: StudentMonthlyFeeItemCreationAttributes[] = [];

  try {
    // Get Tuition, Hostel, and Transportation fee categories
    const feeCategories = await FeeCategory.findAll();

    // Create a map for easy lookup
    const categoryMap = new Map<string, FeeCategory>();
    feeCategories.forEach(cat => categoryMap.set(cat.name, cat));

    // 1. Tuition Fee (always included)
    const tuitionCategory = categoryMap.get("Tuition Fee");
    if (tuitionCategory) {
      const classFeePricing = await ClassFeePricing.findOne({
        where: { classId },
      });

      if (classFeePricing && classFeePricing.amount) {
        feeItems.push({
          feeCategoryId: tuitionCategory.id,
          amount: parseFloat(classFeePricing.amount.toString())
        });
      }
    }

    // 2. Hostel Fee (if hostel is true)
    if (hostel) {
      const hostelCategory = categoryMap.get("Hostel Fee");
      if (hostelCategory) {
          feeItems.push({
            feeCategoryId: hostelCategory.id,
            amount: parseFloat(hostelCategory.fixedAmount.toString()),
          });
        // }
      }
    }

    // 3. Transportation Fee (if transportationAreaId is provided)
    if (transportationAreaId) {
      const transportCategory = categoryMap.get("Transport Fee");
      if (transportCategory) {
        const transportPricing = await TransportationAreaPricing.findByPk(transportationAreaId);

        if (transportPricing && transportPricing.price) {
          feeItems.push({
            feeCategoryId: transportCategory.id,
            amount: parseFloat(transportPricing.price.toString()),
          });
        }
      }
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
