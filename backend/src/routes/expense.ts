import express, {Request, Response} from 'express';
import verifyToken from '../middleware/auth'
import {check, validationResult} from 'express-validator'
import {addExpense, fetchExpense, fetchTotalExpenseForCurrentMonth} from '../controllers/expense'
import {ExpenseCateogy} from '../models/Expense'

const router = express.Router();

router.post('/', verifyToken, [
    check('category', `Category must be one of the following: ${Object.values(ExpenseCateogy).join(', ')}`).isIn(Object.values(ExpenseCateogy)),
    check("amount", `Amount should be decimal`).isDecimal().toFloat(),
    check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required')
], addExpense)

router.get('/', verifyToken, fetchExpense)

router.get('/total-current-month', verifyToken, fetchTotalExpenseForCurrentMonth)

export default router;
