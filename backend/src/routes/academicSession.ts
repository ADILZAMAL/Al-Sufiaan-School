import { Router } from 'express';
import verifyToken, { requireRole } from '../middleware/auth';
import { body, param } from 'express-validator';
import {
    getAllSessions,
    getActiveSession,
    getSessionById,
    createSession,
    activateSession,
    updateSession,
    deleteSession,
} from '../controllers/academicSession';

const router = Router();

const adminOnly = requireRole(['SUPER_ADMIN', 'ADMIN']);

const createSessionValidation = [
    body('name')
        .notEmpty().withMessage('Session name is required')
        .trim()
        .isLength({ max: 50 }).withMessage('Session name must be at most 50 characters'),
    body('startDate')
        .notEmpty().withMessage('Start date is required')
        .isISO8601().withMessage('Start date must be a valid date (YYYY-MM-DD)'),
    body('endDate')
        .notEmpty().withMessage('End date is required')
        .isISO8601().withMessage('End date must be a valid date (YYYY-MM-DD)')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startDate)) {
                throw new Error('End date must be after start date');
            }
            return true;
        }),
];

const updateSessionValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 }).withMessage('Session name must be between 1 and 50 characters'),
    body('startDate')
        .optional()
        .isISO8601().withMessage('Start date must be a valid date (YYYY-MM-DD)'),
    body('endDate')
        .optional()
        .isISO8601().withMessage('End date must be a valid date (YYYY-MM-DD)'),
];

router.get('/', verifyToken, getAllSessions);
router.get('/active', verifyToken, getActiveSession);
router.get('/:id', verifyToken, param('id').isInt(), getSessionById);
router.post('/', verifyToken, adminOnly, createSessionValidation, createSession);
router.patch('/:id/activate', verifyToken, adminOnly, activateSession);
router.put('/:id', verifyToken, adminOnly, updateSessionValidation, updateSession);
router.delete('/:id', verifyToken, adminOnly, deleteSession);

export default router;
