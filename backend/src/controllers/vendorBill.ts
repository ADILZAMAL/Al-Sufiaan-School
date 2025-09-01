import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import VendorBill from '../models/VendorBill';
import Vendor from '../models/Vendor';
import User from '../models/User';
import { sendError, sendSuccess } from '../utils/response';
import sequelize from 'sequelize';

export const addVendorBill = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { vendorId, ...otherData } = req.body;
    
    if (!vendorId) {
      return sendError(res, 'vendorId is required', 400);
    }

    // Validate that the vendor exists and belongs to the school
    const vendor = await Vendor.findOne({
      where: { id: vendorId, schoolId: req.schoolId, isActive: true }
    });
    
    if (!vendor) {
      return sendError(res, 'Invalid vendor', 400);
    }

    const vendorBillData = {
      ...otherData,
      vendorId,
      userId: req.userId,
      schoolId: req.schoolId
    };

    const vendorBill = await VendorBill.create(vendorBillData);
    sendSuccess(res, vendorBill, 'Vendor bill added successfully', 201);
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
};

export const fetchVendorBills = async (req: Request, res: Response) => {
  try {
    const { vendorId, name, fromDate, toDate } = req.query;
    const where: any = { schoolId: req.schoolId };
    
    if (vendorId) {
      where.vendorId = vendorId;
    }
    if (name) {
      where.name = { [sequelize.Op.like]: `%${name}%` };
    }
    if (fromDate && toDate) {
      const to = new Date(toDate as string);
      to.setHours(23, 59, 59, 999);
      where.createdAt = {
        [sequelize.Op.between]: [new Date(fromDate as string), to],
      };
    }
    
    const result = await VendorBill.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName'],
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    sendSuccess(res, result, 'Vendor bills fetched successfully');
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
};

export const updateVendorBill = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { id } = req.params;
    const { vendorId, ...otherData } = req.body;
    
    const vendorBill = await VendorBill.findOne({ where: { id, schoolId: req.schoolId } });
    if (!vendorBill) {
      return sendError(res, 'Vendor bill not found', 404);
    }
    
    const today = new Date();
    const createdAt = new Date(vendorBill.createdAt);
    if (
      createdAt.getFullYear() !== today.getFullYear() ||
      createdAt.getMonth() !== today.getMonth() ||
      createdAt.getDate() !== today.getDate()
    ) {
      return sendError(res, 'You can only edit vendor bills on the same day they were created', 403);
    }

    if (!vendorId) {
      return sendError(res, 'vendorId is required', 400);
    }

    // Validate that the vendor exists and belongs to the school
    const vendor = await Vendor.findOne({
      where: { id: vendorId, schoolId: req.schoolId, isActive: true }
    });
    
    if (!vendor) {
      return sendError(res, 'Invalid vendor', 400);
    }

    const updateData = {
      ...otherData,
      vendorId
    };

    await vendorBill.update(updateData);
    sendSuccess(res, vendorBill, 'Vendor bill updated successfully');
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
};

export const deleteVendorBill = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendorBill = await VendorBill.findOne({ where: { id, schoolId: req.schoolId } });
    if (!vendorBill) {
      return sendError(res, 'Vendor bill not found', 404);
    }
    
    const today = new Date();
    const createdAt = new Date(vendorBill.createdAt);
    if (
      createdAt.getFullYear() !== today.getFullYear() ||
      createdAt.getMonth() !== today.getMonth() ||
      createdAt.getDate() !== today.getDate()
    ) {
      return sendError(res, 'You can only delete vendor bills on the same day they were created', 403);
    }
    
    await vendorBill.destroy();
    sendSuccess(res, {}, 'Vendor bill deleted successfully');
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
};
