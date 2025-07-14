import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Expense from '../models/Expense';
import User from '../models/User';
import { sendError, sendSuccess } from '../utils/response';

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
    const result = await Expense.findAll({
      where: { schoolId: req.schoolId },
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
