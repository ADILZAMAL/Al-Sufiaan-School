import express, { Request, Response } from 'express'
import verifyToken from '../middleware/auth'
import { check, validationResult } from 'express-validator'
import Section from '../models/Section'
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

const router = express.Router();

// GET sections by classId
router.get("/", verifyToken, async (req: Request, res: Response) => {
    try {
        const { classId } = req.query;
        const schoolId = req.schoolId;

        if (!schoolId) {
            return sendError(res, 'School ID not found in request', 400);
        }

        const whereClause: any = { schoolId };
        if (classId) {
            whereClause.classId = classId;
        }

        const sections = await Section.findAll({
            where: whereClause,
            order: [['name', 'ASC']],
        });

        return sendSuccess(res, sections, 'Sections retrieved successfully');
    } catch (error) {
        logger.error('Error fetching sections', { error });
        return sendError(res, 'Failed to fetch sections', 500);
    }
});

router.post("/", verifyToken,
    [
        check("classId", "ClassId is required").isInt(),
        check("name", "Section name is required").isString(),
    ], async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: errors.array() } });
        }
        try {
            let { classId, name } = req.body
            let section = await Section.create({name, classId, schoolId: req.schoolId});
            res.status(200).json({success: true, data: section})
        } catch (error) {
            logger.error('Error creating section', { error });
            res.status(500).json({success: false, error: {code: 'INTERNAL_SERVER_ERROR', message: "Someting went wrong"}})
        }
    })

export default router
