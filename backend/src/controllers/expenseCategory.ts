import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import ExpenseCategory from '../models/ExpenseCategory';
import { sendError, sendSuccess } from '../utils/response';
import sequelize from 'sequelize';
import logger from '../utils/logger';

export const createExpenseCategory = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  try {
    const { name } = req.body;
    const schoolId = req.schoolId;

    // Check if category already exists for this school
    const existingCategory = await ExpenseCategory.findOne({
      where: {
        name: name.toUpperCase(),
        schoolId
      }
    });

    if (existingCategory) {
      return sendError(res, 'Category already exists for this school', 409);
    }

    const category = await ExpenseCategory.create({
      name: name.toUpperCase(),
      schoolId,
      isActive: true
    });

    sendSuccess(res, category, 'Expense category created successfully', 201);
  } catch (error) {
    logger.error('Error creating expense category', { error });
    sendError(res, 'Something went wrong');
  }
};

export const getExpenseCategories = async (req: Request, res: Response) => {
  try {
    const schoolId = req.schoolId;
    const { includeInactive } = req.query;

    const whereClause: any = { schoolId };
    
    // By default, only return active categories unless specifically requested
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    const categories = await ExpenseCategory.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    sendSuccess(res, categories, 'Expense categories fetched successfully');
  } catch (error) {
    logger.error('Error fetching expense categories', { error });
    sendError(res, 'Something went wrong');
  }
};

export const updateExpenseCategory = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  try {
    const { id } = req.params;
    const { name, isActive } = req.body;
    const schoolId = req.schoolId;

    const category = await ExpenseCategory.findOne({
      where: { id, schoolId }
    });

    if (!category) {
      return sendError(res, 'Expense category not found', 404);
    }

    // Check if new name conflicts with existing category
    if (name && name.toUpperCase() !== category.name) {
      const existingCategory = await ExpenseCategory.findOne({
        where: {
          name: name.toUpperCase(),
          schoolId,
          id: { [sequelize.Op.ne]: id }
        }
      });

      if (existingCategory) {
        return sendError(res, 'Category name already exists for this school', 409);
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name.toUpperCase();
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    await category.update(updateData);

    sendSuccess(res, category, 'Expense category updated successfully');
  } catch (error) {
    logger.error('Error updating expense category', { error });
    sendError(res, 'Something went wrong');
  }
};

export const deleteExpenseCategory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;

    const category = await ExpenseCategory.findOne({
      where: { id, schoolId }
    });

    if (!category) {
      return sendError(res, 'Expense category not found', 404);
    }

    // Check if category is being used by any expenses
    const { Expense } = require('../models');
    const expenseCount = await Expense.count({
      where: { categoryId: id }
    });

    if (expenseCount > 0) {
      return sendError(res, 'Cannot delete category that is being used by expenses. Consider deactivating it instead.', 400);
    }

    await category.destroy();

    sendSuccess(res, {}, 'Expense category deleted successfully');
  } catch (error) {
    logger.error('Error deleting expense category', { error });
    sendError(res, 'Something went wrong');
  }
};

export const getExpenseCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schoolId = req.schoolId;

    const category = await ExpenseCategory.findOne({
      where: { id, schoolId }
    });

    if (!category) {
      return sendError(res, 'Expense category not found', 404);
    }

    sendSuccess(res, category, 'Expense category fetched successfully');
  } catch (error) {
    logger.error('Error fetching expense category', { error });
    sendError(res, 'Something went wrong');
  }
};
