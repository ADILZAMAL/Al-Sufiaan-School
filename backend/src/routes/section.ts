import express, { Request, Response } from 'express'
import verifyToken from '../middleware/auth'
import { check, validationResult } from 'express-validator'
import Section from '../models/Section'

const router = express();

//classId & name
router.post("/", verifyToken,
    [
        check("classId", "Class is required").isString(),
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
            console.log(error);
            res.status(500).json({success: false, error: {code: 'INTERNAL_SERVER_ERROR', message: "Someting went wrong"}})
        }
    })

export default router