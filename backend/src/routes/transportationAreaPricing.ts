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
        .withMessage('Price must be greater than or equal to 0')
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

// PUT /api/transportation-area-pricing/:id - Update transportation area pricing
router.put('/:id', [...idValidation, ...updateValidation], updateTransportationAreaPricing);

// DELETE /api/transportation-area-pricing/:id - Delete transportation area pricing
router.delete('/:id', idValidation, deleteTransportationAreaPricing);

export default router;
