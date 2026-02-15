import { Request, Response } from 'express';
import { Holiday } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Check if a date falls within any holiday range
export const checkHolidayOverlap = async (
  schoolId: number,
  startDate: Date,
  endDate: Date,
  excludeId?: number
): Promise<boolean> => {
  const whereClause: any = {
    schoolId,
    [Op.or]: [
      {
        startDate: { [Op.between]: [startDate, endDate] },
      },
      {
        endDate: { [Op.between]: [startDate, endDate] },
      },
      {
        [Op.and]: [
          { startDate: { [Op.lte]: startDate } },
          { endDate: { [Op.gte]: endDate } },
        ],
      },
    ],
  };

  if (excludeId) {
    whereClause.id = { [Op.ne]: excludeId };
  }

  const overlappingHoliday = await Holiday.findOne({
    where: whereClause,
  });

  return !!overlappingHoliday;
};

// Helper function to check if a date is Sunday
const isSunday = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0; // 0 = Sunday
};

// Check if a specific date is a holiday (including Sundays)
export const isHoliday = async (schoolId: number, date: Date): Promise<Holiday | null> => {
  // First check if it's a Sunday
  if (isSunday(date)) {
    // Return a virtual Sunday holiday object
    return {
      id: -1, // Special ID for Sunday
      schoolId,
      startDate: date,
      endDate: date,
      name: 'Sunday',
      reason: 'Weekly holiday',
      createdBy: -1,
      createdAt: date,
      updatedAt: date,
    } as Holiday;
  }

  // Check database holidays
  const holiday = await Holiday.findOne({
    where: {
      schoolId,
      startDate: { [Op.lte]: date },
      endDate: { [Op.gte]: date },
    },
  });
  return holiday;
};

// Create a new holiday
export const createHoliday = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  try {
    const { startDate, endDate, name, reason } = req.body;
    const schoolId = req.schoolId;
    const userId = req.userId;

    if (!schoolId || !userId) {
      return sendError(res, 'School ID or User ID not found in request', 400);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Validate endDate is not before startDate
    if (end < start) {
      return sendError(res, 'End date must be equal to or after start date', 400);
    }

    // Prevent creating single-day holidays on Sunday
    if (start.getTime() === end.getTime() && start.getDay() === 0) {
      return sendError(res, 'Cannot create a holiday on Sunday. Sundays are automatically considered holidays.', 400);
    }

    // Check for overlapping holidays
    const hasOverlap = await checkHolidayOverlap(
      parseInt(String(schoolId)),
      start,
      end
    );

    if (hasOverlap) {
      return sendError(res, 'Holiday overlaps with an existing holiday', 400);
    }

    const holiday = await Holiday.create({
      schoolId,
      startDate,
      endDate,
      name,
      reason,
      createdBy: userId,
    });

    return sendSuccess(res, holiday, 'Holiday created successfully');
  } catch (error) {
    console.error('Error creating holiday:', error);
    return sendError(res, 'Failed to create holiday', 500);
  }
};

// Get all holidays for a school (excluding single-day Sunday holidays)
export const getHolidays = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const { startDate, endDate } = req.query;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    const whereClause: any = { schoolId: parseInt(String(schoolId)) };

    // Filter by date range if provided
    if (startDate && endDate) {
      whereClause[Op.or] = [
        {
          startDate: { [Op.between]: [startDate, endDate] },
        },
        {
          endDate: { [Op.between]: [startDate, endDate] },
        },
        {
          [Op.and]: [
            { startDate: { [Op.lte]: startDate } },
            { endDate: { [Op.gte]: endDate } },
          ],
        },
      ];
    }

    const holidays = await Holiday.findAll({
      where: whereClause,
      order: [['startDate', 'DESC']],
      include: [
        {
          association: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    // Filter out single-day holidays that fall on Sunday
    // Multi-day holidays (like summer vacation) are always included, even if they contain Sundays
    const filteredHolidays = holidays.filter((holiday) => {
      const start = new Date(holiday.startDate);
      const end = new Date(holiday.endDate);
      
      // If it's a single day and it's a Sunday, exclude it
      if (start.getTime() === end.getTime()) {
        return start.getDay() !== 0; // Exclude if it's Sunday
      }
      
      // Include all multi-day holidays (vacations, etc.) even if they contain Sundays
      return true;
    });

    return sendSuccess(res, filteredHolidays, 'Holidays retrieved successfully');
  } catch (error) {
    console.error('Error fetching holidays:', error);
    return sendError(res, 'Failed to fetch holidays', 500);
  }
};

// Get a single holiday by ID
export const getHolidayById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    const holiday = await Holiday.findOne({
      where: { id: parseInt(id), schoolId: parseInt(String(schoolId)) },
      include: [
        {
          association: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    if (!holiday) {
      return sendError(res, 'Holiday not found', 404);
    }

    return sendSuccess(res, holiday, 'Holiday retrieved successfully');
  } catch (error) {
    console.error('Error fetching holiday:', error);
    return sendError(res, 'Failed to fetch holiday', 500);
  }
};

// Update a holiday
export const updateHoliday = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  try {
    const { id } = req.params;
    const { startDate, endDate, name, reason } = req.body;
    const schoolId = req.schoolId;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    const holiday = await Holiday.findOne({
      where: { id: parseInt(id), schoolId: parseInt(String(schoolId)) },
    });

    if (!holiday) {
      return sendError(res, 'Holiday not found', 404);
    }

    // Validate endDate is not before startDate (if provided)
    const newStartDate = startDate || holiday.startDate;
    const newEndDate = endDate || holiday.endDate;

    const start = new Date(newStartDate);
    const end = new Date(newEndDate);

    if (end < start) {
      return sendError(res, 'End date must be equal to or after start date', 400);
    }

    // Prevent updating to a single-day holiday on Sunday
    if (start.getTime() === end.getTime() && start.getDay() === 0) {
      return sendError(res, 'Cannot update holiday to Sunday. Sundays are automatically considered holidays.', 400);
    }

    // Check for overlapping holidays (excluding current holiday)
    const hasOverlap = await checkHolidayOverlap(
      parseInt(String(schoolId)),
      start,
      end,
      parseInt(id)
    );

    if (hasOverlap) {
      return sendError(res, 'Holiday overlaps with an existing holiday', 400);
    }

    await holiday.update({
      startDate: newStartDate,
      endDate: newEndDate,
      name: name || holiday.name,
      reason: reason !== undefined ? reason : holiday.reason,
    });

    const updatedHoliday = await Holiday.findByPk(id, {
      include: [
        {
          association: 'creator',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    return sendSuccess(res, updatedHoliday, 'Holiday updated successfully');
  } catch (error) {
    console.error('Error updating holiday:', error);
    return sendError(res, 'Failed to update holiday', 500);
  }
};

// Delete a holiday
export const deleteHoliday = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    const holiday = await Holiday.findOne({
      where: { id: parseInt(id), schoolId: parseInt(String(schoolId)) },
    });

    if (!holiday) {
      return sendError(res, 'Holiday not found', 404);
    }

    await holiday.destroy();

    return sendSuccess(res, null, 'Holiday deleted successfully');
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return sendError(res, 'Failed to delete holiday', 500);
  }
};

// Check if a specific date is a holiday (API endpoint)
export const checkIsHoliday = async (req: Request, res: Response) => {
  try {
    const { date } = req.params;
    const schoolId = req.schoolId;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    if (!date) {
      return sendError(res, 'Date is required', 400);
    }

    const checkDate = new Date(date);
    
    // Check if it's a Sunday
    if (checkDate.getDay() === 0) {
      return sendSuccess(
        res,
        { 
          isHoliday: true, 
          holiday: {
            id: -1,
            schoolId: parseInt(String(schoolId)),
            startDate: date,
            endDate: date,
            name: 'Sunday',
            reason: 'Weekly holiday',
            createdBy: -1,
            createdAt: checkDate,
            updatedAt: checkDate,
          }
        },
        'Date is a holiday (Sunday)'
      );
    }

    // Check database holidays
    const holiday = await Holiday.findOne({
      where: {
        schoolId: parseInt(String(schoolId)),
        startDate: { [Op.lte]: checkDate },
        endDate: { [Op.gte]: checkDate },
      },
    });

    if (!holiday) {
      return sendSuccess(res, { isHoliday: false }, 'Date is not a holiday');
    }

    return sendSuccess(
      res,
      { isHoliday: true, holiday },
      'Date is a holiday'
    );
  } catch (error) {
    console.error('Error checking holiday:', error);
    return sendError(res, 'Failed to check holiday', 500);
  }
};
