import { Request, Response } from 'express';
import { Attendance, Student, User, Holiday } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Helper function to check if a date is Sunday
const isSunday = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0; // 0 = Sunday
};

// Check if a specific date is a holiday (including Sundays)
const isHolidayCheck = async (schoolId: number, date: Date): Promise<Holiday | null> => {
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

// Bulk mark attendance
export const bulkMarkAttendance = async (req: Request, res: Response) => {
  const errorsResult = validationResult(req);
  if (!errorsResult.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errorsResult.array());
  }

  const { attendances } = req.body;
  const schoolId = req.schoolId;
  const userId = req.userId;

  if (!schoolId || !userId) {
    return sendError(res, 'School ID or User ID not found in request', 400);
  }

  if (!Array.isArray(attendances) || attendances.length === 0) {
    return sendError(res, 'Attendances array is required and cannot be empty', 400);
  }

  // Normalize date
  const attendanceDate = new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  // Holiday check (NO transaction)
  const holiday = await isHolidayCheck(Number(schoolId), attendanceDate);
  if (holiday) {
    return sendError(
      res,
      `Cannot mark attendance on holiday: ${holiday.name}`,
      400
    );
  }

  const studentIds = attendances.map((a: any) => a.studentId);

  // Fetch students in ONE query
  const students = await Student.findAll({
    where: {
      id: { [Op.in]: studentIds },
      schoolId,
    },
  });

  const studentMap = new Map(students.map(s => [s.id, s]));

  let successCount = 0;
  let failedCount = 0;
  const resultAttendances: any[] = [];
  const errors: any[] = [];

  // ✅ Managed transaction (auto commit / rollback)
  await sequelize.transaction(async (transaction) => {
    // Fetch existing attendance in bulk
    const existingAttendances = await Attendance.findAll({
      where: {
        studentId: { [Op.in]: studentIds },
        schoolId,
        date: attendanceDate,
      },
      transaction,
    });

    const attendanceMap = new Map(
      existingAttendances.map(a => [a.studentId, a])
    );

    for (const entry of attendances) {
      const { studentId, status, remarks } = entry;

      if (!studentId || !status) {
        errors.push({ studentId, error: 'Student ID and status are required' });
        failedCount++;
        continue;
      }

      if (!studentMap.has(studentId)) {
        errors.push({
          studentId,
          error: 'Student not found or does not belong to this school',
        });
        failedCount++;
        continue;
      }

      const existing = attendanceMap.get(studentId);

      if (existing) {
        await existing.update(
          {
            status,
            remarks: remarks || null,
            markedBy: userId,
          },
          { transaction }
        );
        resultAttendances.push(existing);
      } else {
        const created = await Attendance.create(
          {
            studentId,
            status,
            remarks: remarks || null,
            markedBy: userId,
            schoolId,
            date: attendanceDate,
          },
          { transaction }
        );
        resultAttendances.push(created);
      }

      successCount++;
    }

    if (successCount === 0) {
      throw new Error('All attendance records failed');
    }
  });

  // Fetch enriched response AFTER commit
  const attendancesWithDetails = await Attendance.findAll({
    where: { id: resultAttendances.map(a => a.id) },
    include: [
      {
        association: 'student',
        attributes: ['id', 'firstName', 'lastName', 'rollNumber'],
      },
      {
        association: 'markedByUser',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
  });

  return sendSuccess(
    res,
    {
      success: successCount,
      failed: failedCount,
      attendances: attendancesWithDetails,
      errors: errors.length ? errors : undefined,
    },
    `Attendance marked successfully for ${successCount} student(s)${
      failedCount ? `. ${failedCount} failed.` : ''
    }`
  );
};

// Get attendance records
export const getAttendance = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const { date, classId, sectionId, studentId } = req.query;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    const whereClause: any = { schoolId };

    if (date) {
      whereClause.date = date;
    }

    if (studentId) {
      whereClause.studentId = studentId;
    }

    // If classId or sectionId provided, need to join with Student
    let includeOptions: any[] = [
      {
        association: 'student',
        attributes: ['id', 'firstName', 'lastName', 'rollNumber'],
        include: [],
      },
      {
        association: 'markedByUser',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ];

    if (classId || sectionId) {
      includeOptions[0].include.push(
        {
          association: 'class',
          attributes: ['id', 'name'],
          where: classId ? { id: classId } : undefined,
          required: !!classId,
        },
        {
          association: 'section',
          attributes: ['id', 'name'],
          where: sectionId ? { id: sectionId } : undefined,
          required: !!sectionId,
        }
      );
    }

    const attendances = await Attendance.findAll({
      where: whereClause,
      include: includeOptions,
      order: [['date', 'DESC'], [{ model: Student, as: 'student' }, 'rollNumber', 'ASC']],
    });

    return sendSuccess(res, attendances, 'Attendance records retrieved successfully');
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return sendError(res, 'Failed to fetch attendance records', 500);
  }
};

// Get single attendance record
export const getAttendanceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    const attendance = await Attendance.findOne({
      where: { id, schoolId },
      include: [
        {
          association: 'student',
          attributes: ['id', 'firstName', 'lastName', 'rollNumber'],
          include: [
            { association: 'class', attributes: ['id', 'name'] },
            { association: 'section', attributes: ['id', 'name'] },
          ],
        },
        {
          association: 'markedByUser',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    if (!attendance) {
      return sendError(res, 'Attendance record not found', 404);
    }

    return sendSuccess(res, attendance, 'Attendance record retrieved successfully');
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return sendError(res, 'Failed to fetch attendance record', 500);
  }
};

// Update attendance record
export const updateAttendance = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  try {
    const { id } = req.params;
    const { status, remarks } = req.body;
    const schoolId = req.schoolId;
    const userId = req.userId;

    if (!schoolId || !userId) {
      return sendError(res, 'School ID or User ID not found in request', 400);
    }

    const attendance = await Attendance.findOne({
      where: { id, schoolId },
    });

    if (!attendance) {
      return sendError(res, 'Attendance record not found', 404);
    }

    // Validate date is not in the future
    const attendanceDate = new Date(attendance.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    attendanceDate.setHours(0, 0, 0, 0);

    if (attendanceDate > today) {
      return sendError(res, 'Cannot modify attendance for future dates', 400);
    }

    // Check if the date is a holiday
    const holiday = await isHolidayCheck(parseInt(String(schoolId)), attendanceDate);
    if (holiday) {
      return sendError(
        res,
        `Cannot modify attendance on holiday: ${holiday.name}`,
        400
      );
    }

    await attendance.update({
      status: status || attendance.status,
      remarks: remarks !== undefined ? remarks : attendance.remarks,
      markedBy: userId,
    });

    const updatedAttendance = await Attendance.findByPk(id, {
      include: [
        {
          association: 'student',
          attributes: ['id', 'firstName', 'lastName', 'rollNumber'],
        },
        {
          association: 'markedByUser',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    return sendSuccess(res, updatedAttendance, 'Attendance record updated successfully');
  } catch (error) {
    console.error('Error updating attendance:', error);
    return sendError(res, 'Failed to update attendance record', 500);
  }
};

// Get all attendance statistics for all classes/sections at once
export const getAllAttendanceStats = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const { date } = req.query;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    if (!date) {
      return sendError(res, 'Date is required', 400);
    }

    // Get all active students in the school (single query)
    const students = await Student.findAll({
      where: { schoolId, active: true },
      attributes: ['id', 'classId', 'sectionId'],
    });

    if (students.length === 0) {
      return sendSuccess(
        res,
        { date, classStats: [] },
        'All attendance statistics retrieved successfully'
      );
    }

    // Get all attendance records for this date in the school
    const attendances = await Attendance.findAll({
      where: { schoolId, date },
    });

    // Check if the date is a holiday
    const holiday = await isHolidayCheck(parseInt(String(schoolId)), new Date(date as string));

    // Group students by class/section
    const classSectionGroups = new Map<string, Array<typeof students[0]>>();
    students.forEach((s) => {
      const key = `${s.classId}-${s.sectionId}`;
      if (!classSectionGroups.has(key)) {
        classSectionGroups.set(key, []);
      }
      classSectionGroups.get(key)?.push(s);
    });

    // Group attendances by student
    const attendanceByStudent = new Map<number, typeof attendances[0]>();
    attendances.forEach((a) => {
      attendanceByStudent.set(a.studentId, a);
    });

    // Get class and section names
    const Class = require('../models/Class').default;
    const Section = require('../models/Section').default;

    const classes = await Class.findAll({
      where: { schoolId },
      attributes: ['id', 'name']
    });

    const sections = await Section.findAll({
      where: { schoolId },
      attributes: ['id', 'name']
    });

    const classMap = new Map(classes.map((c: any) => [c.id, c.name]));
    const sectionMap = new Map(sections.map((s: any) => [s.id, s.name]));

    // Build stats for each class/section combination
    const allStats = [];

    for (const [key, groupStudents] of classSectionGroups) {
      const [classId, sectionId] = key.split('-').map(Number);
      const totalStudents = groupStudents.length;

      let presentCount = 0;
      let absentCount = 0;

      groupStudents.forEach((s) => {
        const attendance = attendanceByStudent.get(s.id);
        if (attendance) {
          if (attendance.status === 'PRESENT') presentCount++;
          else if (attendance.status === 'ABSENT') absentCount++;
        }
      });

      const totalCount = presentCount + absentCount;
      const workingDays = totalStudents; // Treat not marked as absent
      const attendancePercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : '0';

      allStats.push({
        classId,
        className: classMap.get(classId) || `Class ${classId}`,
        sectionId,
        sectionName: sectionMap.get(sectionId) || `Section ${sectionId}`,
        date,
        presentCount,
        absentCount,
        totalMarked: totalCount,
        totalStudents,
        attendancePercentage: parseFloat(attendancePercentage),
        notMarked: totalStudents - totalCount,
        isHoliday: !!holiday,
        holidayName: holiday ? holiday.name : null
      });
    }

    // Sort by class name then section name
    allStats.sort((a: any, b: any) => {
      const aClassName = String(a.className);
      const bClassName = String(b.className);
      if (aClassName !== bClassName) {
        return aClassName.localeCompare(bClassName);
      }
      const aSectionName = String(a.sectionName);
      const bSectionName = String(b.sectionName);
      return aSectionName.localeCompare(bSectionName);
    });

    return sendSuccess(
      res,
      {
        date,
        classStats: allStats,
        isHoliday: !!holiday,
        holidayName: holiday ? holiday.name : null
      },
      'All attendance statistics retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching all attendance statistics:', error);
    return sendError(res, 'Failed to fetch all attendance statistics', 500);
  }
};

// Get attendance statistics
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const { date, classId, sectionId } = req.query;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    if (!date) {
      return sendError(res, 'Date is required', 400);
    }

    // Build student filter conditions
    const studentWhereClause: any = { schoolId, active: true };
    if (classId) {
      studentWhereClause.classId = classId;
    }
    if (sectionId) {
      studentWhereClause.sectionId = sectionId;
    }

    // Get total students in class/section
    const totalStudents = await Student.count({
      where: studentWhereClause,
    });

    // Get students matching the filter
    const students = await Student.findAll({
      where: studentWhereClause,
      attributes: ['id'],
    });

    const studentIds = students.map(s => s.id);

    // Get attendance for these students on the specified date
    const whereClause: any = { 
      schoolId, 
      date,
      studentId: { [Op.in]: studentIds }
    };

    const attendances = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          association: 'student',
          attributes: ['id', 'classId', 'sectionId'],
        },
      ],
    });

    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const totalCount = attendances.length;

    // Check if the date is a holiday
    const holiday = await isHolidayCheck(parseInt(String(schoolId)), new Date(date as string));

    // Calculate attendance percentage treating not marked as absent
    // Formula: (Present / Total Students) * 100
    const attendancePercentage = totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : '0';

    return sendSuccess(
      res,
      {
        date,
        presentCount,
        absentCount,
        totalMarked: totalCount,
        totalStudents,
        attendancePercentage: parseFloat(attendancePercentage),
        holidayCount: holiday ? 1 : 0,
        isHoliday: !!holiday,
        holidayName: holiday ? holiday.name : null,
        notMarked: totalStudents - totalCount,
      },
      'Attendance statistics retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    return sendError(res, 'Failed to fetch attendance statistics', 500);
  }
};

// Get students with today's attendance status
export const getStudentsWithAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, sectionId } = req.params;
    const { date } = req.query;
    const schoolId = req.schoolId;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    if (!date) {
      return sendError(res, 'Date is required', 400);
    }

    const attendanceDate = new Date(date as string);

    // Get all active students for the class/section
    const students = await Student.findAll({
      where: {
        classId: parseInt(classId),
        sectionId: parseInt(sectionId),
        schoolId,
        active: true, // Only show active students
      },
      include: [
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
      ],
      order: [['rollNumber', 'ASC']],
    });

    // Get attendance for the date
    const attendanceRecords = await Attendance.findAll({
      where: {
        schoolId,
        date: attendanceDate,
        studentId: { [Op.in]: students.map((s) => s.id) },
      },
    });

    // Create a map of studentId -> attendance
    const attendanceMap = new Map(
      attendanceRecords.map((a) => [a.studentId, { id: a.id, status: a.status, remarks: a.remarks }])
    );

    // Get all student IDs
    const studentIds = students.map((s) => s.id);

    // For each student, find the last present date
    const lastPresentDatesMap = new Map<number, Date>();
    if (studentIds.length > 0) {
      const lastPresentRecords = await Attendance.findAll({
        where: {
          schoolId,
          studentId: { [Op.in]: studentIds },
          status: 'PRESENT',
          date: { [Op.lte]: attendanceDate },
        },
        attributes: ['studentId', [sequelize.fn('MAX', sequelize.col('date')), 'lastPresentDate']],
        group: ['studentId'],
        raw: true,
      });

      // Process the results - Sequelize returns different format for grouped queries
      const studentLastPresentPromises = studentIds.map(async (studentId) => {
        const lastPresent = await Attendance.findOne({
          where: {
            schoolId,
            studentId,
            status: 'PRESENT',
            date: { [Op.lte]: attendanceDate },
          },
          attributes: ['date'],
          order: [['date', 'DESC']],
          limit: 1,
        });
        if (lastPresent) {
          lastPresentDatesMap.set(studentId, new Date(lastPresent.date));
        }
      });

      await Promise.all(studentLastPresentPromises);
    }

    // Calculate days absent since last present for each student
    const attendanceDateObj = new Date(attendanceDate);
    attendanceDateObj.setHours(0, 0, 0, 0);

    // Combine students with their attendance status and absent days
    const studentsWithAttendance = students.map((student) => {
      const attendance = attendanceMap.get(student.id);
      const lastPresentDate = lastPresentDatesMap.get(student.id);
      
      let daysAbsentSinceLastPresent: number | null = null;
      if (lastPresentDate) {
        const daysDiff = Math.floor((attendanceDateObj.getTime() - lastPresentDate.getTime()) / (1000 * 60 * 60 * 24));
        daysAbsentSinceLastPresent = daysDiff > 0 ? daysDiff : null;
      }

      return {
        ...student.toJSON(),
        attendance: attendance || null,
        daysAbsentSinceLastPresent: daysAbsentSinceLastPresent,
      };
    });

    return sendSuccess(res, studentsWithAttendance, 'Students with attendance status retrieved successfully');
  } catch (error) {
    console.error('Error fetching students with attendance:', error);
    return sendError(res, 'Failed to fetch students with attendance status', 500);
  }
};

// Get student's all-time attendance calendar
export const getStudentAttendanceCalendar = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.schoolId;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    // Get student details
    const student = await Student.findOne({
      where: { id: parseInt(studentId), schoolId },
      include: [
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
      ],
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Get all attendance records for the student
    const attendances = await Attendance.findAll({
      where: {
        studentId: parseInt(studentId),
        schoolId,
      },
      order: [['date', 'ASC']],
    });

    // Get all holidays for the school
    const holidays = await Holiday.findAll({
      where: { schoolId },
      order: [['startDate', 'ASC']],
    });

    // Create a map of date -> attendance status
    const attendanceMap = new Map<string, any>();
    attendances.forEach((a) => {
      const dateStr = a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date);
      attendanceMap.set(dateStr, {
        date: dateStr,
        status: a.status,
        remarks: a.remarks,
      });
    });

    // Create a map of date -> holiday info
    const holidayMap = new Map<string, any>();
    holidays.forEach((h) => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      const current = new Date(start);
      
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        holidayMap.set(dateStr, {
          date: dateStr,
          status: 'HOLIDAY',
          name: h.name,
          reason: h.reason,
        });
        current.setDate(current.getDate() + 1);
      }
    });

    // Add all Sundays as holidays (if not already in holiday map or attendance)
    // Determine date range: from student admission date (or 2 years ago) to today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate: Date;
    if (student.admissionDate) {
      startDate = new Date(student.admissionDate);
      startDate.setHours(0, 0, 0, 0);
    } else {
      // If no admission date, go back 2 years
      startDate = new Date(today);
      startDate.setFullYear(today.getFullYear() - 2);
    }
    
    // Find the first Sunday on or before the start date
    const firstSunday = new Date(startDate);
    const dayOfWeek = firstSunday.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    firstSunday.setDate(firstSunday.getDate() - daysToSubtract);
    
    // Add all Sundays from start date to today
    const currentSunday = new Date(firstSunday);
    while (currentSunday <= today) {
      const dateStr = currentSunday.toISOString().split('T')[0];
      // Only add if not already in holiday map (from database holidays)
      // Note: We add Sundays even if there's attendance, but attendance will take precedence in merge
      if (!holidayMap.has(dateStr)) {
        holidayMap.set(dateStr, {
          date: dateStr,
          status: 'HOLIDAY',
          name: 'Sunday',
          reason: 'Weekly holiday',
        });
      }
      // Move to next Sunday
      currentSunday.setDate(currentSunday.getDate() + 7);
    }

    // Merge attendance and holidays into a single array
    const combinedRecords = new Map<string, any>();

    // Add attendance records
    attendanceMap.forEach((value, key) => {
      combinedRecords.set(key, value);
    });

    // Add holidays (only if not already present in attendance)
    holidayMap.forEach((value, key) => {
      if (!combinedRecords.has(key)) {
        combinedRecords.set(key, value);
      }
    });

    // Convert to array and sort by date
    const allRecords = Array.from(combinedRecords.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Calculate summary
    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const workingDays = presentCount + absentCount;
    const attendancePercentage =
      workingDays > 0 ? ((presentCount / workingDays) * 100).toFixed(2) : '0';

    // Count total holidays (including Sundays)
    let totalHolidayDays = 0;
    holidays.forEach((h) => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      totalHolidayDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    });
    
    // Count Sundays that are in the date range and not already counted in holidays
    const sundayCount = Array.from(holidayMap.values()).filter((h: any) => 
      h.name === 'Sunday' && !attendanceMap.has(h.date)
    ).length;
    totalHolidayDays += sundayCount;

    return sendSuccess(
      res,
      {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        class: (student as any).class?.name,
        section: (student as any).section?.name,
        attendanceRecords: allRecords,
        summary: {
          totalPresent: presentCount,
          totalAbsent: absentCount,
          totalHolidays: totalHolidayDays,
          totalWorkingDays: workingDays,
          attendancePercentage: parseFloat(attendancePercentage),
        },
      },
      'Student attendance calendar retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching student attendance calendar:', error);
    return sendError(res, 'Failed to fetch student attendance calendar', 500);
  }
};
