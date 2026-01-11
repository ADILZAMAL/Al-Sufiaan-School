import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import ClassFeePricing from '../models/ClassFeePricing';
import Class from '../models/Class';
import { sendSuccess, sendError } from '../utils/response';

// Create a new class fee pricing (tuition fee)
export const createClassFeePricing = async (req: Request, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const {
            classId,
            amount
        } = req.body;

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

        // Check if pricing already exists for this class
        const existingPricing = await ClassFeePricing.findOne({
            where: {
                classId,
                schoolId: req.schoolId,
                isActive: true
            }
        });

        if (existingPricing) {
            return sendError(res, 'Tuition fee pricing already exists for this class', 409);
        }

        const classFeePricing = await ClassFeePricing.create({
            classId,
            amount,
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
                }
            ]
        });

        sendSuccess(res, createdPricing, 'Class tuition fee pricing created successfully', 201);
    } catch (error: any) {
        console.error('Error creating class fee pricing:', error);
        sendError(res, 'Failed to create class fee pricing', 500, error.message);
    }
};

// Get all class fee pricing
export const getAllClassFeePricing = async (req: Request, res: Response) => {
    try {
        const { classId, isActive } = req.query;
        
        const whereClause: any = {
            schoolId: req.schoolId
        };

        if (classId) {
            whereClause.classId = classId;
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
                }
            ],
            order: [['classId', 'ASC']]
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

        const whereClause: any = {
            classId,
            schoolId: req.schoolId,
            isActive: true
        };

        const classFeePricing = await ClassFeePricing.findAll({
            where: whereClause,
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name']
                }
            ]
        });

        // Calculate total amount (tuition fee)
        const totalAmount = classFeePricing.reduce((sum, pricing) => sum + parseFloat(pricing.amount.toString()), 0);

        sendSuccess(res, {
            classFeePricing,
            totalAmount,
            classId
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
            isActive: isActive !== undefined ? isActive : classFeePricing.isActive
        });

        // Fetch updated record with associations
        const updatedPricing = await ClassFeePricing.findByPk(classFeePricing.id, {
            include: [
                {
                    model: Class,
                    as: 'class',
                    attributes: ['id', 'name']
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
                amount
            } = pricing;

            // Check if pricing already exists
            const existingPricing = await ClassFeePricing.findOne({
                where: {
                    classId,
                    schoolId: req.schoolId
                }
            });

            if (existingPricing) {
                // Update existing
                await existingPricing.update({
                    amount,
                    isActive: true
                });
                results.push({ action: 'updated', id: existingPricing.id });
            } else {
                // Create new
                const newPricing = await ClassFeePricing.create({
                    classId,
                    amount,
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
