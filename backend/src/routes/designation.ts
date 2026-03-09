import { Router } from 'express';
import verifyToken from '../middleware/auth';
import { body } from 'express-validator';
import {
    getDesignations,
    createDesignation,
    updateDesignation,
    deleteDesignation,
} from '../controllers/designation';

const router = Router();

const createDesignationValidation = [
    body('name').notEmpty().withMessage('name is required').trim(),
    body('staffType')
        .notEmpty()
        .withMessage('staffType is required')
        .isIn(['teaching', 'non-teaching'])
        .withMessage('staffType must be "teaching" or "non-teaching"'),
    body('description').optional({ checkFalsy: true }).trim(),
];

const updateDesignationValidation = [
    body('name').optional().notEmpty().withMessage('name cannot be empty').trim(),
    body('description').optional({ checkFalsy: true }).trim(),
    body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

router.get('/', verifyToken, getDesignations);
router.post('/', verifyToken, createDesignationValidation, createDesignation);
router.put('/:id', verifyToken, updateDesignationValidation, updateDesignation);
router.delete('/:id', verifyToken, deleteDesignation);

export default router;
