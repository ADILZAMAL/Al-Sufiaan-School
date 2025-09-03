import express from 'express';
import { check } from 'express-validator';
import {
    createClassFeePricing,
    getAllClassFeePricing,
    getClassFeePricing,
    getClassFeePricingByClass,
    updateClassFeePricing,
    deleteClassFeePricing,
    bulkUpsertClassFeePricing,
    copyPricingToNewYear
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
    check('feeCategoryId')
        .isInt({ min: 1 })
        .withMessage('Valid fee category ID is required'),
    check('amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
    check('academicYear')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Academic year must be in format YYYY-YY (e.g., 2024-25)'),
    check('effectiveFrom')
        .isISO8601()
        .withMessage('Valid effective from date is required'),
    check('effectiveTo')
        .isISO8601()
        .withMessage('Valid effective to date is required')
];

const updateValidation = [
    check('amount')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number'),
    check('academicYear')
        .optional()
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Academic year must be in format YYYY-YY (e.g., 2024-25)'),
    check('effectiveFrom')
        .optional()
        .isISO8601()
        .withMessage('Valid effective from date is required'),
    check('effectiveTo')
        .optional()
        .isISO8601()
        .withMessage('Valid effective to date is required'),
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
    check('pricingData.*.feeCategoryId')
        .isInt({ min: 1 })
        .withMessage('Valid fee category ID is required for each pricing item'),
    check('pricingData.*.amount')
        .isFloat({ min: 0 })
        .withMessage('Amount must be a positive number for each pricing item'),
    check('pricingData.*.academicYear')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Academic year must be in format YYYY-YY for each pricing item')
];

const copyPricingValidation = [
    check('fromYear')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('From year must be in format YYYY-YY (e.g., 2024-25)'),
    check('toYear')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('To year must be in format YYYY-YY (e.g., 2025-26)'),
    check('classIds')
        .optional()
        .isArray()
        .withMessage('Class IDs must be an array if provided'),
    check('classIds.*')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Each class ID must be a valid integer')
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

// Copy pricing from one academic year to another
router.post('/copy-pricing', copyPricingValidation, copyPricingToNewYear);

export default router;
