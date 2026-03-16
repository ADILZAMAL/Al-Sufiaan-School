import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import FeeHead from '../models/FeeHead';
import FeeHeadClassPricing from '../models/FeeHeadClassPricing';
import StudentMonthlyFeeItem from '../models/StudentMonthlyFeeItem';
import Class from '../models/Class';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

// GET /api/fee-heads
export const getAllFeeHeads = async (req: Request, res: Response) => {
    try {
        const feeHeads = await FeeHead.findAll({
            where: { schoolId: req.schoolId },
            order: [['displayOrder', 'ASC'], ['name', 'ASC']],
        });
        sendSuccess(res, feeHeads, 'Fee heads retrieved successfully');
    } catch (error: any) {
        logger.error('Error fetching fee heads', { error });
        sendError(res, 'Failed to fetch fee heads', 500, error.message);
    }
};

// POST /api/fee-heads
export const createFeeHead = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

        const { name, description, frequency, pricingType, applicability, flatAmount, displayOrder } = req.body;

        const feeHead = await FeeHead.create({
            schoolId: req.schoolId,
            name,
            description: description || null,
            frequency,
            pricingType,
            applicability,
            flatAmount: pricingType === 'FLAT' ? (flatAmount ?? null) : null,
            isActive: true,
            displayOrder: displayOrder ?? 0,
            legacyType: null,
        });

        sendSuccess(res, feeHead, 'Fee head created successfully', 201);
    } catch (error: any) {
        logger.error('Error creating fee head', { error });
        sendError(res, 'Failed to create fee head', 500, error.message);
    }
};

// PUT /api/fee-heads/:id
export const updateFeeHead = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

        const { id } = req.params;
        const { name, description, frequency, pricingType, applicability, flatAmount, isActive, displayOrder } = req.body;

        const feeHead = await FeeHead.findOne({ where: { id, schoolId: req.schoolId } });
        if (!feeHead) return sendError(res, 'Fee head not found', 404);

        const resolvedPricingType = pricingType ?? feeHead.pricingType;

        await feeHead.update({
            name: name ?? feeHead.name,
            description: description !== undefined ? description : feeHead.description,
            frequency: frequency ?? feeHead.frequency,
            pricingType: resolvedPricingType,
            applicability: applicability ?? feeHead.applicability,
            flatAmount: resolvedPricingType === 'FLAT' ? (flatAmount ?? feeHead.flatAmount) : null,
            isActive: isActive !== undefined ? isActive : feeHead.isActive,
            displayOrder: displayOrder ?? feeHead.displayOrder,
        });

        sendSuccess(res, feeHead, 'Fee head updated successfully');
    } catch (error: any) {
        logger.error('Error updating fee head', { error });
        sendError(res, 'Failed to update fee head', 500, error.message);
    }
};

// DELETE /api/fee-heads/:id (soft delete — sets isActive=false)
export const deleteFeeHead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const feeHead = await FeeHead.findOne({ where: { id, schoolId: req.schoolId } });
        if (!feeHead) return sendError(res, 'Fee head not found', 404);

        // Block if any fee item references this head
        const activeRef = await StudentMonthlyFeeItem.findOne({
            where: { feeHeadId: feeHead.id },
        });
        if (activeRef) {
            return sendError(res, 'Cannot deactivate fee head that is referenced by existing fee items', 400);
        }

        await feeHead.update({ isActive: false });
        sendSuccess(res, null, 'Fee head deactivated successfully');
    } catch (error: any) {
        logger.error('Error deleting fee head', { error });
        sendError(res, 'Failed to delete fee head', 500, error.message);
    }
};

// GET /api/fee-heads/:id/class-pricing
export const getClassPricing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const feeHead = await FeeHead.findOne({ where: { id, schoolId: req.schoolId } });
        if (!feeHead) return sendError(res, 'Fee head not found', 404);

        const pricing = await FeeHeadClassPricing.findAll({
            where: { feeHeadId: id, schoolId: req.schoolId },
            include: [{ model: Class, as: 'class', attributes: ['id', 'name'] }],
            order: [['classId', 'ASC']],
        });

        sendSuccess(res, pricing, 'Class pricing retrieved successfully');
    } catch (error: any) {
        logger.error('Error fetching class pricing', { error });
        sendError(res, 'Failed to fetch class pricing', 500, error.message);
    }
};

// POST /api/fee-heads/:id/class-pricing/bulk
export const bulkUpsertClassPricing = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return sendError(res, 'Validation failed', 400, errors.array());

        const { id } = req.params;
        const { pricingData } = req.body; // [{ classId, amount }]

        const feeHead = await FeeHead.findOne({ where: { id, schoolId: req.schoolId } });
        if (!feeHead) return sendError(res, 'Fee head not found', 404);

        const results = [];

        for (const { classId, amount } of pricingData) {
            const existing = await FeeHeadClassPricing.findOne({
                where: { feeHeadId: feeHead.id, classId, schoolId: req.schoolId },
            });
            if (existing) {
                await existing.update({ amount, isActive: true });
                results.push({ action: 'updated', classId });
            } else {
                await FeeHeadClassPricing.create({
                    feeHeadId: feeHead.id,
                    classId,
                    schoolId: req.schoolId,
                    amount,
                    isActive: true,
                });
                results.push({ action: 'created', classId });
            }
        }

        sendSuccess(res, results, 'Class pricing updated successfully');
    } catch (error: any) {
        logger.error('Error in bulk upsert class pricing', { error });
        sendError(res, 'Failed to update class pricing', 500, error.message);
    }
};
