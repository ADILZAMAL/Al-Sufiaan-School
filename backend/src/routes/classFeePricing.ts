import express from 'express';
import { check } from 'express-validator';
import {
    createClassFeePricing,
    getAllClassFeePricing,
    getClassFeePricing,
    getClassFeePricingByClass,
    updateClassFeePricing,
    deleteClassFeePricing,
    bulkUpsertClassFeePricing
} from '../controllers/classFeePricing';
import verifyToken from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation rules
const createValidation = [
    check('classId')
        .isInt({ min: 1 })
        .withMessage('Valid class ID is required'),
    check('amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number')
];

const updateValidation = [
    check('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
    check('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean value')
];

const bulkUpsertValidation = [
    check('pricingData')
        .isArray({ min: 1 })
        .withMessage('Pricing data must be a non-empty array'),
    check('pricingData.*.classId')
        .isInt({ min: 1 })
        .withMessage('Valid class ID is required for each pricing item'),
    check('pricingData.*.amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number for each pricing item')
];

// Routes

// Create new class fee pricing
router.post('/', createValidation, createClassFeePricing);

// Get all class fee pricing with optional filters
router.get('/', getAllClassFeePricing);

// Get class fee pricing by ID
router.get('/:id', getClassFeePricing);

// Get fee pricing for a specific class
router.get('/class/:classId', getClassFeePricingByClass);

// Update class fee pricing
router.put('/:id', updateValidation, updateClassFeePricing);

// Delete class fee pricing (soft delete)
router.delete('/:id', deleteClassFeePricing);

// Bulk create/update class fee pricing
router.post('/bulk-upsert', bulkUpsertValidation, bulkUpsertClassFeePricing);

export default router;
