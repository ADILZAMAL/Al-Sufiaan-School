import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import VendorPayment from '../models/VendorPayment';
import Vendor from '../models/Vendor';
import Expense from '../models/Expense';
import User from '../models/User';
import { sendError, sendSuccess } from '../utils/response';
import sequelize from '../config/database';
import { Op } from 'sequelize';
import logger from '../utils/logger';

export const addVendorPayment = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  
  const transaction = await sequelize.transaction();
  
  try {
    const { vendorId, amount, paymentDate, paymentMethod, notes } = req.body;
    
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

    // Create corresponding expense entry first
    const expenseData = {
      amount,
      name: vendor.name,
      userId: req.userId,
      schoolId: req.schoolId,
      categoryId: vendor.categoryId,
      isVendorPayment: true
    };

    const expense = await Expense.create(expenseData, { transaction });

    // Create vendor payment record with expense ID
    const vendorPaymentData = {
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod,
      vendorId,
      userId: req.userId,
      schoolId: req.schoolId,
      expenseId: expense.id,
      notes
    };

    const vendorPayment = await VendorPayment.create(vendorPaymentData, { transaction });

    await transaction.commit();
    
    sendSuccess(res, { vendorPayment, expense }, 'Vendor payment added successfully and expense recorded', 201);
  } catch (error) {
    await transaction.rollback();
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const fetchVendorPayments = async (req: Request, res: Response) => {
  try {
    const { vendorId, fromDate, toDate } = req.query;
    const where: any = { schoolId: req.schoolId };
    
    if (vendorId) {
      where.vendorId = vendorId;
    }
    if (fromDate && toDate) {
      const to = new Date(toDate as string);
      to.setHours(23, 59, 59, 999);
      where.paymentDate = {
        [Op.between]: [new Date(fromDate as string), to],
      };
    }
    
    const result = await VendorPayment.findAll({
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
      order: [['paymentDate', 'DESC']]
    });
    sendSuccess(res, result, 'Vendor payments fetched successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const getVendorPaymentHistory = async (req: Request, res: Response) => {
  try {
    const { vendorId } = req.params;
    
    // Validate that the vendor exists and belongs to the school
    const vendor = await Vendor.findOne({
      where: { id: vendorId, schoolId: req.schoolId, isActive: true }
    });
    
    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    const payments = await VendorPayment.findAll({
      where: { vendorId, schoolId: req.schoolId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName'],
        }
      ],
      order: [['paymentDate', 'DESC']]
    });

    sendSuccess(res, payments, 'Vendor payment history fetched successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const updateVendorPayment = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const vendorPayment = await VendorPayment.findOne({ where: { id, schoolId: req.schoolId } });
    if (!vendorPayment) {
      return sendError(res, 'Vendor payment not found', 404);
    }
    
    const today = new Date();
    const paymentDate = new Date(vendorPayment.paymentDate);
    if (
      paymentDate.getFullYear() !== today.getFullYear() ||
      paymentDate.getMonth() !== today.getMonth() ||
      paymentDate.getDate() !== today.getDate()
    ) {
      return sendError(res, 'You can only edit vendor payments on the same day they were made', 403);
    }

    await vendorPayment.update(updateData);
    sendSuccess(res, vendorPayment, 'Vendor payment updated successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

export const deleteVendorPayment = async (req: Request, res: Response) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const vendorPayment = await VendorPayment.findOne({ where: { id, schoolId: req.schoolId } });
    if (!vendorPayment) {
      return sendError(res, 'Vendor payment not found', 404);
    }
    
    const today = new Date();
    const paymentDate = new Date(vendorPayment.paymentDate);
    if (
      paymentDate.getFullYear() !== today.getFullYear() ||
      paymentDate.getMonth() !== today.getMonth() ||
      paymentDate.getDate() !== today.getDate()
    ) {
      return sendError(res, 'You can only delete vendor payments on the same day they were made', 403);
    }
    
    // Delete the corresponding expense first
    if (vendorPayment.expenseId) {
      await Expense.destroy({ 
        where: { id: vendorPayment.expenseId, schoolId: req.schoolId },
        transaction 
      });
    }
    
    // Then delete the vendor payment
    await vendorPayment.destroy({ transaction });
    
    await transaction.commit();
    sendSuccess(res, {}, 'Vendor payment and corresponding expense deleted successfully');
  } catch (error) {
    await transaction.rollback();
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};
