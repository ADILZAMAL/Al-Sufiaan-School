import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import ClassFeePricing from '../models/ClassFeePricing';
import FeeCategory from '../models/FeeCategory';
import Class from '../models/Class';
import { sendSuccess, sendError } from '../utils/response';

// Create a new class fee pricing
export const createClassFeePricing = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const {
            classId,
            feeCategoryId,
            amount,
            academicYear,
            effectiveFrom,
            effectiveTo
        } = req.body;

        // Check if the fee category exists and is class-based
        const feeCategory = await FeeCategory.findOne({
            where: {
                id: feeCategoryId,
                schoolId: req.schoolId,
                isActive: true
            }
        });

        if (!feeCategory) {
            return sendError(res, 'Fee category not found', 404);
        }

        if (feeCategory.pricingType !== 'Class-based') {
            return sendError(res, 'Fee category must be class-based for class pricing', 400);
        }

        // Check if class exists
        const classExists = await Class.findOne({
            where: {
                id: classId,
                schoolId: req.schoolId
            }
        });

        if (!classExists) {
            return sendError(res, 'Class not found', 404);
        }

        // Check if pricing already exists for this combination
        const existingPricing = await ClassFeePricing.findOne({
            where: {
                classId,
                feeCategoryId,
                academicYear,
                schoolId: req.schoolId,
                isActive: true
            }
        });

        if (existingPricing) {
            return sendError(res, 'Pricing already exists for this class and fee category in the academic year', 409);
        }

        const classFeePricing = await ClassFeePricing.create({
            classId,
            feeCategoryId,
            amount,
            academicYear,
            effectiveFrom,
            effectiveTo,
            isActive: true,
            schoolId: req.schoolId
        });

        // Fetch the created record with associations
        const createdPricing = await ClassFeePricing.findByPk(classFeePricing.id, {
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name']
                },
                {
                    model: FeeCategory,
                    as: 'feeCategory',
                    attributes: ['id', 'name', 'feeType', 'pricingType']
                }
            ]
        });

        sendSuccess(res, createdPricing, 'Class fee pricing created successfully', 201);
    } catch (error: any) {
        console.error('Error creating class fee pricing:', error);
        sendError(res, 'Failed to create class fee pricing', 500, error.message);
    }
};

// Get all class fee pricing
export const getAllClassFeePricing = async (req: Request, res: Response) => {
    try {
        const { classId, feeCategoryId, academicYear, isActive } = req.query;
        
        const whereClause: any = {
            schoolId: req.schoolId
        };

        if (classId) {
            whereClause.classId = classId;
        }

        if (feeCategoryId) {
            whereClause.feeCategoryId = feeCategoryId;
        }

        if (academicYear) {
            whereClause.academicYear = academicYear;
        }

        if (isActive !== undefined) {
            whereClause.isActive = isActive === 'true';
        }

        const classFeePricing = await ClassFeePricing.findAll({
            where: whereClause,
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name']
                },
                {
                    model: FeeCategory,
                    as: 'feeCategory',
                    attributes: ['id', 'name', 'feeType', 'pricingType', 'isMandatory']
                }
            ],
            order: [['academicYear', 'DESC'], ['classId', 'ASC'], ['feeCategoryId', 'ASC']]
        });

        sendSuccess(res, classFeePricing, 'Class fee pricing retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching class fee pricing:', error);
        sendError(res, 'Failed to fetch class fee pricing', 500, error.message);
    }
};

// Get class fee pricing by ID
export const getClassFeePricing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const classFeePricing = await ClassFeePricing.findOne({
            where: {
                id,
                schoolId: req.schoolId
            },
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name']
                },
                {
                    model: FeeCategory,
                    as: 'feeCategory',
                    attributes: ['id', 'name', 'feeType', 'pricingType', 'isMandatory']
                }
            ]
        });

        if (!classFeePricing) {
            return sendError(res, 'Class fee pricing not found', 404);
        }

        sendSuccess(res, classFeePricing, 'Class fee pricing retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching class fee pricing:', error);
        sendError(res, 'Failed to fetch class fee pricing', 500, error.message);
    }
};

// Get fee pricing for a specific class
export const getClassFeePricingByClass = async (req: Request, res: Response) => {
    try {
        const { classId } = req.params;
        const { academicYear } = req.query;

        const whereClause: any = {
            classId,
            schoolId: req.schoolId,
            isActive: true
        };

        if (academicYear) {
            whereClause.academicYear = academicYear;
        }

        const classFeePricing = await ClassFeePricing.findAll({
            where: whereClause,
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name']
                },
                {
                    model: FeeCategory,
                    as: 'feeCategory',
                    attributes: ['id', 'name', 'feeType', 'pricingType', 'isMandatory', 'displayOrder']
                }
            ],
            order: [
                [{ model: FeeCategory, as: 'feeCategory' }, 'displayOrder', 'ASC'],
                [{ model: FeeCategory, as: 'feeCategory' }, 'name', 'ASC']
            ]
        });

        // Calculate total amount
        const totalAmount = classFeePricing.reduce((sum, pricing) => sum + parseFloat(pricing.amount.toString()), 0);

        sendSuccess(res, {
            classFeePricing,
            totalAmount,
            classId,
            academicYear: academicYear || 'All'
        }, 'Class fee pricing retrieved successfully');
    } catch (error: any) {
        console.error('Error fetching class fee pricing by class:', error);
        sendError(res, 'Failed to fetch class fee pricing by class', 500, error.message);
    }
};

// Update class fee pricing
export const updateClassFeePricing = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const { id } = req.params;
        const {
            amount,
            academicYear,
            effectiveFrom,
            effectiveTo,
            isActive
        } = req.body;

        const classFeePricing = await ClassFeePricing.findOne({
            where: {
                id,
                schoolId: req.schoolId
            }
        });

        if (!classFeePricing) {
            return sendError(res, 'Class fee pricing not found', 404);
        }

        await classFeePricing.update({
            amount: amount !== undefined ? amount : classFeePricing.amount,
            academicYear: academicYear || classFeePricing.academicYear,
            effectiveFrom: effectiveFrom || classFeePricing.effectiveFrom,
            effectiveTo: effectiveTo || classFeePricing.effectiveTo,
            isActive: isActive !== undefined ? isActive : classFeePricing.isActive
        });

        // Fetch updated record with associations
        const updatedPricing = await ClassFeePricing.findByPk(classFeePricing.id, {
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name']
                },
                {
                    model: FeeCategory,
                    as: 'feeCategory',
                    attributes: ['id', 'name', 'feeType', 'pricingType']
                }
            ]
        });

        sendSuccess(res, updatedPricing, 'Class fee pricing updated successfully');
    } catch (error: any) {
        console.error('Error updating class fee pricing:', error);
        sendError(res, 'Failed to update class fee pricing', 500, error.message);
    }
};

// Delete class fee pricing (soft delete)
export const deleteClassFeePricing = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const classFeePricing = await ClassFeePricing.findOne({
            where: {
                id,
                schoolId: req.schoolId
            }
        });

        if (!classFeePricing) {
            return sendError(res, 'Class fee pricing not found', 404);
        }

        // Soft delete by setting isActive to false
        await classFeePricing.update({ isActive: false });

        sendSuccess(res, null, 'Class fee pricing deleted successfully');
    } catch (error: any) {
        console.error('Error deleting class fee pricing:', error);
        sendError(res, 'Failed to delete class fee pricing', 500, error.message);
    }
};

// Bulk create/update class fee pricing
export const bulkUpsertClassFeePricing = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const { pricingData } = req.body; // Array of pricing objects

        if (!Array.isArray(pricingData)) {
            return sendError(res, 'Invalid data format. Expected array of pricing data.', 400);
        }

        const results = [];

        for (const pricing of pricingData) {
            const {
                classId,
                feeCategoryId,
                amount,
                academicYear,
                effectiveFrom,
                effectiveTo
            } = pricing;

            // Check if pricing already exists
            const existingPricing = await ClassFeePricing.findOne({
                where: {
                    classId,
                    feeCategoryId,
                    academicYear,
                    schoolId: req.schoolId
                }
            });

            if (existingPricing) {
                // Update existing
                await existingPricing.update({
                    amount,
                    effectiveFrom,
                    effectiveTo,
                    isActive: true
                });
                results.push({ action: 'updated', id: existingPricing.id });
            } else {
                // Create new
                const newPricing = await ClassFeePricing.create({
                    classId,
                    feeCategoryId,
                    amount,
                    academicYear,
                    effectiveFrom,
                    effectiveTo,
                    isActive: true,
                    schoolId: req.schoolId
                });
                results.push({ action: 'created', id: newPricing.id });
            }
        }

        sendSuccess(res, results, 'Bulk class fee pricing operation completed successfully');
    } catch (error: any) {
        console.error('Error in bulk class fee pricing operation:', error);
        sendError(res, 'Failed to perform bulk class fee pricing operation', 500, error.message);
    }
};

// Copy pricing from one academic year to another
export const copyPricingToNewYear = async (req: Request, res: Response) => {
    try {
        const { fromYear, toYear, classIds } = req.body;

        if (!fromYear || !toYear) {
            return sendError(res, 'Both fromYear and toYear are required', 400);
        }

        const whereClause: any = {
            academicYear: fromYear,
            schoolId: req.schoolId,
            isActive: true
        };

        if (classIds && Array.isArray(classIds) && classIds.length > 0) {
            whereClause.classId = classIds;
        }

        const existingPricing = await ClassFeePricing.findAll({
            where: whereClause
        });

        if (existingPricing.length === 0) {
            return sendError(res, 'No pricing data found for the specified year', 404);
        }

        const newPricingData = existingPricing.map(pricing => ({
            classId: pricing.classId,
            feeCategoryId: pricing.feeCategoryId,
            amount: pricing.amount,
            academicYear: toYear,
            effectiveFrom: pricing.effectiveFrom,
            effectiveTo: pricing.effectiveTo,
            isActive: true,
            schoolId: req.schoolId
        }));

        // Use bulkCreate with ignoreDuplicates to avoid conflicts
        const createdPricing = await ClassFeePricing.bulkCreate(newPricingData, {
            ignoreDuplicates: true
        });

        sendSuccess(res, {
            copiedCount: createdPricing.length,
            fromYear,
            toYear
        }, 'Pricing copied to new academic year successfully');
    } catch (error: any) {
        console.error('Error copying pricing to new year:', error);
        sendError(res, 'Failed to copy pricing to new year', 500, error.message);
    }
};
