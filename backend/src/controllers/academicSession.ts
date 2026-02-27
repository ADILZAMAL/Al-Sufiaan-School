import { Request, Response } from 'express';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { AcademicSession, Class, StudentEnrollment, Attendance, StudentMonthlyFee } from '../models';
import { sendSuccess, sendError } from '../utils/response';
import { validationResult } from 'express-validator';
import logger from '../utils/logger';

// ── GET /api/sessions ────────────────────────────────────────────────────────

export const getAllSessions = async (req: Request, res: Response) => {
    try {
        const schoolId = parseInt(req.schoolId);

        const sessions = await AcademicSession.findAll({
            where: { schoolId },
            order: [['startDate', 'DESC']],
            include: [
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
            ],
        });

        return sendSuccess(res, sessions, 'Sessions retrieved successfully');
    } catch (error) {
        logger.error('Error fetching sessions', { error });
        return sendError(res, 'Failed to fetch sessions', 500);
    }
};

// ── GET /api/sessions/active ─────────────────────────────────────────────────

export const getActiveSession = async (req: Request, res: Response) => {
    try {
        const schoolId = parseInt(req.schoolId);

        const session = await AcademicSession.findOne({
            where: { schoolId, isActive: true },
            include: [
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
            ],
        });

        if (!session) {
            return sendError(res, 'No active session found for this school', 404);
        }

        return sendSuccess(res, session, 'Active session retrieved successfully');
    } catch (error) {
        logger.error('Error fetching active session', { error });
        return sendError(res, 'Failed to fetch active session', 500);
    }
};

// ── GET /api/sessions/:id ────────────────────────────────────────────────────

export const getSessionById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = parseInt(req.schoolId);

        const session = await AcademicSession.findOne({
            where: { id: parseInt(id), schoolId },
            include: [
                { association: 'creator', attributes: ['id', 'firstName', 'lastName'] },
            ],
        });

        if (!session) {
            return sendError(res, 'Session not found', 404);
        }

        const [classCount, enrollmentCount, attendanceCount, feeCount] = await Promise.all([
            Class.count({ where: { sessionId: session.id } }),
            StudentEnrollment.count({ where: { sessionId: session.id } }),
            Attendance.count({ where: { sessionId: session.id } }),
            StudentMonthlyFee.count({ where: { sessionId: session.id } }),
        ]);

        const data = {
            ...session.toJSON(),
            classCount,
            enrollmentCount,
            attendanceCount,
            feeCount,
        };

        return sendSuccess(res, data, 'Session retrieved successfully');
    } catch (error) {
        logger.error('Error fetching session', { error });
        return sendError(res, 'Failed to fetch session', 500);
    }
};

// ── POST /api/sessions ───────────────────────────────────────────────────────

export const createSession = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, 'Validation failed', 400, errors.array());
    }

    try {
        const { name, startDate, endDate } = req.body;
        const schoolId = parseInt(req.schoolId);
        const userId = parseInt(req.userId);

        // Check for date overlap with existing sessions for this school
        const overlap = await AcademicSession.findOne({
            where: {
                schoolId,
                [Op.or]: [
                    { startDate: { [Op.between]: [startDate, endDate] } },
                    { endDate: { [Op.between]: [startDate, endDate] } },
                    {
                        [Op.and]: [
                            { startDate: { [Op.lte]: startDate } },
                            { endDate: { [Op.gte]: endDate } },
                        ],
                    },
                ],
            },
        });

        if (overlap) {
            return sendError(res, `Dates overlap with existing session "${overlap.name}"`, 400);
        }

        const session = await AcademicSession.create({
            schoolId,
            name: name.trim(),
            startDate,
            endDate,
            isActive: false,
            createdBy: userId,
        });

        return sendSuccess(res, session, 'Session created successfully', 201);
    } catch (error) {
        logger.error('Error creating session', { error });
        return sendError(res, 'Failed to create session', 500);
    }
};

// ── PATCH /api/sessions/:id/activate ────────────────────────────────────────

export const activateSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = parseInt(req.schoolId);

        const session = await AcademicSession.findOne({
            where: { id: parseInt(id), schoolId },
        });

        if (!session) {
            return sendError(res, 'Session not found', 404);
        }

        if (session.isActive) {
            return sendError(res, 'Session is already active', 400);
        }

        await sequelize.transaction(async (t) => {
            // Deactivate all sessions for this school
            await AcademicSession.update(
                { isActive: false },
                { where: { schoolId }, transaction: t }
            );
            // Activate the requested session
            await session.update({ isActive: true }, { transaction: t });
        });

        const updated = await AcademicSession.findByPk(id);
        return sendSuccess(res, updated, `Session "${session.name}" activated successfully`);
    } catch (error) {
        logger.error('Error activating session', { error });
        return sendError(res, 'Failed to activate session', 500);
    }
};

// ── PUT /api/sessions/:id ────────────────────────────────────────────────────

export const updateSession = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, 'Validation failed', 400, errors.array());
    }

    try {
        const { id } = req.params;
        const { name, startDate, endDate } = req.body;
        const schoolId = parseInt(req.schoolId);

        const session = await AcademicSession.findOne({
            where: { id: parseInt(id), schoolId },
        });

        if (!session) {
            return sendError(res, 'Session not found', 404);
        }

        // If any enrollments exist, dates are locked
        if (startDate !== undefined || endDate !== undefined) {
            const hasEnrollments = await StudentEnrollment.count({
                where: { sessionId: session.id },
            });
            if (hasEnrollments > 0) {
                return sendError(
                    res,
                    'Dates cannot be changed once students are enrolled in this session',
                    400
                );
            }

            // Check for date overlap (excluding this session)
            const newStart = startDate ?? session.startDate;
            const newEnd = endDate ?? session.endDate;

            if (new Date(newEnd) < new Date(newStart)) {
                return sendError(res, 'End date must be on or after start date', 400);
            }

            const overlap = await AcademicSession.findOne({
                where: {
                    schoolId,
                    id: { [Op.ne]: session.id },
                    [Op.or]: [
                        { startDate: { [Op.between]: [newStart, newEnd] } },
                        { endDate: { [Op.between]: [newStart, newEnd] } },
                        {
                            [Op.and]: [
                                { startDate: { [Op.lte]: newStart } },
                                { endDate: { [Op.gte]: newEnd } },
                            ],
                        },
                    ],
                },
            });

            if (overlap) {
                return sendError(res, `Dates overlap with existing session "${overlap.name}"`, 400);
            }
        }

        await session.update({
            name: name !== undefined ? name.trim() : session.name,
            startDate: startDate ?? session.startDate,
            endDate: endDate ?? session.endDate,
        });

        return sendSuccess(res, session, 'Session updated successfully');
    } catch (error) {
        logger.error('Error updating session', { error });
        return sendError(res, 'Failed to update session', 500);
    }
};

// ── DELETE /api/sessions/:id ─────────────────────────────────────────────────

export const deleteSession = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = parseInt(req.schoolId);

        const session = await AcademicSession.findOne({
            where: { id: parseInt(id), schoolId },
        });

        if (!session) {
            return sendError(res, 'Session not found', 404);
        }

        // Guard: cannot delete if any data references this session
        const [classCount, enrollmentCount, attendanceCount, feeCount] = await Promise.all([
            Class.count({ where: { sessionId: session.id } }),
            StudentEnrollment.count({ where: { sessionId: session.id } }),
            Attendance.count({ where: { sessionId: session.id } }),
            StudentMonthlyFee.count({ where: { sessionId: session.id } }),
        ]);

        if (classCount > 0 || enrollmentCount > 0 || attendanceCount > 0 || feeCount > 0) {
            return sendError(
                res,
                'Cannot delete session: it has associated classes, enrollments, attendance records, or fee records',
                400
            );
        }

        await session.destroy();

        return sendSuccess(res, null, 'Session deleted successfully');
    } catch (error) {
        logger.error('Error deleting session', { error });
        return sendError(res, 'Failed to delete session', 500);
    }
};
