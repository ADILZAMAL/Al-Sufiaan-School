import { Request, Response } from 'express';
import { StudentEnrollment, AcademicSession, Student, Class, Section, Attendance, StudentMonthlyFee } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

// ── GET /api/sessions/:sessionId/enrollments ──────────────────────────────────

export const getEnrollments = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { classId, sectionId } = req.query;
        const schoolId = parseInt(req.schoolId);

        // Verify session belongs to school
        const session = await AcademicSession.findOne({
            where: { id: parseInt(sessionId), schoolId },
        });
        if (!session) {
            return sendError(res, 'Session not found', 404);
        }

        const where: Record<string, unknown> = { sessionId: session.id };
        if (classId) where.classId = parseInt(classId as string);
        if (sectionId) where.sectionId = parseInt(sectionId as string);

        const enrollments = await StudentEnrollment.findAll({
            where,
            include: [
                {
                    association: 'student',
                    attributes: ['id', 'firstName', 'lastName', 'admissionNumber', 'active'],
                },
                {
                    association: 'class',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'section',
                    attributes: ['id', 'name'],
                },
            ],
            order: [['rollNumber', 'ASC']],
        });

        return sendSuccess(res, enrollments, 'Enrollments retrieved successfully');
    } catch (error) {
        logger.error('Error fetching enrollments', { error });
        return sendError(res, 'Failed to fetch enrollments', 500);
    }
};

// ── GET /api/students/:studentId/enrollments ──────────────────────────────────

export const getStudentEnrollments = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.params;
        const schoolId = parseInt(req.schoolId);

        // Verify student belongs to school
        const student = await Student.findOne({
            where: { id: parseInt(studentId), schoolId },
        });
        if (!student) {
            return sendError(res, 'Student not found', 404);
        }

        const enrollments = await StudentEnrollment.findAll({
            where: { studentId: student.id },
            include: [
                {
                    association: 'session',
                    attributes: ['id', 'name', 'startDate', 'endDate', 'isActive'],
                },
                {
                    association: 'class',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'section',
                    attributes: ['id', 'name'],
                },
                {
                    association: 'promoter',
                    attributes: ['id', 'firstName', 'lastName'],
                },
            ],
            order: [[{ model: AcademicSession, as: 'session' }, 'startDate', 'DESC']],
        });

        return sendSuccess(res, enrollments, 'Student enrollment history retrieved successfully');
    } catch (error) {
        logger.error('Error fetching student enrollments', { error });
        return sendError(res, 'Failed to fetch student enrollments', 500);
    }
};

// ── POST /api/sessions/:sessionId/enroll ─────────────────────────────────────

export const enrollStudent = async (req: Request, res: Response) => {
    try {
        const { sessionId } = req.params;
        const { studentId, classId, sectionId, rollNumber } = req.body;
        const schoolId = parseInt(req.schoolId);
        const userId = parseInt(req.userId);

        if (!studentId || !classId || !sectionId) {
            return sendError(res, 'studentId, classId, and sectionId are required', 400);
        }

        // Verify session belongs to school
        const session = await AcademicSession.findOne({
            where: { id: parseInt(sessionId), schoolId },
        });
        if (!session) {
            return sendError(res, 'Session not found', 404);
        }

        // Verify student is active and belongs to school
        const student = await Student.findOne({
            where: { id: parseInt(studentId), schoolId },
        });
        if (!student) {
            return sendError(res, 'Student not found', 404);
        }
        if (!student.active) {
            return sendError(res, 'Cannot enroll an inactive student', 400);
        }

        // Check for duplicate enrollment
        const existing = await StudentEnrollment.findOne({
            where: { studentId: student.id, sessionId: session.id },
        });
        if (existing) {
            return sendError(res, 'Student is already enrolled in this session', 409);
        }

        // Verify classId belongs to this session
        const cls = await Class.findOne({
            where: { id: parseInt(classId), sessionId: session.id },
        });
        if (!cls) {
            return sendError(res, 'Class does not belong to this session', 400);
        }

        // Verify sectionId belongs to this classId
        const sec = await Section.findOne({
            where: { id: parseInt(sectionId), classId: cls.get('id') },
        });
        if (!sec) {
            return sendError(res, 'Section does not belong to this class', 400);
        }

        const enrollment = await StudentEnrollment.create({
            studentId: student.id,
            sessionId: session.id,
            classId: cls.get('id') as number,
            sectionId: sec.get('id') as number,
            rollNumber: rollNumber ?? null,
            promotedBy: userId,
            promotedAt: new Date(),
        });

        const result = await StudentEnrollment.findByPk(enrollment.id, {
            include: [
                { association: 'student', attributes: ['id', 'firstName', 'lastName', 'admissionNumber'] },
                { association: 'class', attributes: ['id', 'name'] },
                { association: 'section', attributes: ['id', 'name'] },
                { association: 'session', attributes: ['id', 'name'] },
            ],
        });

        return sendSuccess(res, result, 'Student enrolled successfully', 201);
    } catch (error) {
        logger.error('Error enrolling student', { error });
        return sendError(res, 'Failed to enroll student', 500);
    }
};

// ── PUT /api/enrollments/:id ──────────────────────────────────────────────────

export const updateEnrollment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { classId, sectionId, rollNumber } = req.body;
        const schoolId = parseInt(req.schoolId);

        const enrollment = await StudentEnrollment.findByPk(parseInt(id), {
            include: [{ association: 'session' }],
        });
        if (!enrollment) {
            return sendError(res, 'Enrollment not found', 404);
        }

        // Verify the session belongs to this school
        const session = await AcademicSession.findOne({
            where: { id: enrollment.sessionId, schoolId },
        });
        if (!session) {
            return sendError(res, 'Enrollment not found', 404);
        }

        let newClassId = enrollment.classId;
        let newSectionId = enrollment.sectionId;

        if (classId !== undefined) {
            // Verify new classId belongs to the same session
            const cls = await Class.findOne({
                where: { id: parseInt(classId), sessionId: enrollment.sessionId },
            });
            if (!cls) {
                return sendError(res, 'Class does not belong to this session', 400);
            }
            newClassId = cls.get('id') as number;
        }

        if (sectionId !== undefined) {
            // Verify sectionId belongs to the (possibly updated) classId
            const sec = await Section.findOne({
                where: { id: parseInt(sectionId), classId: newClassId },
            });
            if (!sec) {
                return sendError(res, 'Section does not belong to this class', 400);
            }
            newSectionId = sec.get('id') as number;
        }

        await enrollment.update({
            classId: newClassId,
            sectionId: newSectionId,
            rollNumber: rollNumber !== undefined ? rollNumber : enrollment.rollNumber,
        });

        const result = await StudentEnrollment.findByPk(enrollment.id, {
            include: [
                { association: 'student', attributes: ['id', 'firstName', 'lastName', 'admissionNumber'] },
                { association: 'class', attributes: ['id', 'name'] },
                { association: 'section', attributes: ['id', 'name'] },
                { association: 'session', attributes: ['id', 'name'] },
            ],
        });

        return sendSuccess(res, result, 'Enrollment updated successfully');
    } catch (error) {
        logger.error('Error updating enrollment', { error });
        return sendError(res, 'Failed to update enrollment', 500);
    }
};

// ── DELETE /api/enrollments/:id ───────────────────────────────────────────────

export const deleteEnrollment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = parseInt(req.schoolId);

        const enrollment = await StudentEnrollment.findByPk(parseInt(id));
        if (!enrollment) {
            return sendError(res, 'Enrollment not found', 404);
        }

        // Verify the session belongs to this school
        const session = await AcademicSession.findOne({
            where: { id: enrollment.sessionId, schoolId },
        });
        if (!session) {
            return sendError(res, 'Enrollment not found', 404);
        }

        // Guard: no attendance records for this student in this session
        const attendanceCount = await Attendance.count({
            where: { studentId: enrollment.studentId, sessionId: enrollment.sessionId },
        });
        if (attendanceCount > 0) {
            return sendError(
                res,
                'Cannot delete enrollment: student has attendance records in this session',
                400
            );
        }

        // Guard: no fee records for this student in this session
        const feeCount = await StudentMonthlyFee.count({
            where: { studentId: enrollment.studentId, sessionId: enrollment.sessionId },
        });
        if (feeCount > 0) {
            return sendError(
                res,
                'Cannot delete enrollment: student has fee records in this session',
                400
            );
        }

        await enrollment.destroy();

        return sendSuccess(res, null, 'Enrollment deleted successfully');
    } catch (error) {
        logger.error('Error deleting enrollment', { error });
        return sendError(res, 'Failed to delete enrollment', 500);
    }
};
