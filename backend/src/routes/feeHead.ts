import express from 'express';
import { check } from 'express-validator';
import verifyToken from '../middleware/auth';
import {
    getAllFeeHeads,
    createFeeHead,
    updateFeeHead,
    deleteFeeHead,
    getClassPricing,
    bulkUpsertClassPricing,
} from '../controllers/feeHead';

const router = express.Router();

router.use(verifyToken);

const createValidation = [
    check('name').trim().notEmpty().withMessage('Name is required'),
    check('frequency').isIn(['MONTHLY', 'ONE_TIME']).withMessage('frequency must be MONTHLY or ONE_TIME'),
    check('pricingType').isIn(['FLAT', 'PER_CLASS', 'AREA_BASED', 'CUSTOM']).withMessage('Invalid pricingType'),
    check('applicability').isIn(['AUTO', 'OPT_IN']).withMessage('applicability must be AUTO or OPT_IN'),
    check('flatAmount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('flatAmount must be non-negative'),
];

const updateValidation = [
    check('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    check('frequency').optional().isIn(['MONTHLY', 'ONE_TIME']),
    check('pricingType').optional().isIn(['FLAT', 'PER_CLASS', 'AREA_BASED', 'CUSTOM']),
    check('applicability').optional().isIn(['AUTO', 'OPT_IN']),
    check('flatAmount').optional({ nullable: true }).isFloat({ min: 0 }),
    check('isActive').optional().isBoolean(),
];

const bulkPricingValidation = [
    check('pricingData').isArray({ min: 1 }).withMessage('pricingData must be a non-empty array'),
    check('pricingData.*.classId').isInt({ min: 1 }).withMessage('Valid classId required'),
    check('pricingData.*.amount').isFloat({ min: 0 }).withMessage('Amount must be non-negative'),
];

router.get('/', getAllFeeHeads);
router.post('/', createValidation, createFeeHead);
router.put('/:id', updateValidation, updateFeeHead);
router.delete('/:id', deleteFeeHead);
router.get('/:id/class-pricing', getClassPricing);
router.post('/:id/class-pricing/bulk', bulkPricingValidation, bulkUpsertClassPricing);

export default router;
