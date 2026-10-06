import { Request, Response } from 'express';
import { Attendance, Student, Holiday, AcademicSession, StudentEnrollment } from '../models';
import { AttendanceType } from '../models/Attendance';
import { sendSuccess, sendError } from '../utils/response';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { handleError } from '../utils/httpError';
import { todayISO, addDaysISO, dayOfWeekISO, diffDaysISO, eachDateISO, isISODate } from '../utils/date';
import { byRollThenName } from '../utils/rollNumber';
import { isTeacher } from '../utils/teacherScope';

/** How many days back a teacher may mark or correct attendance (admins: unlimited). */
const ATTENDANCE_EDIT_WINDOW_DAYS = Number(process.env.ATTENDANCE_EDIT_WINDOW_DAYS ?? 7);

/** How far back to look when computing a student's current absence streak. */
const ABSENCE_STREAK_LOOKBACK_DAYS = 60;

// Check if a date (YYYY-MM-DD) is a holiday, including Sundays
const isHolidayCheck = async (schoolId: number, date: string): Promise<{ name: string } | null> => {
  if (dayOfWeekISO(date) === 0) {
    return { name: 'Sunday' };
  }

  return Holiday.findOne({
    where: {
      schoolId,
      startDate: { [Op.lte]: date },
      endDate: { [Op.gte]: date },
    },
    attributes: ['id', 'name'],
  });
};

/** Returns an error if the user may not write attendance for `date`, else null. */
const checkAttendanceDateWindow = (req: Request, date: string): { status: number; message: string } | null => {
  const today = todayISO();
  if (date > today) {
    return { status: 400, message: 'Cannot mark attendance for a future date' };
  }
  if (isTeacher(req) && date < addDaysISO(today, -ATTENDANCE_EDIT_WINDOW_DAYS)) {
    return { status: 403, message: `Attendance can only be changed for the last ${ATTENDANCE_EDIT_WINDOW_DAYS} days` };
  }
  return null;
};

// Bulk mark attendance for one date (defaults to today in the school's timezone)
export const bulkMarkAttendance = async (req: Request, res: Response) => {
  const errorsResult = validationResult(req);
  if (!errorsResult.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errorsResult.array());
  }

  try {
    const { attendances, attendanceType = AttendanceType.CLASS } = req.body;
    const schoolId = Number(req.schoolId);
    const userId = Number(req.userId);
    const date: string = req.body.date ?? todayISO();

    if (!isISODate(date)) {
      return sendError(res, 'date must be in YYYY-MM-DD format', 400);
    }

    const windowError = checkAttendanceDateWindow(req, date);
    if (windowError) {
      return sendError(res, windowError.message, windowError.status);
    }

    const holiday = await isHolidayCheck(schoolId, date);
    if (holiday) {
      return sendError(res, `Cannot mark attendance on holiday: ${holiday.name}`, 400);
    }

    // Derive academic session from the attendance date
    const session = await AcademicSession.findOne({
      where: {
        schoolId,
        startDate: { [Op.lte]: date },
        endDate: { [Op.gte]: date },
      },
    });
    if (!session) {
      return sendError(res, 'No academic session covers the attendance date', 400);
    }

    // One entry per student — if a student appears twice, the last entry wins
    const entries = new Map<number, { status: string; remarks: string | null }>();
    for (const entry of attendances) {
      entries.set(Number(entry.studentId), { status: entry.status, remarks: entry.remarks || null });
    }
    const studentIds = Array.from(entries.keys());

    const students = await Student.findAll({
      where: { id: { [Op.in]: studentIds }, schoolId },
      attributes: ['id'],
    });
    const validIds = new Set(students.map(s => s.id));

    const errors = studentIds
      .filter(id => !validIds.has(id))
      .map(studentId => ({ studentId, error: 'Student not found or does not belong to this school' }));

    const rows = studentIds
      .filter(id => validIds.has(id))
      .map(studentId => ({
        studentId,
        status: entries.get(studentId)!.status,
        remarks: entries.get(studentId)!.remarks,
        markedBy: userId,
        schoolId,
        date,
        sessionId: session.id,
        attendanceType,
      }));

    if (rows.length === 0) {
      return sendError(res, 'None of the students could be marked', 400, { errors });
    }

    // Upsert on the (studentId, date, schoolId, attendanceType) unique index
    await Attendance.bulkCreate(rows as any[], {
      updateOnDuplicate: ['status', 'remarks', 'markedBy', 'sessionId', 'updatedAt'],
    });

    const attendancesWithDetails = await Attendance.findAll({
      where: {
        schoolId,
        date,
        attendanceType,
        studentId: { [Op.in]: rows.map(r => r.studentId) },
      },
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
        date,
        success: attendancesWithDetails.length,
        failed: errors.length,
        attendances: attendancesWithDetails,
        errors: errors.length ? errors : undefined,
      },
      `Attendance marked successfully for ${attendancesWithDetails.length} student(s)${errors.length ? `. ${errors.length} failed.` : ''}`
    );
  } catch (error) {
    return handleError(res, error, 'Failed to mark attendance');
  }
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

    const attendanceDate = String(attendance.date).slice(0, 10);
    const windowError = checkAttendanceDateWindow(req, attendanceDate);
    if (windowError) {
      return sendError(res, windowError.message, windowError.status);
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
    const holiday = await isHolidayCheck(parseInt(String(schoolId)), String(date));

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
      attributes: ['id', 'name', 'sequence'],
      order: [['sequence', 'ASC']],
    });

    const classIds = enrollments.map((e: any) => e.classId);
    const sections = await Section.findAll({
      where: { classId: { [Op.in]: classIds } },
      attributes: ['id', 'name'],
    });

    const classMap = new Map(classes.map((c: any) => [c.id, c.name]));
    const classSequenceMap = new Map(classes.map((c: any) => [c.id, c.sequence]));
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

    // Sort by class sequence (pedagogical order), then section name
    allStats.sort((a: any, b: any) => {
      const aSequence = Number(classSequenceMap.get(a.classId) ?? Number.MAX_SAFE_INTEGER);
      const bSequence = Number(classSequenceMap.get(b.classId) ?? Number.MAX_SAFE_INTEGER);
      if (aSequence !== bSequence) {
        return aSequence - bSequence;
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

    // Derive session from date
    const session = await AcademicSession.findOne({
      where: {
        schoolId,
        startDate: { [Op.lte]: String(date) },
        endDate: { [Op.gte]: String(date) },
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
    const holiday = await isHolidayCheck(parseInt(String(schoolId)), String(date));

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

// Get a class/section roster with each student's attendance for a date
export const getStudentsWithAttendance = async (req: Request, res: Response) => {
  try {
    const { classId, sectionId } = req.params;
    const { date } = req.query;
    const schoolId = Number(req.schoolId);

    if (!isISODate(date)) {
      return sendError(res, 'date is required in YYYY-MM-DD format', 400);
    }

    // Session covering the date, falling back to the active session
    const session =
      (await AcademicSession.findOne({
        where: { schoolId, startDate: { [Op.lte]: date }, endDate: { [Op.gte]: date } },
      })) ?? (await AcademicSession.findOne({ where: { schoolId, isActive: true } }));

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
    });
    enrollments.sort(byRollThenName(
      (e: any) => e.rollNumber,
      (e: any) => `${e.student.firstName} ${e.student.lastName}`,
    ));

    const studentIds = enrollments.map((e: any) => e.studentId);

    // Class attendance for the date plus the lookback window, in one query
    const records = studentIds.length === 0 ? [] : await Attendance.findAll({
      where: {
        schoolId,
        studentId: { [Op.in]: studentIds },
        attendanceType: AttendanceType.CLASS,
        date: { [Op.lte]: date, [Op.gte]: addDaysISO(date, -ABSENCE_STREAK_LOOKBACK_DAYS) },
      },
      attributes: ['id', 'studentId', 'date', 'status', 'remarks'],
      order: [['date', 'DESC']],
    });

    // Attendance on the date, and each student's current absence streak:
    // consecutive ABSENT records up to and including the date (holidays and
    // unmarked days have no record, so they don't break the streak).
    const attendanceMap = new Map<number, { id: number; status: string; remarks: string | null }>();
    const streaks = new Map<number, number>();
    const streakEnded = new Set<number>();
    for (const r of records) {
      if (String(r.date) === date) {
        attendanceMap.set(r.studentId, { id: r.id, status: r.status, remarks: r.remarks ?? null });
      }
      if (streakEnded.has(r.studentId)) continue;
      if (r.status === 'ABSENT') {
        streaks.set(r.studentId, (streaks.get(r.studentId) ?? 0) + 1);
      } else {
        streakEnded.add(r.studentId);
      }
    }

    const studentsWithAttendance = enrollments.map((enrollment: any) => {
      const consecutiveAbsences = streaks.get(enrollment.studentId) ?? 0;
      return {
        ...enrollment.student.toJSON(),
        rollNumber: enrollment.rollNumber,
        class: enrollment.class,
        section: enrollment.section,
        attendance: attendanceMap.get(enrollment.studentId) || null,
        consecutiveAbsences,
        // Legacy name kept for older app builds and the web detail panel
        daysAbsentSinceLastPresent: consecutiveAbsences > 0 ? consecutiveAbsences : null,
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
    const sessionStart = String(session.startDate).slice(0, 10);
    const today = todayISO();

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

    // Build holiday map (date -> holiday entry). Dates are YYYY-MM-DD strings
    // so the result doesn't depend on the server's timezone.
    const holidayMap = new Map<string, any>();
    holidays.forEach((h) => {
      for (const dateStr of eachDateISO(String(h.startDate).slice(0, 10), String(h.endDate).slice(0, 10))) {
        holidayMap.set(dateStr, {
          date: dateStr,
          status: 'HOLIDAY',
          name: h.name,
          reason: h.reason,
        });
      }
    });

    // Add Sundays as holidays from session start to today
    for (const dateStr of eachDateISO(sessionStart, today)) {
      if (dayOfWeekISO(dateStr) === 0 && !holidayMap.has(dateStr)) {
        holidayMap.set(dateStr, {
          date: dateStr,
          status: 'HOLIDAY',
          name: 'Sunday',
          reason: 'Weekly holiday',
        });
      }
    }

    // Build attendance records — each record includes its attendanceType
    // Multiple records can share the same date (e.g. CLASS + HOSTEL on same day)
    const attendanceDateSet = new Set<string>();
    const attendanceRecordsList = attendances.map((a) => {
      const dateStr = String(a.date).slice(0, 10);
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
    const totalHolidayDays = holidayMap.size;

    // Build summary — always include class; conditionally include hostel/dayboarding.
    // OR'd with actual recorded attendance so history survives a later boarding-type change.
    const hasHostel = student.hostel || attendances.some((a) => a.attendanceType === AttendanceType.HOSTEL);
    const hasDayboarding = student.dayboarding || attendances.some((a) => a.attendanceType === AttendanceType.DAYBOARDING);

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

    const attendanceDate = String(date);
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
      return byRollThenName<typeof a>(x => x.rollNumber, x => `${x.firstName} ${x.lastName}`)(a, b);
    });

    return sendSuccess(res, result, `${boardingType} students retrieved successfully`);
  } catch (error) {
    logger.error('Error fetching boarding students', { error });
    return sendError(res, 'Failed to fetch boarding students', 500);
  }
};

/** Longest range the history endpoint serves in one request (two months). */
const HISTORY_MAX_DAYS = 62;

type DayStatus = 'MARKED' | 'PARTIAL' | 'NOT_MARKED' | 'HOLIDAY' | 'FUTURE';

// GET /attendance/history?classId&sectionId&from&to[&attendanceType]
// Per-day summary and per-student totals for one section over a date range.
export const getAttendanceHistory = async (req: Request, res: Response) => {
  try {
    const schoolId = Number(req.schoolId);
    const classId = Number(req.query.classId);
    const sectionId = Number(req.query.sectionId);
    const { from, to } = req.query;
    const attendanceType = (req.query.attendanceType as AttendanceType) || AttendanceType.CLASS;

    if (!Number.isInteger(classId) || !Number.isInteger(sectionId)) {
      return sendError(res, 'classId and sectionId are required', 400);
    }
    if (!isISODate(from) || !isISODate(to) || from > to) {
      return sendError(res, 'from and to are required in YYYY-MM-DD format, with from <= to', 400);
    }
    if (diffDaysISO(from, to) >= HISTORY_MAX_DAYS) {
      return sendError(res, `Date range cannot exceed ${HISTORY_MAX_DAYS} days`, 400);
    }
    if (!Object.values(AttendanceType).includes(attendanceType)) {
      return sendError(res, 'Invalid attendanceType', 400);
    }

    const today = todayISO();
    const end = to > today ? today : to;

    const session =
      (await AcademicSession.findOne({
        where: { schoolId, startDate: { [Op.lte]: end }, endDate: { [Op.gte]: end } },
      })) ?? (await AcademicSession.findOne({ where: { schoolId, isActive: true } }));

    const enrollments = session
      ? await StudentEnrollment.findAll({
          where: { classId, sectionId, sessionId: session.id },
          attributes: ['studentId', 'rollNumber'],
          include: [{
            association: 'student',
            attributes: ['id', 'firstName', 'lastName', 'studentPhoto'],
            where: { schoolId, active: true },
            required: true,
          }],
        })
      : [];
    enrollments.sort(byRollThenName(
      (e: any) => e.rollNumber,
      (e: any) => `${e.student.firstName} ${e.student.lastName}`,
    ));
    const studentIds = enrollments.map(e => e.studentId);

    const [records, holidays] = await Promise.all([
      studentIds.length === 0 || from > end
        ? Promise.resolve([] as Attendance[])
        : Attendance.findAll({
            where: {
              schoolId,
              attendanceType,
              studentId: { [Op.in]: studentIds },
              date: { [Op.gte]: from, [Op.lte]: end },
            },
            attributes: ['studentId', 'date', 'status', 'updatedAt'],
            include: [{
              association: 'markedByUser',
              attributes: ['id', 'firstName', 'lastName'],
              include: [{ association: 'staff', attributes: ['name'] }],
            }],
            order: [['date', 'DESC']],
          }),
      Holiday.findAll({
        where: { schoolId, startDate: { [Op.lte]: to }, endDate: { [Op.gte]: from } },
        attributes: ['name', 'startDate', 'endDate'],
      }),
    ]);

    // date -> holiday name (Sundays included)
    const holidayByDate = new Map<string, string>();
    for (const h of holidays) {
      const start = String(h.startDate).slice(0, 10);
      const stop = String(h.endDate).slice(0, 10);
      for (const d of eachDateISO(start < from ? from : start, stop > to ? to : stop)) {
        holidayByDate.set(d, h.name);
      }
    }
    for (const d of eachDateISO(from, to)) {
      if (dayOfWeekISO(d) === 0 && !holidayByDate.has(d)) holidayByDate.set(d, 'Sunday');
    }

    const markerName = (r: any): string | null => {
      const u = r.markedByUser;
      if (!u) return null;
      return u.staff?.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || null;
    };

    // Per-day aggregation
    const byDate = new Map<string, { present: number; absent: number; last: any }>();
    for (const r of records) {
      const d = String(r.date);
      const agg = byDate.get(d) ?? { present: 0, absent: 0, last: null };
      if (r.status === 'PRESENT') agg.present++;
      else agg.absent++;
      if (!agg.last || new Date(r.updatedAt) > new Date(agg.last.updatedAt)) agg.last = r;
      byDate.set(d, agg);
    }

    const totalStudents = studentIds.length;
    const days = eachDateISO(from, to).map(date => {
      const agg = byDate.get(date);
      const present = agg?.present ?? 0;
      const absent = agg?.absent ?? 0;
      const holidayName = holidayByDate.get(date) ?? null;
      let status: DayStatus;
      if (date > today) status = 'FUTURE';
      else if (holidayName && present + absent === 0) status = 'HOLIDAY';
      else if (present + absent === 0) status = 'NOT_MARKED';
      else if (present + absent < totalStudents) status = 'PARTIAL';
      else status = 'MARKED';
      return {
        date,
        status,
        isHoliday: !!holidayName,
        holidayName,
        present,
        absent,
        notMarked: status === 'HOLIDAY' || status === 'FUTURE' ? 0 : Math.max(totalStudents - present - absent, 0),
        lastMarkedBy: agg?.last ? markerName(agg.last) : null,
        lastMarkedAt: agg?.last?.updatedAt ?? null,
      };
    });

    // Per-student totals; records are newest-first for the streak
    const perStudent = new Map<number, { present: number; absent: number; streak: number; streakEnded: boolean }>();
    for (const r of records) {
      const t = perStudent.get(r.studentId) ?? { present: 0, absent: 0, streak: 0, streakEnded: false };
      if (r.status === 'PRESENT') {
        t.present++;
        t.streakEnded = true;
      } else {
        t.absent++;
        if (!t.streakEnded) t.streak++;
      }
      perStudent.set(r.studentId, t);
    }

    const students = enrollments.map((e: any) => {
      const t = perStudent.get(e.studentId);
      const marked = (t?.present ?? 0) + (t?.absent ?? 0);
      return {
        studentId: e.studentId,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
        studentPhoto: e.student.studentPhoto ?? null,
        rollNumber: e.rollNumber,
        present: t?.present ?? 0,
        absent: t?.absent ?? 0,
        percentage: marked > 0 ? Math.round(((t?.present ?? 0) / marked) * 1000) / 10 : null,
        consecutiveAbsences: t?.streak ?? 0,
      };
    });

    const totalPresent = students.reduce((sum, st) => sum + st.present, 0);
    const totalMarked = students.reduce((sum, st) => sum + st.present + st.absent, 0);

    return sendSuccess(res, {
      classId,
      sectionId,
      from,
      to,
      attendanceType,
      session: session ? { id: session.id, name: session.name } : null,
      totalStudents,
      days,
      students,
      summary: {
        workingDays: days.filter(d => d.status !== 'HOLIDAY' && d.status !== 'FUTURE').length,
        markedDays: days.filter(d => d.status === 'MARKED' || d.status === 'PARTIAL').length,
        holidays: days.filter(d => d.status === 'HOLIDAY').length,
        averagePercentage: totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 1000) / 10 : null,
      },
    }, 'Attendance history retrieved successfully');
  } catch (error) {
    return handleError(res, error, 'Failed to fetch attendance history');
  }
};
