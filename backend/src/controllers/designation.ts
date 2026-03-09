import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Designation from '../models/Designation';
import Staff from '../models/Staff';
import { sendSuccess, sendError } from '../utils/response';
import logger from '../utils/logger';

export const getDesignations = async (req: Request, res: Response) => {
    try {
        const { active } = req.query;
        const schoolId = req.schoolId;

        const whereClause: any = { schoolId };

        if (active !== undefined) {
            whereClause.isActive = active === 'true';
        }

        const designations = await Designation.findAll({
            where: whereClause,
            order: [['name', 'ASC']],
        });

        const result = await Promise.all(
            designations.map(async (d) => {
                const staffCount = await Staff.count({ where: { designationId: d.id } });
                return { ...d.toJSON(), staffCount };
            })
        );

        return sendSuccess(res, result, 'Designations retrieved successfully');
    } catch (error: any) {
        logger.error('Error fetching designations', { error });
        return sendError(res, 'Internal server error', 500);
    }
};

export const createDesignation = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;
        const schoolId = req.schoolId;

        if (!name) {
            return sendError(res, 'name is required', 400);
        }

        const existing = await Designation.findOne({
            where: { name: name.trim(), schoolId },
        });
        if (existing) {
            return sendError(res, 'A designation with this name already exists', 409);
        }

        const designation = await Designation.create({
            name: name.trim(),
            description: description?.trim() || null,
            schoolId,
            isActive: true,
        });

        return sendSuccess(res, designation, 'Designation created successfully', 201);
    } catch (error: any) {
        logger.error('Error creating designation', { error });
        return sendError(res, 'Internal server error', 500);
    }
};

export const updateDesignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const schoolId = req.schoolId;

        const designation = await Designation.findOne({ where: { id, schoolId } });
        if (!designation) {
            return sendError(res, 'Designation not found', 404);
        }

        const updatePayload: any = {};
        if (name !== undefined) updatePayload.name = name.trim();
        if (description !== undefined) updatePayload.description = description?.trim() || null;
        if (isActive !== undefined) updatePayload.isActive = isActive;

        // Check duplicate name if name is being changed
        if (updatePayload.name && updatePayload.name !== designation.name) {
            const duplicate = await Designation.findOne({
                where: {
                    name: updatePayload.name,
                    schoolId,
                    id: { [Op.ne]: designation.id },
                },
            });
            if (duplicate) {
                return sendError(res, 'A designation with this name already exists', 409);
            }
        }

        await designation.update(updatePayload);

        return sendSuccess(res, designation, 'Designation updated successfully');
    } catch (error: any) {
        logger.error('Error updating designation', { error });
        return sendError(res, 'Internal server error', 500);
    }
};

export const deleteDesignation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const schoolId = req.schoolId;

        const designation = await Designation.findOne({ where: { id, schoolId } });
        if (!designation) {
            return sendError(res, 'Designation not found', 404);
        }

        const staffCount = await Staff.count({ where: { designationId: designation.id } });
        if (staffCount > 0) {
            return sendError(
                res,
                `Cannot delete: ${staffCount} staff member(s) are assigned to this designation. Reassign them first.`,
                409
            );
        }

        await designation.destroy();
        return sendSuccess(res, null, 'Designation deleted successfully');
    } catch (error: any) {
        logger.error('Error deleting designation', { error });
        return sendError(res, 'Internal server error', 500);
    }
};
