import { Request, Response } from 'express';
import { Attendance, Student, Holiday, AcademicSession, StudentEnrollment } from '../models';
import { AttendanceType } from '../models/Attendance';
import { sendSuccess, sendError } from '../utils/response';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import logger from '../utils/logger';

// Helper function to check if a date is Sunday
const isSunday = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0; // 0 = Sunday
};

// Check if a specific date is a holiday (including Sundays)
const isHolidayCheck = async (schoolId: number, date: Date): Promise<Holiday | null> => {
  // First check if it's a Sunday
  if (isSunday(date)) {
    return {
      id: -1,
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

  const { attendances, attendanceType = AttendanceType.CLASS } = req.body;
  const schoolId = req.schoolId;
  const userId = req.userId;

  if (!schoolId || !userId) {
    return sendError(res, 'School ID or User ID not found in request', 400);
  }

  if (!Array.isArray(attendances) || attendances.length === 0) {
    return sendError(res, 'Attendances array is required and cannot be empty', 400);
  }

  // Normalize date to today
  const attendanceDate = new Date();
  attendanceDate.setHours(0, 0, 0, 0);

  // Holiday check (NO transaction)
  const holiday = await isHolidayCheck(Number(schoolId), attendanceDate);
  if (holiday) {
    return sendError(res, `Cannot mark attendance on holiday: ${holiday.name}`, 400);
  }

  // Derive academic session from the attendance date
  const session = await AcademicSession.findOne({
    where: {
      schoolId,
      startDate: { [Op.lte]: attendanceDate },
      endDate: { [Op.gte]: attendanceDate },
    },
  });
  if (!session) {
    return sendError(res, 'No academic session covers the attendance date', 400);
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

  // Managed transaction (auto commit / rollback)
  await sequelize.transaction(async (transaction) => {
    // Fetch existing attendance in bulk
    const existingAttendances = await Attendance.findAll({
      where: {
        studentId: { [Op.in]: studentIds },
        schoolId,
        date: attendanceDate,
        attendanceType,
      },
      transaction,
    });

    const attendanceMap = new Map(existingAttendances.map(a => [`${a.studentId}-${a.attendanceType}`, a]));

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

      const existing = attendanceMap.get(`${studentId}-${attendanceType}`);

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
            sessionId: session.id,
            attendanceType,
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
        attributes: ['id', 'firstName', 'lastName'],
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
    `Attendance marked successfully for ${successCount} student(s)${failedCount ? `. ${failedCount} failed.` : ''}`
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

    // If classId or sectionId provided, filter via enrollment
    if (classId || sectionId) {
      const enrollmentWhere: any = {};
      if (classId) enrollmentWhere.classId = classId;
      if (sectionId) enrollmentWhere.sectionId = sectionId;

      // Derive session from date if provided
      if (date) {
        const queryDate = new Date(date as string);
        const session = await AcademicSession.findOne({
          where: {
            schoolId,
            startDate: { [Op.lte]: queryDate },
            endDate: { [Op.gte]: queryDate },
          },
        });
        if (session) enrollmentWhere.sessionId = session.id;
      }

      const enrollments = await StudentEnrollment.findAll({
        where: enrollmentWhere,
        attributes: ['studentId'],
      });
      whereClause.studentId = { [Op.in]: enrollments.map((e: any) => e.studentId) };
    }

    const attendances = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          association: 'student',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          association: 'markedByUser',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
      order: [['date', 'DESC']],
    });

    return sendSuccess(res, attendances, 'Attendance records retrieved successfully');
  } catch (error) {
    logger.error('Error fetching attendance', { error });
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
          attributes: ['id', 'firstName', 'lastName'],
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
    logger.error('Error fetching attendance', { error });
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
      return sendError(res, `Cannot modify attendance on holiday: ${holiday.name}`, 400);
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
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          association: 'markedByUser',
          attributes: ['id', 'firstName', 'lastName'],
        },
      ],
    });

    return sendSuccess(res, updatedAttendance, 'Attendance record updated successfully');
  } catch (error) {
    logger.error('Error updating attendance', { error });
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

    const queryDate = new Date(date as string);

    // Use active session for the school
    const session = await AcademicSession.findOne({
      where: { schoolId, isActive: true },
    });

    if (!session) {
      return sendSuccess(
        res,
        { date, classStats: [] },
        'All attendance statistics retrieved successfully'
      );
    }

    // Get all enrollments for this session (active students only)
    const enrollments = await StudentEnrollment.findAll({
      where: { sessionId: session.id },
      include: [
        { association: 'student', where: { schoolId, active: true }, attributes: ['id'] },
      ],
      attributes: ['studentId', 'classId', 'sectionId'],
    });

    if (enrollments.length === 0) {
      return sendSuccess(
        res,
        { date, classStats: [] },
        'All attendance statistics retrieved successfully'
      );
    }

    // Get all attendance records for this date in the school (class attendance only)
    const attendances = await Attendance.findAll({
      where: { schoolId, date, attendanceType: AttendanceType.CLASS },
    });

    // Check if the date is a holiday
    const holiday = await isHolidayCheck(parseInt(String(schoolId)), queryDate);

    // Group enrollments by class/section
    const classSectionGroups = new Map<string, Array<any>>();
    enrollments.forEach((e: any) => {
      const key = `${e.classId}-${e.sectionId}`;
      if (!classSectionGroups.has(key)) {
        classSectionGroups.set(key, []);
      }
      classSectionGroups.get(key)?.push(e);
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
      where: { sessionId: session.id },
      attributes: ['id', 'name'],
    });

    const classIds = enrollments.map((e: any) => e.classId);
    const sections = await Section.findAll({
      where: { classId: { [Op.in]: classIds } },
      attributes: ['id', 'name'],
    });

    const classMap = new Map(classes.map((c: any) => [c.id, c.name]));
    const sectionMap = new Map(sections.map((s: any) => [s.id, s.name]));

    // Build stats for each class/section combination
    const allStats = [];

    for (const [key, groupEnrollments] of classSectionGroups) {
      const [classId, sectionId] = key.split('-').map(Number);
      const totalStudents = groupEnrollments.length;

      let presentCount = 0;
      let absentCount = 0;

      groupEnrollments.forEach((e: any) => {
        const attendance = attendanceByStudent.get(e.studentId);
        if (attendance) {
          if (attendance.status === 'PRESENT') presentCount++;
          else if (attendance.status === 'ABSENT') absentCount++;
        }
      });

      const totalCount = presentCount + absentCount;
      const attendancePercentage =
        totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : '0';

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
        holidayName: holiday ? holiday.name : null,
      });
    }

    // Sort by class name then section name
    allStats.sort((a: any, b: any) => {
      const aClassName = String(a.className);
      const bClassName = String(b.className);
      if (aClassName !== bClassName) {
        return aClassName.localeCompare(bClassName);
      }
      return String(a.sectionName).localeCompare(String(b.sectionName));
    });

    return sendSuccess(
      res,
      {
        date,
        classStats: allStats,
        isHoliday: !!holiday,
        holidayName: holiday ? holiday.name : null,
      },
      'All attendance statistics retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching all attendance statistics', { error });
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

    const queryDate = new Date(date as string);

    // Derive session from date
    const session = await AcademicSession.findOne({
      where: {
        schoolId,
        startDate: { [Op.lte]: queryDate },
        endDate: { [Op.gte]: queryDate },
      },
    });

    // Get student IDs via enrollments filtered by session/class/section
    let studentIds: number[] = [];
    if (session) {
      const enrollmentWhere: any = { sessionId: session.id };
      if (classId) enrollmentWhere.classId = classId;
      if (sectionId) enrollmentWhere.sectionId = sectionId;

      const enrollments = await StudentEnrollment.findAll({
        where: enrollmentWhere,
        include: [
          { association: 'student', where: { schoolId, active: true }, attributes: ['id'] },
        ],
        attributes: ['studentId'],
      });
      studentIds = enrollments.map((e: any) => e.studentId);
    } else {
      // No session covers this date — count active students in school
      const students = await Student.findAll({
        where: { schoolId, active: true },
        attributes: ['id'],
      });
      studentIds = students.map((s) => s.id);
    }

    const totalStudents = studentIds.length;

    // Get attendance for these students on the specified date (class attendance only)
    const whereClause: any = {
      schoolId,
      date,
      studentId: { [Op.in]: studentIds },
      attendanceType: AttendanceType.CLASS,
    };

    const attendances = await Attendance.findAll({ where: whereClause });

    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const totalCount = attendances.length;

    // Check if the date is a holiday
    const holiday = await isHolidayCheck(parseInt(String(schoolId)), queryDate);

    const attendancePercentage =
      totalStudents > 0 ? ((presentCount / totalStudents) * 100).toFixed(2) : '0';

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
    logger.error('Error fetching attendance statistics', { error });
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

    // Use active session for the school
    const session = await AcademicSession.findOne({
      where: { schoolId, isActive: true },
    });

    const enrollmentWhere: any = {
      classId: parseInt(classId),
      sectionId: parseInt(sectionId),
    };
    if (session) enrollmentWhere.sessionId = session.id;

    // Get active students in this class/section via enrollment
    const enrollments = await StudentEnrollment.findAll({
      where: enrollmentWhere,
      include: [
        {
          association: 'student',
          where: { schoolId, active: true },
        },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
      ],
      order: [['rollNumber', 'ASC']],
    });

    const studentIds = enrollments.map((e: any) => e.studentId);

    // Get attendance for the date (class attendance only)
    const attendanceRecords = await Attendance.findAll({
      where: {
        schoolId,
        date: attendanceDate,
        studentId: { [Op.in]: studentIds },
        attendanceType: AttendanceType.CLASS,
      },
    });

    // Create a map of studentId -> attendance
    const attendanceMap = new Map(
      attendanceRecords.map((a) => [a.studentId, { id: a.id, status: a.status, remarks: a.remarks }])
    );

    // For each student, find the last present date
    const lastPresentDatesMap = new Map<number, Date>();
    if (studentIds.length > 0) {
      const studentLastPresentPromises = studentIds.map(async (studentId) => {
        const lastPresent = await Attendance.findOne({
          where: {
            schoolId,
            studentId,
            status: 'PRESENT',
            date: { [Op.lte]: attendanceDate },
            attendanceType: AttendanceType.CLASS,
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

    const attendanceDateObj = new Date(attendanceDate);
    attendanceDateObj.setHours(0, 0, 0, 0);

    // Combine students with their attendance status
    const studentsWithAttendance = enrollments.map((enrollment: any) => {
      const student = enrollment.student;
      const attendance = attendanceMap.get(enrollment.studentId);
      const lastPresentDate = lastPresentDatesMap.get(enrollment.studentId);

      let daysAbsentSinceLastPresent: number | null = null;
      if (lastPresentDate) {
        const daysDiff = Math.floor(
          (attendanceDateObj.getTime() - lastPresentDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysAbsentSinceLastPresent = daysDiff > 0 ? daysDiff : null;
      }

      return {
        ...student.toJSON(),
        rollNumber: enrollment.rollNumber,
        class: enrollment.class,
        section: enrollment.section,
        attendance: attendance || null,
        daysAbsentSinceLastPresent,
      };
    });

    return sendSuccess(res, studentsWithAttendance, 'Students with attendance status retrieved successfully');
  } catch (error) {
    logger.error('Error fetching students with attendance', { error });
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
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Get most recent enrollment for class/section info
    const currentEnrollment = await StudentEnrollment.findOne({
      where: { studentId: student.id },
      include: [
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
      ],
      order: [['promotedAt', 'DESC']],
    });

    // Scope to active session
    const session = await AcademicSession.findOne({
      where: { schoolId, isActive: true },
    });
    if (!session) {
      return sendSuccess(
        res,
        {
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          hostel: student.hostel,
          dayboarding: student.dayboarding,
          class: (currentEnrollment as any)?.class?.name || null,
          section: (currentEnrollment as any)?.section?.name || null,
          attendanceRecords: [],
          summary: {
            class: { totalPresent: 0, totalAbsent: 0, totalWorkingDays: 0, attendancePercentage: 0 },
            totalHolidays: 0,
          },
        },
        'No active academic session'
      );
    }
    const sessionStart = new Date(session.startDate);
    sessionStart.setHours(0, 0, 0, 0);

    // Get attendance records scoped to active session
    const attendances = await Attendance.findAll({
      where: {
        studentId: parseInt(studentId),
        schoolId,
        date: { [Op.gte]: sessionStart },
      },
      order: [['date', 'ASC']],
    });

    // Get holidays on/after session start
    const holidays = await Holiday.findAll({
      where: {
        schoolId,
        endDate: { [Op.gte]: sessionStart },
      },
      order: [['startDate', 'ASC']],
    });

    // Build holiday map (date -> holiday entry)
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

    // Add Sundays as holidays starting from session start
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstSunday = new Date(sessionStart);
    const dayOfWeek = firstSunday.getDay();
    if (dayOfWeek !== 0) firstSunday.setDate(firstSunday.getDate() + (7 - dayOfWeek));

    const currentSunday = new Date(firstSunday);
    while (currentSunday <= today) {
      const dateStr = currentSunday.toISOString().split('T')[0];
      if (!holidayMap.has(dateStr)) {
        holidayMap.set(dateStr, {
          date: dateStr,
          status: 'HOLIDAY',
          name: 'Sunday',
          reason: 'Weekly holiday',
        });
      }
      currentSunday.setDate(currentSunday.getDate() + 7);
    }

    // Build attendance records — each record includes its attendanceType
    // Multiple records can share the same date (e.g. CLASS + HOSTEL on same day)
    const attendanceDateSet = new Set<string>();
    const attendanceRecordsList = attendances.map((a) => {
      const dateStr = a.date instanceof Date ? a.date.toISOString().split('T')[0] : String(a.date);
      attendanceDateSet.add(dateStr);
      return {
        date: dateStr,
        status: a.status,
        attendanceType: a.attendanceType,
        remarks: a.remarks || null,
      };
    });

    // Add holidays for dates that don't have any attendance record (or always add as separate entries)
    const holidayRecords: any[] = [];
    holidayMap.forEach((value) => {
      holidayRecords.push(value);
    });

    // Combine: attendance records + holiday records, sorted by date
    const allRecords = [
      ...attendanceRecordsList,
      ...holidayRecords,
    ].sort((a, b) => a.date.localeCompare(b.date));

    // Per-type summary helper
    const typeSummary = (type: AttendanceType) => {
      const records = attendances.filter((a) => a.attendanceType === type);
      const present = records.filter((a) => a.status === 'PRESENT').length;
      const absent = records.filter((a) => a.status === 'ABSENT').length;
      const working = present + absent;
      return {
        totalPresent: present,
        totalAbsent: absent,
        totalWorkingDays: working,
        attendancePercentage: working > 0 ? parseFloat(((present / working) * 100).toFixed(2)) : 0,
      };
    };

    // Total holidays count
    let totalHolidayDays = 0;
    holidays.forEach((h) => {
      const start = new Date(h.startDate);
      const end = new Date(h.endDate);
      totalHolidayDays += Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    });
    totalHolidayDays += Array.from(holidayMap.values()).filter((h: any) => h.name === 'Sunday').length;

    // Build summary — always include class; conditionally include hostel/dayboarding
    const hasHostel = student.hostel;
    const hasDayboarding = student.dayboarding;

    const summary: any = {
      class: typeSummary(AttendanceType.CLASS),
      totalHolidays: totalHolidayDays,
    };
    if (hasHostel) summary.hostel = typeSummary(AttendanceType.HOSTEL);
    if (hasDayboarding) summary.dayboarding = typeSummary(AttendanceType.DAYBOARDING);

    return sendSuccess(
      res,
      {
        studentId: student.id,
        studentName: `${student.firstName} ${student.lastName}`,
        hostel: student.hostel,
        dayboarding: student.dayboarding,
        class: (currentEnrollment as any)?.class?.name || null,
        section: (currentEnrollment as any)?.section?.name || null,
        attendanceRecords: allRecords,
        summary,
      },
      'Student attendance calendar retrieved successfully'
    );
  } catch (error) {
    logger.error('Error fetching student attendance calendar', { error });
    return sendError(res, 'Failed to fetch student attendance calendar', 500);
  }
};

// Get boarding students (hostel or dayboarding) with attendance for a date
export const getBoardingStudents = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const { boardingType, date } = req.query;

    if (!schoolId) {
      return sendError(res, 'School ID not found in request', 400);
    }

    if (!boardingType || (boardingType !== 'HOSTEL' && boardingType !== 'DAYBOARDING')) {
      return sendError(res, 'boardingType must be HOSTEL or DAYBOARDING', 400);
    }

    if (!date) {
      return sendError(res, 'Date is required', 400);
    }

    const attendanceDate = new Date(date as string);
    const attendanceTypeValue = boardingType === 'HOSTEL' ? AttendanceType.HOSTEL : AttendanceType.DAYBOARDING;
    const studentFilter = boardingType === 'HOSTEL' ? { hostel: true } : { dayboarding: true };

    // Require an active session — boarding attendance is session-scoped
    const session = await AcademicSession.findOne({
      where: { schoolId, isActive: true },
    });

    if (!session) {
      return sendSuccess(res, [], 'No active academic session found');
    }

    // Fetch enrollments in the active session where the student is a boarding student
    const enrollments = await StudentEnrollment.findAll({
      where: { sessionId: session.id },
      include: [
        {
          association: 'student',
          where: { schoolId, active: true, ...studentFilter },
          attributes: ['id', 'firstName', 'lastName', 'studentPhoto', 'hostel', 'dayboarding'],
        },
        { association: 'class', attributes: ['id', 'name'] },
        { association: 'section', attributes: ['id', 'name'] },
      ],
      attributes: ['studentId', 'rollNumber'],
    });

    if (enrollments.length === 0) {
      return sendSuccess(res, [], 'No boarding students found');
    }

    const studentIds = enrollments.map((e: any) => e.studentId);

    // Fetch attendance records for this type and date
    const attendanceRecords = await Attendance.findAll({
      where: {
        schoolId,
        date: attendanceDate,
        studentId: { [Op.in]: studentIds },
        attendanceType: attendanceTypeValue,
      },
    });

    const attendanceMap = new Map(
      attendanceRecords.map((a) => [a.studentId, { id: a.id, status: a.status, remarks: a.remarks }])
    );

    // Build response from enrollments (each enrollment has the student included)
    const result = enrollments.map((enrollment: any) => {
      const student = enrollment.student;
      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        studentPhoto: student.studentPhoto,
        hostel: student.hostel,
        dayboarding: student.dayboarding,
        rollNumber: enrollment.rollNumber || null,
        class: enrollment.class || null,
        section: enrollment.section || null,
        attendance: attendanceMap.get(student.id) || null,
      };
    });

    // Sort by class name, then section name, then roll number
    result.sort((a, b) => {
      const aClass = a.class?.name || '';
      const bClass = b.class?.name || '';
      if (aClass !== bClass) return aClass.localeCompare(bClass);
      const aSection = a.section?.name || '';
      const bSection = b.section?.name || '';
      if (aSection !== bSection) return aSection.localeCompare(bSection);
      const aRoll = a.rollNumber || '';
      const bRoll = b.rollNumber || '';
      return aRoll.localeCompare(bRoll);
    });

    return sendSuccess(res, result, `${boardingType} students retrieved successfully`);
  } catch (error) {
    logger.error('Error fetching boarding students', { error });
    return sendError(res, 'Failed to fetch boarding students', 500);
  }
};
