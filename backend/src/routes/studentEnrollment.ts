import { Router } from 'express';
import verifyToken, { requireRole } from '../middleware/auth';
import { param, body } from 'express-validator';
import {
    getEnrollments,
    getStudentEnrollments,
    enrollStudent,
    updateEnrollment,
    deleteEnrollment,
} from '../controllers/studentEnrollment';

const router = Router();

const adminOnly = requireRole(['SUPER_ADMIN', 'ADMIN']);

// GET /api/sessions/:sessionId/enrollments
router.get(
    '/sessions/:sessionId/enrollments',
    verifyToken,
    param('sessionId').isInt(),
    getEnrollments
);

// GET /api/students/:studentId/enrollments
router.get(
    '/students/:studentId/enrollments',
    verifyToken,
    param('studentId').isInt(),
    getStudentEnrollments
);

// POST /api/sessions/:sessionId/enroll
router.post(
    '/sessions/:sessionId/enroll',
    verifyToken,
    adminOnly,
    param('sessionId').isInt(),
    body('studentId').isInt().withMessage('studentId must be an integer'),
    body('classId').isInt().withMessage('classId must be an integer'),
    body('sectionId').isInt().withMessage('sectionId must be an integer'),
    body('rollNumber').optional({ nullable: true }).isString().trim(),
    enrollStudent
);

// PUT /api/enrollments/:id
router.put(
    '/enrollments/:id',
    verifyToken,
    adminOnly,
    param('id').isInt(),
    body('classId').optional().isInt().withMessage('classId must be an integer'),
    body('sectionId').optional().isInt().withMessage('sectionId must be an integer'),
    body('rollNumber').optional({ nullable: true }).isString().trim(),
    updateEnrollment
);

// DELETE /api/enrollments/:id
router.delete(
    '/enrollments/:id',
    verifyToken,
    adminOnly,
    param('id').isInt(),
    deleteEnrollment
);

export default router;
