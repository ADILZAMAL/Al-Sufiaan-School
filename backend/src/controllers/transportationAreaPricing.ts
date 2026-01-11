import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import TransportationAreaPricing from '../models/TransportationAreaPricing';
import School from '../models/School';
import { sendSuccess, sendError } from '../utils/response';

interface AuthenticatedRequest extends Request {
    userId: string;
    schoolId: string;
    userRole: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';
}

// Get all transportation area pricing records
export const getAllTransportationAreaPricing = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const schoolId = req.schoolId;
        const { 
            areaName, 
            isActive,
            page = 1, 
            limit = 10 
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);
        
        const whereClause: any = { schoolId };
        
        if (areaName) whereClause.areaName = { [require('sequelize').Op.iLike]: `%${areaName}%` };
        if (isActive !== undefined) whereClause.isActive = isActive === 'true';

        const { rows: transportationAreaPricing, count } = await TransportationAreaPricing.findAndCountAll({
            where: whereClause,
            order: [['displayOrder', 'ASC'], ['areaName', 'ASC'], ['createdAt', 'DESC']],
            limit: Number(limit),
            offset
        });

        return sendSuccess(res, {
            transportationAreaPricing,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(count / Number(limit)),
                totalItems: count,
                itemsPerPage: Number(limit)
            }
        }, 'Transportation area pricing retrieved successfully');
    } catch (error) {
        console.error('Error fetching transportation area pricing:', error);
        return sendError(res, 'Failed to fetch transportation area pricing', 500);
    }
};

// Get transportation area pricing by ID
export const getTransportationAreaPricingById = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = req.schoolId;

        const transportationAreaPricing = await TransportationAreaPricing.findOne({
            where: { id, schoolId }
        });

        if (!transportationAreaPricing) {
            return sendError(res, 'Transportation area pricing not found', 404);
        }

        return sendSuccess(res, transportationAreaPricing, 'Transportation area pricing retrieved successfully');
    } catch (error) {
        console.error('Error fetching transportation area pricing:', error);
        return sendError(res, 'Failed to fetch transportation area pricing', 500);
    }
};

// Get transportation area pricing by area name
export const getTransportationAreaPricingByArea = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { areaName } = req.params;
        const schoolId = req.schoolId;

        const whereClause: any = { 
            areaName, 
            schoolId,
            isActive: true
        };

        const transportationAreaPricing = await TransportationAreaPricing.findAll({
            where: whereClause,
            order: [['displayOrder', 'ASC'], ['createdAt', 'DESC']]
        });

        const totalAmount = transportationAreaPricing.reduce((sum, pricing) => sum + Number(pricing.price), 0);

        return sendSuccess(res, {
            transportationAreaPricing,
            totalAmount,
            areaName
        }, 'Transportation area pricing retrieved successfully');
    } catch (error) {
        console.error('Error fetching transportation area pricing by area:', error);
        return sendError(res, 'Failed to fetch transportation area pricing', 500);
    }
};

// Create new transportation area pricing
export const createTransportationAreaPricing = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const schoolId = req.schoolId;
        const {
            areaName,
            price,
            description,
            displayOrder
        } = req.body;

        // Check for existing pricing with same area
        const existingPricing = await TransportationAreaPricing.findOne({
            where: {
                areaName,
                schoolId
            }
        });

        if (existingPricing) {
            return sendError(res, 'Transportation area pricing already exists for this area', 409);
        }

        const transportationAreaPricing = await TransportationAreaPricing.create({
            areaName,
            price,
            description,
            displayOrder: displayOrder || 0,
            schoolId
        });

        const createdPricing = await TransportationAreaPricing.findByPk(transportationAreaPricing.id);

        return sendSuccess(res, createdPricing, 'Transportation area pricing created successfully', 201);
    } catch (error) {
        console.error('Error creating transportation area pricing:', error);
        return sendError(res, 'Failed to create transportation area pricing', 500);
    }
};

// Update transportation area pricing
export const updateTransportationAreaPricing = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const { id } = req.params;
        const schoolId = req.schoolId;
        const updateData = req.body;

        const transportationAreaPricing = await TransportationAreaPricing.findOne({
            where: { id, schoolId }
        });

        if (!transportationAreaPricing) {
            return sendError(res, 'Transportation area pricing not found', 404);
        }

        // Check for conflicts if updating area name
        if (updateData.areaName) {
            const conflictCheck = await TransportationAreaPricing.findOne({
                where: {
                    areaName: updateData.areaName,
                    schoolId,
                    id: { [require('sequelize').Op.ne]: id }
                }
            });

            if (conflictCheck) {
                return sendError(res, 'Transportation area pricing already exists for this area', 409);
            }
        }

        await transportationAreaPricing.update(updateData);

        const updatedPricing = await TransportationAreaPricing.findByPk(id);

        return sendSuccess(res, updatedPricing, 'Transportation area pricing updated successfully');
    } catch (error) {
        console.error('Error updating transportation area pricing:', error);
        return sendError(res, 'Failed to update transportation area pricing', 500);
    }
};

// Delete transportation area pricing
export const deleteTransportationAreaPricing = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = req.schoolId;

        const transportationAreaPricing = await TransportationAreaPricing.findOne({
            where: { id, schoolId }
        });

        if (!transportationAreaPricing) {
            return sendError(res, 'Transportation area pricing not found', 404);
        }

        await transportationAreaPricing.destroy();

        return sendSuccess(res, null, 'Transportation area pricing deleted successfully');
    } catch (error) {
        console.error('Error deleting transportation area pricing:', error);
        return sendError(res, 'Failed to delete transportation area pricing', 500);
    }
};

// Bulk upsert transportation area pricing
export const bulkUpsertTransportationAreaPricing = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendError(res, 'Validation failed', 400, errors.array());
        }

        const schoolId = req.schoolId;
        const { pricingData } = req.body;

        if (!Array.isArray(pricingData) || pricingData.length === 0) {
            return sendError(res, 'Pricing data must be a non-empty array', 400);
        }

        const results = [];

        for (const data of pricingData) {
            try {
                const existingPricing = await TransportationAreaPricing.findOne({
                    where: {
                        areaName: data.areaName,
                        schoolId
                    }
                });

                if (existingPricing) {
                    await existingPricing.update({
                        price: data.price,
                        description: data.description,
                        displayOrder: data.displayOrder || 0,
                        isActive: data.isActive !== undefined ? data.isActive : true
                    });
                    results.push({ action: 'updated', id: existingPricing.id });
                } else {
                    const newPricing = await TransportationAreaPricing.create({
                        ...data,
                        schoolId,
                        displayOrder: data.displayOrder || 0
                    });
                    results.push({ action: 'created', id: newPricing.id });
                }
            } catch (error) {
                console.error('Error in bulk operation for item:', data, error);
                // Continue with other items
            }
        }

        return sendSuccess(res, results, 'Bulk operation completed successfully');
    } catch (error) {
        console.error('Error in bulk upsert:', error);
        return sendError(res, 'Failed to perform bulk operation', 500);
    }
};

// Get transportation area pricing statistics
export const getTransportationAreaPricingStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const schoolId = req.schoolId;

        const totalRecords = await TransportationAreaPricing.count({
            where: { schoolId }
        });

        const activeRecords = await TransportationAreaPricing.count({
            where: { schoolId, isActive: true }
        });

        const uniqueAreas = await TransportationAreaPricing.count({
            where: { schoolId },
            distinct: true,
            col: 'areaName'
        });

        const averagePrice = await TransportationAreaPricing.findOne({
            where: { schoolId },
            attributes: [
                [require('sequelize').fn('AVG', require('sequelize').col('price')), 'avgPrice']
            ]
        });

        return sendSuccess(res, {
            totalRecords,
            activeRecords,
            uniqueAreas,
            averagePrice: Number(averagePrice?.get('avgPrice') || 0)
        }, 'Transportation area pricing statistics retrieved successfully');
    } catch (error) {
        console.error('Error fetching transportation area pricing statistics:', error);
        return sendError(res, 'Failed to fetch statistics', 500);
    }
};
