import express, {Request, Response} from 'express';
import verifyToken from '../middleware/auth'
import {check, validationResult} from 'express-validator'
import {addExpense, fetchExpense, fetchTotalExpenseForCurrentMonth, updateExpense, deleteExpense} from '../controllers/expense'

const router = express.Router();

const expenseCategories = ['SALARY', 'LPG', 'KITCHEN', 'BUILDING', 'DIRECTOR', 'PETROL', 'OTHERS', 'SOHAIL', 'ADIL'];

router.post('/', verifyToken, [
    check('category', `Category must be one of the following: ${expenseCategories.join(', ')}`).isIn(expenseCategories),
    check("amount", `Amount should be decimal`).isDecimal().toFloat(),
    check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required')
], addExpense)

router.put('/:id', verifyToken, [
    check('category', `Category must be one of the following: ${expenseCategories.join(', ')}`).isIn(expenseCategories),
    check("amount", `Amount should be decimal`).isDecimal().toFloat(),
    check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required')
], updateExpense)

router.delete('/:id', verifyToken, deleteExpense)

router.get('/', verifyToken, fetchExpense)

router.get('/total-current-month', verifyToken, fetchTotalExpenseForCurrentMonth)

export default router;
