import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Vendor from '../models/Vendor';
import VendorBill from '../models/VendorBill';
import VendorPayment from '../models/VendorPayment';
import ExpenseCategory from '../models/ExpenseCategory';
import Expense from '../models/Expense';
import User from '../models/User';
import { sendError, sendSuccess } from '../utils/response';
import sequelize from 'sequelize';
import logger from '../utils/logger';

export const addVendor = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { categoryId, ...otherData } = req.body;
    
    if (!categoryId) {
      return sendError(res, 'categoryId is required', 400);
    }

    // Validate that the category exists and belongs to the school
    const expenseCategory = await ExpenseCategory.findOne({
      where: { id: categoryId, schoolId: req.schoolId, isActive: true }
    });
    
    if (!expenseCategory) {
      return sendError(res, 'Invalid expense category', 400);
    }

    const vendorData = {
      ...otherData,
      categoryId,
      schoolId: req.schoolId
    };

    const vendor = await Vendor.create(vendorData);
    sendSuccess(res, vendor, 'Vendor added successfully', 201);
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const fetchVendors = async (req: Request, res: Response) => {
  try {
    const { name } = req.query;
    const where: any = { schoolId: req.schoolId, isActive: true };
    if (name) {
      where.name = { [sequelize.Op.like]: `%${name}%` };
    }
    
    const result = await Vendor.findAll({
      where,
      include: [
        {
          model: ExpenseCategory,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
    });
    sendSuccess(res, result, 'Vendors fetched successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const getVendorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findOne({
      where: { id, schoolId: req.schoolId, isActive: true },
      include: [
        {
          model: ExpenseCategory,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });
    
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }
    
    sendSuccess(res, vendor, 'Vendor fetched successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const updateVendor = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { id } = req.params;
    const { categoryId, ...otherData } = req.body;
    
    const vendor = await Vendor.findOne({ where: { id, schoolId: req.schoolId, isActive: true } });
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    if (!categoryId) {
      return sendError(res, 'categoryId is required', 400);
    }

    // Validate that the category exists and belongs to the school
    const expenseCategory = await ExpenseCategory.findOne({
      where: { id: categoryId, schoolId: req.schoolId, isActive: true }
    });
    
    if (!expenseCategory) {
      return sendError(res, 'Invalid expense category', 400);
    }

    const updateData = {
      ...otherData,
      categoryId
    };

    await vendor.update(updateData);
    sendSuccess(res, vendor, 'Vendor updated successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const deleteVendor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findOne({ where: { id, schoolId: req.schoolId, isActive: true } });
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }
    
    // Soft delete by setting isActive to false
    await vendor.update({ isActive: false });
    sendSuccess(res, {}, 'Vendor deleted successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const getVendorSummary = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findOne({
      where: { id, schoolId: req.schoolId, isActive: true }
    });
    
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    // Calculate total bills amount
    const totalBills = await VendorBill.sum('amount', {
      where: { vendorId: id, schoolId: req.schoolId }
    }) || 0;

    // Calculate total payments made
    const totalPayments = await VendorPayment.sum('amount', {
      where: { vendorId: id, schoolId: req.schoolId }
    }) || 0;

    // Calculate due amount
    const dueAmount = totalBills - totalPayments;

    // Determine payment status
    let status = 'pending';
    if (totalPayments === 0) {
      status = 'pending';
    } else if (dueAmount === 0) {
      status = 'paid';
    } else if (dueAmount > 0) {
      status = 'partial';
    }

    const summary = {
      totalBills,
      totalPayments,
      dueAmount,
      status
    };

    sendSuccess(res, summary, 'Vendor summary fetched successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};
