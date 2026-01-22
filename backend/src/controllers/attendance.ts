import { Request, Response } from 'express';
import { Attendance, Student, User } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Bulk mark attendance
export const bulkMarkAttendance = async (req: Request, res: Response) => {
  console.log(req.body);
  const errors = validationResult(req);
  console.log("testing 2", errors.array());
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }


  const transaction = await sequelize.transaction();

  try {
    const { attendances, date } = req.body;
    const schoolId = req.schoolId;
    const userId = req.userId;

    if (!schoolId || !userId) {
      await transaction.rollback();
      return sendError(res, 'School ID or User ID not found in request', 400);
    }
    if (!Array.isArray(attendances) || attendances.length === 0) {
      await transaction.rollback();
      return sendError(res, 'Attendances array is required and cannot be empty', 400);
    }

    if (!date) {
      await transaction.rollback();
      return sendError(res, 'Date is required', 400);
    }

    // Validate date is not in the future
    const attendanceDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    attendanceDate.setHours(0, 0, 0, 0);

    if (attendanceDate > today) {
      await transaction.rollback();
      return sendError(res, 'Cannot mark attendance for future dates', 400);
    }

    const results: any[] = [];
    const errors: any[] = [];
    let successCount = 0;
    let failedCount = 0;

    for (const attendance of attendances) {
      try {
        const { studentId, status, remarks } = attendance;

        if (!studentId || !status) {
          errors.push({
            studentId: studentId || null,
            error: 'Student ID and status are required',
          });
          failedCount++;
          continue;
        }

        // Verify student belongs to the school
        const student = await Student.findOne({
          where: { id: studentId, schoolId },
          transaction,
        });

        if (!student) {
          errors.push({
            studentId,
            error: 'Student not found or does not belong to this school',
          });
          failedCount++;
          continue;
        }

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          where: {
            studentId,
            date,
            schoolId,
          },
          transaction,
        });

        if (existingAttendance) {
          // Update existing attendance
          await existingAttendance.update(
            {
              status,
              markedBy: userId,
              remarks: remarks || null,
            },
            { transaction }
          );
          results.push(existingAttendance);
        } else {
          // Create new attendance
          const newAttendance = await Attendance.create(
            {
              studentId,
              date,
              status,
              markedBy: userId,
              schoolId,
              remarks: remarks || null,
            },
            { transaction }
          );
          results.push(newAttendance);
        }
        successCount++;
      } catch (error: any) {
        errors.push({
          studentId: attendance.studentId,
          error: error.message || 'Failed to process attendance',
        });
        failedCount++;
      }
    }

    if (failedCount > 0 && successCount === 0) {
      await transaction.rollback();
      return sendError(res, 'All attendance records failed', 400, { errors });
    }

    await transaction.commit();

    // Fetch created/updated attendances with student details
    const attendanceIds = results.map((r) => r.id);
    const attendancesWithDetails = await Attendance.findAll({
      where: {
        id: { [Op.in]: attendanceIds },
      },
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
        errors: errors.length > 0 ? errors : undefined,
      },
      `Attendance marked successfully for ${successCount} student(s)${failedCount > 0 ? `. ${failedCount} failed.` : ''}`
    );
  } catch (error: any) {
    await transaction.rollback();
    console.error('Error marking attendance:', error);
    return sendError(res, 'Failed to mark attendance', 500);
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

    const whereClause: any = { schoolId, date };

    let includeOptions: any[] = [
      {
        association: 'student',
        attributes: ['id', 'classId', 'sectionId'],
        include: [],
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
    });

    const presentCount = attendances.filter((a) => a.status === 'PRESENT').length;
    const absentCount = attendances.filter((a) => a.status === 'ABSENT').length;
    const totalCount = attendances.length;

    // Get total students in class/section
    const studentWhereClause: any = { schoolId };
    if (classId) {
      studentWhereClause.classId = classId;
    }
    if (sectionId) {
      studentWhereClause.sectionId = sectionId;
    }

    const totalStudents = await Student.count({
      where: studentWhereClause,
    });

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

    // Get all students for the class/section
    const students = await Student.findAll({
      where: {
        classId: parseInt(classId),
        sectionId: parseInt(sectionId),
        schoolId,
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
