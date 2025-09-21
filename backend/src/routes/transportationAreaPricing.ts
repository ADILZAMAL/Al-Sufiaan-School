import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
    getAllTransportationAreaPricing,
    getTransportationAreaPricingById,
    getTransportationAreaPricingByArea,
    createTransportationAreaPricing,
    updateTransportationAreaPricing,
    deleteTransportationAreaPricing,
    bulkUpsertTransportationAreaPricing,
    copyPricingToNewYear,
    getTransportationAreaPricingStats
} from '../controllers/transportationAreaPricing';
import verifyToken from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Validation rules
const createValidation = [
    body('areaName')
        .notEmpty()
        .withMessage('Area name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Area name must be between 1 and 100 characters'),
    body('price')
        .isNumeric()
        .withMessage('Price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Price must be greater than or equal to 0'),
    body('feeCategoryId')
        .isInt({ min: 1 })
        .withMessage('Fee category ID must be a positive integer'),
    body('academicYear')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Academic year must be in format YYYY-YY (e.g., 2024-25)'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    body('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Display order must be a non-negative integer')
];

const updateValidation = [
    body('areaName')
        .optional()
        .isLength({ min: 1, max: 100 })
        .withMessage('Area name must be between 1 and 100 characters'),
    body('price')
        .optional()
        .isNumeric()
        .withMessage('Price must be a number')
        .isFloat({ min: 0 })
        .withMessage('Price must be greater than or equal to 0'),
    body('feeCategoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Fee category ID must be a positive integer'),
    body('academicYear')
        .optional()
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Academic year must be in format YYYY-YY (e.g., 2024-25)'),
    body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description must not exceed 500 characters'),
    body('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Display order must be a non-negative integer'),
    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
];

const bulkUpsertValidation = [
    body('pricingData')
        .isArray({ min: 1 })
        .withMessage('Pricing data must be a non-empty array'),
    body('pricingData.*.areaName')
        .notEmpty()
        .withMessage('Area name is required for each item')
        .isLength({ min: 1, max: 100 })
        .withMessage('Area name must be between 1 and 100 characters'),
    body('pricingData.*.price')
        .isNumeric()
        .withMessage('Price must be a number for each item')
        .isFloat({ min: 0 })
        .withMessage('Price must be greater than or equal to 0'),
    body('pricingData.*.feeCategoryId')
        .isInt({ min: 1 })
        .withMessage('Fee category ID must be a positive integer for each item'),
    body('pricingData.*.academicYear')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Academic year must be in format YYYY-YY for each item')
];

const copyPricingValidation = [
    body('fromYear')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('From year must be in format YYYY-YY (e.g., 2024-25)'),
    body('toYear')
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('To year must be in format YYYY-YY (e.g., 2024-25)'),
    body('areaNames')
        .optional()
        .isArray()
        .withMessage('Area names must be an array')
];

const idValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('ID must be a positive integer')
];

const areaNameValidation = [
    param('areaName')
        .notEmpty()
        .withMessage('Area name is required')
        .isLength({ min: 1, max: 100 })
        .withMessage('Area name must be between 1 and 100 characters')
];

const queryValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('academicYear')
        .optional()
        .matches(/^\d{4}-\d{2}$/)
        .withMessage('Academic year must be in format YYYY-YY'),
    query('feeCategoryId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Fee category ID must be a positive integer'),
    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean')
];

// Routes

// GET /api/transportation-area-pricing - Get all transportation area pricing with pagination and filters
router.get('/', queryValidation, getAllTransportationAreaPricing);

// GET /api/transportation-area-pricing/stats - Get transportation area pricing statistics
router.get('/stats', getTransportationAreaPricingStats);

// GET /api/transportation-area-pricing/:id - Get transportation area pricing by ID
router.get('/:id', idValidation, getTransportationAreaPricingById);

// GET /api/transportation-area-pricing/area/:areaName - Get transportation area pricing by area name
router.get('/area/:areaName', areaNameValidation, getTransportationAreaPricingByArea);

// POST /api/transportation-area-pricing - Create new transportation area pricing
router.post('/', createValidation, createTransportationAreaPricing);

// POST /api/transportation-area-pricing/bulk-upsert - Bulk upsert transportation area pricing
router.post('/bulk-upsert', bulkUpsertValidation, bulkUpsertTransportationAreaPricing);

// POST /api/transportation-area-pricing/copy-pricing - Copy pricing from one academic year to another
router.post('/copy-pricing', copyPricingValidation, copyPricingToNewYear);

// PUT /api/transportation-area-pricing/:id - Update transportation area pricing
router.put('/:id', [...idValidation, ...updateValidation], updateTransportationAreaPricing);

// DELETE /api/transportation-area-pricing/:id - Delete transportation area pricing
router.delete('/:id', idValidation, deleteTransportationAreaPricing);

export default router;
