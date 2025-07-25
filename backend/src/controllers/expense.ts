import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Expense from '../models/Expense';
import User from '../models/User';
import { sendError, sendSuccess } from '../utils/response';
import sequelize from 'sequelize';

export const addExpense = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const expense = await Expense.create({ ...req.body, userId: req.userId, schoolId: req.schoolId });
    sendSuccess(res, expense, 'Expense added successfully', 201);
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
};

export const fetchExpense = async (req: Request, res: Response) => {
  try {
    const { name, fromDate, toDate } = req.query;
    const where: any = { schoolId: req.schoolId };
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
    const result = await Expense.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName'],
        },
      ],
    });
    sendSuccess(res, result, 'Expenses fetched successfully');
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
};


export const fetchTotalExpenseForCurrentMonth = async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const selectedDate = date ? new Date(date as string) : new Date();
    const result = await Expense.sum('amount', {
      where: {
        schoolId: req.schoolId,
        createdAt: {
          [sequelize.Op.gte]: new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
          [sequelize.Op.lt]: new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1),
        },
      },
    });
    sendSuccess(res, { total: result }, 'Total expense for current month fetched successfully');
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
}

export const updateExpense = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ where: { id, schoolId: req.schoolId } });
    if (!expense) {
      return sendError(res, 'Expense not found', 404);
    }
    const today = new Date();
    const createdAt = new Date(expense.createdAt);
    if (
      createdAt.getFullYear() !== today.getFullYear() ||
      createdAt.getMonth() !== today.getMonth() ||
      createdAt.getDate() !== today.getDate()
    ) {
      return sendError(res, 'You can only edit expenses on the same day they were created', 403);
    }
    await expense.update(req.body);
    sendSuccess(res, expense, 'Expense updated successfully');
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
}

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findOne({ where: { id, schoolId: req.schoolId } });
    if (!expense) {
      return sendError(res, 'Expense not found', 404);
    }
    const today = new Date();
    const createdAt = new Date(expense.createdAt);
    if (
      createdAt.getFullYear() !== today.getFullYear() ||
      createdAt.getMonth() !== today.getMonth() ||
      createdAt.getDate() !== today.getDate()
    ) {
      return sendError(res, 'You can only delete expenses on the same day they were created', 403);
    }
    await expense.destroy();
    sendSuccess(res, {}, 'Expense deleted successfully');
  } catch (error) {
    console.log('Something went wrong', error);
    sendError(res, 'Something went wrong');
  }
}
