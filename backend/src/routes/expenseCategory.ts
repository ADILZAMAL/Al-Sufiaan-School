import express from 'express';
import verifyToken from '../middleware/auth';
import { check } from 'express-validator';
import {
  createExpenseCategory,
  getExpenseCategories,
  updateExpenseCategory,
  deleteExpenseCategory,
  getExpenseCategoryById
} from '../controllers/expenseCategory';

const router = express.Router();

// Validation middleware for category name
const categoryValidation = [
  check('name')
    .isString()
    .withMessage('Name must be a string')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .trim()
];

// GET /api/expense-categories - Get all expense categories for the school
router.get('/', verifyToken, getExpenseCategories);

// GET /api/expense-categories/:id - Get specific expense category
router.get('/:id', verifyToken, getExpenseCategoryById);

// POST /api/expense-categories - Create new expense category
router.post('/', verifyToken, categoryValidation, createExpenseCategory);

// PUT /api/expense-categories/:id - Update expense category
router.put('/:id', verifyToken, [
  ...categoryValidation,
  check('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], updateExpenseCategory);

// DELETE /api/expense-categories/:id - Delete expense category
router.delete('/:id', verifyToken, deleteExpenseCategory);

export default router;
