import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import FeeCategory from '../models/FeeCategory';
import { sendSuccess, sendError } from '../utils/response';

// Create a new fee category
export const createFeeCategory = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const {
            name,
            pricingType,
            fixedAmount,
            feeType,
            isRefundable,
            isMandatory,
            displayOrder
        } = req.body;

        const feeCategory = await FeeCategory.create({
            name,
            pricingType,
            fixedAmount: pricingType === 'Fixed' ? fixedAmount : 0,
            feeType,
            isRefundable: isRefundable || false,
            isMandatory: isMandatory !== undefined ? isMandatory : true,
            displayOrder: displayOrder || 0,
            isActive: true,
            schoolId: req.schoolId
        });

        sendSuccess(res, feeCategory, 'Fee category created successfully', 201);
    } catch (error: any) {
        console.error('Error creating fee category:', error);
        sendError(res, 'Failed to create fee category', 500, error.message);
    }
};

// Get all fee categories
export const getAllFeeCategories = async (req: Request, res: Response) => {
    try {
        const { isActive, feeType, pricingType } = req.query;
        
        const whereClause: any = {
            schoolId: req.schoolId
        };

        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }

        if (feeType) {
            whereClause.feeType = feeType;
        }

        if (pricingType) {
            whereClause.pricingType = pricingType;
        }

        const feeCategories = await FeeCategory.findAll({
            where: whereClause,
            order: [['displayOrder', 'ASC'], ['name', 'ASC']]
        });

        sendSuccess(res, feeCategories, 'Fee categories retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching fee categories:', error);
        sendError(res, 'Failed to fetch fee categories', 500, error.message);
    }
};

// Get a single fee category by ID
export const getFeeCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const feeCategory = await FeeCategory.findOne({
            where: {
                id,
                schoolId: req.schoolId
            }
        });

        if (!feeCategory) {
            return sendError(res, 'Fee category not found', 404);
        }

        sendSuccess(res, feeCategory, 'Fee category retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching fee category:', error);
        sendError(res, 'Failed to fetch fee category', 500, error.message);
    }
};

// Update a fee category
export const updateFeeCategory = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const { id } = req.params;
        const {
            name,
            pricingType,
            fixedAmount,
            feeType,
            isRefundable,
            isMandatory,
            displayOrder,
            isActive
        } = req.body;

        const feeCategory = await FeeCategory.findOne({
            where: {
                id,
                schoolId: req.schoolId
            }
        });

        if (!feeCategory) {
            return sendError(res, 'Fee category not found', 404);
        }

        await feeCategory.update({
            name: name || feeCategory.name,
            pricingType: pricingType || feeCategory.pricingType,
            fixedAmount: pricingType === 'Fixed' ? (fixedAmount !== undefined ? fixedAmount : feeCategory.fixedAmount) : 0,
            feeType: feeType || feeCategory.feeType,
            isRefundable: isRefundable !== undefined ? isRefundable : feeCategory.isRefundable,
            isMandatory: isMandatory !== undefined ? isMandatory : feeCategory.isMandatory,
            displayOrder: displayOrder !== undefined ? displayOrder : feeCategory.displayOrder,
            isActive: isActive !== undefined ? isActive : feeCategory.isActive
        });

        sendSuccess(res, feeCategory, 'Fee category updated successfully');
    } catch (error: any) {
        console.error('Error updating fee category:', error);
        sendError(res, 'Failed to update fee category', 500, error.message);
    }
};

// Delete a fee category (soft delete)
export const deleteFeeCategory = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const feeCategory = await FeeCategory.findOne({
            where: {
                id,
                schoolId: req.schoolId
            }
        });

        if (!feeCategory) {
            return sendError(res, 'Fee category not found', 404);
        }

        // Soft delete by setting isActive to false
        await feeCategory.update({ isActive: false });

        sendSuccess(res, null, 'Fee category deleted successfully');
    } catch (error: any) {
        console.error('Error deleting fee category:', error);
        sendError(res, 'Failed to delete fee category', 500, error.message);
    }
};

// Get fee categories by type
export const getFeesByType = async (req: Request, res: Response) => {
    try {
        const { type } = req.params;

        const feeCategories = await FeeCategory.findAll({
            where: {
                feeType: type,
                isActive: true,
                schoolId: req.schoolId
            },
            order: [['displayOrder', 'ASC'], ['name', 'ASC']]
        });

        sendSuccess(res, feeCategories, `${type} fee categories retrieved successfully`);
    } catch (error: any) {
        console.error('Error fetching fee categories by type:', error);
        sendError(res, 'Failed to fetch fee categories by type', 500, error.message);
    }
};

// Reorder fee categories
export const reorderFeeCategories = async (req: Request, res: Response) => {
    try {
        const { categoryOrders } = req.body; // Array of {id, displayOrder}

        if (!Array.isArray(categoryOrders)) {
            return sendError(res, 'Invalid data format. Expected array of category orders.', 400);
        }

        // Update display orders
        for (const item of categoryOrders) {
            await FeeCategory.update(
                { displayOrder: item.displayOrder },
                {
                    where: {
                        id: item.id,
                        schoolId: req.schoolId
                    }
                }
            );
        }

        sendSuccess(res, null, 'Fee categories reordered successfully');
    } catch (error: any) {
        console.error('Error reordering fee categories:', error);
        sendError(res, 'Failed to reorder fee categories', 500, error.message);
    }
};
