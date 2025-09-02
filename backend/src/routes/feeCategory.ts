import express from 'express';
import { check } from 'express-validator';
import {
    createFeeCategory,
    getAllFeeCategories,
    getFeeCategory,
    updateFeeCategory,
    deleteFeeCategory,
    getFeesByType,
    reorderFeeCategories
} from '../controllers/feeCategory';
import verifyToken from '../middleware/auth';

const router = express.Router();

// Validation rules for fee category
const feeCategoryValidation = [
    check('name')
        .notEmpty()
        .withMessage('Fee category name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Fee category name must be between 2 and 100 characters'),
    check('pricingType')
        .isIn(['Fixed', 'Class-based', 'Area-based'])
        .withMessage('Pricing type must be Fixed, Class-based, or Area-based'),
    check('feeType')
        .isIn(['One-time', 'Annual', 'Monthly', 'Quarterly'])
        .withMessage('Fee type must be One-time, Annual, Monthly, or Quarterly'),
    check('fixedAmount')
        .optional()
        .isNumeric()
        .withMessage('Fixed amount must be a number')
        .custom((value, { req }) => {
            if (req.body.pricingType === 'Fixed' && (!value || value < 0)) {
                throw new Error('Fixed amount is required and must be greater than or equal to 0 for Fixed pricing type');
            }
            return true;
        }),
    check('isRefundable')
        .optional()
        .isBoolean()
        .withMessage('isRefundable must be a boolean'),
    check('isMandatory')
        .optional()
        .isBoolean()
        .withMessage('isMandatory must be a boolean'),
    check('displayOrder')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Display order must be a non-negative integer')
];

// Create a new fee category
router.post(
    '/',
    verifyToken,
    feeCategoryValidation,
    createFeeCategory
);

// Get all fee categories
router.get(
    '/',
    verifyToken,
    getAllFeeCategories
);

// Get fee categories by type
router.get(
    '/type/:type',
    verifyToken,
    check('type')
        .isIn(['One-time', 'Annual', 'Monthly', 'Quarterly'])
        .withMessage('Invalid fee type'),
    getFeesByType
);

// Reorder fee categories
router.put(
    '/reorder',
    verifyToken,
    [
        check('categoryOrders')
            .isArray()
            .withMessage('Category orders must be an array')
            .custom((value) => {
                if (!Array.isArray(value) || value.length === 0) {
                    throw new Error('Category orders array cannot be empty');
                }
                for (const item of value) {
                    if (!item.id || typeof item.displayOrder !== 'number') {
                        throw new Error('Each item must have id and displayOrder');
                    }
                }
                return true;
            })
    ],
    reorderFeeCategories
);

// Get a single fee category by ID
router.get(
    '/:id',
    verifyToken,
    check('id')
        .isInt({ min: 1 })
        .withMessage('Fee category ID must be a positive integer'),
    getFeeCategory
);

// Update a fee category
router.put(
    '/:id',
    verifyToken,
    [
        check('id')
            .isInt({ min: 1 })
            .withMessage('Fee category ID must be a positive integer'),
        check('name')
            .optional()
            .isLength({ min: 2, max: 100 })
            .withMessage('Fee category name must be between 2 and 100 characters'),
        check('pricingType')
            .optional()
            .isIn(['Fixed', 'Class-based', 'Area-based'])
            .withMessage('Pricing type must be Fixed, Class-based, or Area-based'),
        check('feeType')
            .optional()
            .isIn(['One-time', 'Annual', 'Monthly', 'Quarterly'])
            .withMessage('Fee type must be One-time, Annual, Monthly, or Quarterly'),
        check('fixedAmount')
            .optional()
            .isNumeric()
            .withMessage('Fixed amount must be a number'),
        check('isRefundable')
            .optional()
            .isBoolean()
            .withMessage('isRefundable must be a boolean'),
        check('isMandatory')
            .optional()
            .isBoolean()
            .withMessage('isMandatory must be a boolean'),
        check('displayOrder')
            .optional()
            .isInt({ min: 0 })
            .withMessage('Display order must be a non-negative integer'),
        check('isActive')
            .optional()
            .isBoolean()
            .withMessage('isActive must be a boolean')
    ],
    updateFeeCategory
);

// Delete a fee category
router.delete(
    '/:id',
    verifyToken,
    check('id')
        .isInt({ min: 1 })
        .withMessage('Fee category ID must be a positive integer'),
    deleteFeeCategory
);

export default router;
