import { Request, Response } from 'express';
import { Student, StudentMonthlyFee, StudentFeePayment, AcademicSession, StudentEnrollment } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { validationResult } from 'express-validator';
import { generateAdmissionNumber } from '../utils/studentUtils';
import { Op } from 'sequelize';
import logger from '../utils/logger';

// Get all students
export const getAllStudents = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    if (!schoolId) {
      return sendError(res, 'School ID not found in request');
    }

    const whereClause: any = { schoolId };

    // Handle active filter
    if (req.query.active !== undefined) {
      const activeValue = req.query.active;
      if (activeValue === 'true') {
        whereClause.active = true;
      } else if (activeValue === 'false') {
        whereClause.active = false;
      }
    }

    // Determine effective sessionId (from query or default to active session)
    let effectiveSessionId: number | null = null;
    if (req.query.sessionId !== undefined) {
      const parsed = parseInt(req.query.sessionId as string);
      if (!isNaN(parsed)) effectiveSessionId = parsed;
    } else {
      const active = await AcademicSession.findOne({ where: { schoolId, isActive: true } });
      if (active) effectiveSessionId = active.id;
    }

    // Build enrollment where clause (supports classId/sectionId filters)
    const enrollmentWhere: any = effectiveSessionId ? { sessionId: effectiveSessionId } : undefined;
    if (enrollmentWhere) {
      if (req.query.classId !== undefined) {
        const classId = parseInt(req.query.classId as string);
        if (!isNaN(classId)) enrollmentWhere.classId = classId;
      }
      if (req.query.sectionId !== undefined) {
        const sectionId = parseInt(req.query.sectionId as string);
        if (!isNaN(sectionId)) enrollmentWhere.sectionId = sectionId;
      }
    }

    const students = await Student.findAll({
      where: whereClause,
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['firstName', 'lastName'] },
        {
          model: StudentEnrollment,
          as: 'enrollments',
          required: !!effectiveSessionId,
          where: enrollmentWhere,
          include: [
            { association: 'class', attributes: ['id', 'name'] },
            { association: 'section', attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    // Calculate total due for each student
    const studentsWithDue = await Promise.all(
      students.map(async (student: any) => {
        const studentData = student.toJSON();

        const monthlyFees = await StudentMonthlyFee.findAll({
          where: {
            studentId: student.id,
            status: { [Op.ne]: 'PAID' },
          },
          include: [
            {
              model: StudentFeePayment,
              as: 'payments',
              attributes: ['amountPaid'],
            },
          ],
        });

        let totalDue = 0;
        for (const fee of monthlyFees) {
          const totalPayable = Number(fee.totalPayableAmount);
          const paidAmount = fee.payments?.reduce((sum: number, p: any) => sum + Number(p.amountPaid), 0) || 0;
          totalDue += Math.max(0, totalPayable - paidAmount);
        }

        return { ...studentData, totalDue };
      })
    );

    return sendSuccess(res, studentsWithDue, 'Students retrieved successfully');
  } catch (error) {
    logger.error('Error fetching students', { error });
    return sendError(res, 'Failed to fetch students', 500);
  }
};

// Get student by ID
export const getStudentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['firstName', 'lastName'] },
        {
          model: StudentEnrollment,
          as: 'enrollments',
          include: [
            { association: 'class', attributes: ['id', 'name'] },
            { association: 'section', attributes: ['id', 'name'] },
            { association: 'session', attributes: ['id', 'name', 'startDate', 'endDate', 'isActive'] },
          ],
        },
      ],
    });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    return sendSuccess(res, student, 'Student retrieved successfully');
  } catch (error) {
    logger.error('Error fetching student', { error });
    return sendError(res, 'Failed to fetch student', 500);
  }
};

// Create new student
export const createStudent = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const schoolId = parseInt(req.schoolId);
    if (!schoolId) {
      return sendError(res, 'School ID not found in request');
    }
    const userId = parseInt(req.userId);
    if (!userId) {
      return sendError(res, 'User ID not found in request');
    }

    const { classId, sectionId, rollNumber, hostel, areaTransportationId, dayboarding, ...studentFields } = req.body;

    // Validate mutual exclusion: hostel and transportation cannot coexist
    if (hostel === true && areaTransportationId != null) {
      return sendError(res, 'Student cannot have both hostel and transportation services', 400);
    }

    // If class assignment is provided, require an active session
    let activeSession: any = null;
    if (classId) {
      activeSession = await AcademicSession.findOne({ where: { schoolId, isActive: true } });
      if (!activeSession) {
        return sendError(res, 'No active academic session found. Cannot assign a class without an active session.', 400);
      }
    }

    const studentData = {
      ...studentFields,
      hostel,
      areaTransportationId,
      dayboarding,
      schoolId,
      createdBy: userId,
      admissionNumber: await generateAdmissionNumber(schoolId),
    };

    const student = await Student.create(studentData);

    // Create enrollment if class is specified
    if (classId && activeSession) {
      await StudentEnrollment.create({
        studentId: student.id,
        sessionId: activeSession.id,
        classId: parseInt(classId),
        sectionId: sectionId ? parseInt(sectionId) : null,
        rollNumber: rollNumber ?? null,
        promotedBy: userId,
        promotedAt: new Date(),
      });
    }

    const createdStudent = await Student.findByPk(student.id, {
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['firstName', 'lastName'] },
        {
          model: StudentEnrollment,
          as: 'enrollments',
          include: [
            { association: 'class', attributes: ['id', 'name'] },
            { association: 'section', attributes: ['id', 'name'] },
            { association: 'session', attributes: ['id', 'name'] },
          ],
        },
      ],
    });

    return sendSuccess(res, createdStudent, 'Student created successfully', 201);
  } catch (error) {
    logger.error('Error creating student', { error });
    return sendError(res, 'Failed to create student', 500);
  }
};

// Update student
export const updateStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Strip enrollment fields — class/section/roll are managed via enrollment API
    const { classId, sectionId, rollNumber, ...updateData } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Enforce mutual exclusion: if hostel is being set to true, clear transportation
    if (updateData.hostel === true) {
      updateData.areaTransportationId = null;
    }

    // Also enforce: if transportation is being set, clear hostel
    if (updateData.areaTransportationId) {
      updateData.hostel = false;
    }

    await student.update(updateData);

    const updatedStudent = await Student.findByPk(id, {
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['firstName', 'lastName'] },
        {
          model: StudentEnrollment,
          as: 'enrollments',
          include: [
            { association: 'class', attributes: ['id', 'name'] },
            { association: 'section', attributes: ['id', 'name'] },
            { association: 'session', attributes: ['id', 'name'] },
          ],
        },
      ],
    });

    return sendSuccess(res, updatedStudent, 'Student updated successfully');
  } catch (error) {
    logger.error('Error updating student', { error });
    return sendError(res, 'Failed to update student', 500);
  }
};

// Delete student
export const deleteStudent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    await student.destroy();

    return sendSuccess(res, null, 'Student deleted successfully');
  } catch (error) {
    logger.error('Error deleting student', { error });
    return sendError(res, 'Failed to delete student', 500);
  }
};

// Get students by class — queries via StudentEnrollment
export const getStudentsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const { sectionId, sessionId } = req.query;
    const schoolId = req.schoolId;

    // Determine effective session
    let effectiveSessionId: number | null = null;
    if (sessionId) {
      effectiveSessionId = parseInt(sessionId as string);
    } else {
      const active = await AcademicSession.findOne({ where: { schoolId, isActive: true } });
      if (active) effectiveSessionId = active.id;
    }

    if (!effectiveSessionId) {
      return sendError(res, 'No active session found. Provide a sessionId query parameter.', 400);
    }

    const enrollmentWhere: any = {
      classId: parseInt(classId),
      sessionId: effectiveSessionId,
    };
    if (sectionId) {
      enrollmentWhere.sectionId = parseInt(sectionId as string);
    }

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

    const students = enrollments.map((e: any) => ({
      ...(e.student?.toJSON() || {}),
      rollNumber: e.rollNumber,
      class: e.class,
      section: e.section,
    }));

    return sendSuccess(res, students, 'Students retrieved successfully');
  } catch (error) {
    logger.error('Error fetching students by class', { error });
    return sendError(res, 'Failed to fetch students', 500);
  }
};

// Get students with payment reminders
export const getStudentsWithPaymentReminders = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    if (!schoolId) {
      return sendError(res, 'School ID not found in request');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const students = await Student.findAll({
      where: {
        schoolId,
        paymentReminderDate: {
          [Op.not]: null,
          [Op.lte]: today,
        },
      },
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['firstName', 'lastName'] },
      ],
    });

    return sendSuccess(res, students, 'Students with payment reminders retrieved successfully');
  } catch (error) {
    logger.error('Error fetching students with payment reminders', { error });
    return sendError(res, 'Failed to fetch students with payment reminders', 500);
  }
};

// Update payment reminder for a student
export const updatePaymentReminder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentReminderDate, paymentRemainderRemarks } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    // Check if this is a clear operation (both fields null/empty)
    const isClearing =
      (paymentReminderDate === null || paymentReminderDate === '' || paymentReminderDate === undefined) &&
      (paymentRemainderRemarks === null || paymentRemainderRemarks === '' || paymentRemainderRemarks === undefined);

    // If not clearing, date is required
    if (!isClearing) {
      if (!paymentReminderDate || paymentReminderDate === null || paymentReminderDate === '') {
        return sendError(res, 'Reminder date is required. Please select a date.', 400);
      }

      const selectedDate = new Date(paymentReminderDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return sendError(res, 'Cannot set payment reminder for past dates. Please select today or a future date.', 400);
      }
    }

    const updateData: any = {};
    if (paymentReminderDate !== undefined) {
      updateData.paymentReminderDate = paymentReminderDate === null || paymentReminderDate === '' ? null : paymentReminderDate;
    }
    if (paymentRemainderRemarks !== undefined) {
      updateData.paymentRemainderRemarks = paymentRemainderRemarks === null || paymentRemainderRemarks === '' ? null : paymentRemainderRemarks;
    }

    await student.update(updateData);

    const updatedStudent = await Student.findByPk(id, {
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['firstName', 'lastName'] },
      ],
    });

    return sendSuccess(res, updatedStudent, 'Payment reminder updated successfully');
  } catch (error) {
    logger.error('Error updating payment reminder', { error });
    return sendError(res, 'Failed to update payment reminder', 500);
  }
};

// Mark student as left school
export const markStudentLeftSchool = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    const newActiveStatus = active !== undefined ? active : false;
    await student.update({ active: newActiveStatus });

    const updatedStudent = await Student.findByPk(id, {
      include: [
        { association: 'school', attributes: ['id', 'name'] },
        { association: 'creator', attributes: ['firstName', 'lastName'] },
      ],
    });

    const message = newActiveStatus
      ? 'Student marked as active successfully'
      : 'Student marked as left school successfully';

    return sendSuccess(res, updatedStudent, message);
  } catch (error) {
    logger.error('Error marking student as left school', { error });
    return sendError(res, 'Failed to update student status', 500);
  }
};
