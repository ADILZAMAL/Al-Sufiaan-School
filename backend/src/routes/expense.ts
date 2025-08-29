import express, {Request, Response} from 'express';
import verifyToken from '../middleware/auth'
import {check, validationResult} from 'express-validator'
import {addExpense, fetchExpense, fetchTotalExpenseForCurrentMonth, updateExpense, deleteExpense} from '../controllers/expense'

const router = express.Router();

const expenseCategories = ['SALARY', 'LPG', 'KITCHEN', 'BUILDING', 'DIRECTOR', 'PETROL', 'OTHERS', 'SOHAIL', 'ADIL'];

// Custom validation for category/categoryId
const categoryValidation = (req: any, res: any, next: any) => {
    const { category, categoryId } = req.body;
    
    // Either category or categoryId must be provided, but not both
    if (!category && !categoryId) {
        return res.status(400).json({
            success: false,
            message: 'Either category or categoryId must be provided'
        });
    }
    
    if (category && categoryId) {
        return res.status(400).json({
            success: false,
            message: 'Cannot provide both category and categoryId'
        });
    }
    
    // If using old category system, validate against enum
    if (category && !expenseCategories.includes(category)) {
        return res.status(400).json({
            success: false,
            message: `Category must be one of the following: ${expenseCategories.join(', ')}`
        });
    }
    
    // If using new categoryId system, validate it's a number
    if (categoryId && (!Number.isInteger(Number(categoryId)) || Number(categoryId) <= 0)) {
        return res.status(400).json({
            success: false,
            message: 'categoryId must be a positive integer'
        });
    }
    
    next();
};

router.post('/', verifyToken, [
    check("amount", `Amount should be decimal`).isDecimal().toFloat(),
    check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
    categoryValidation
], addExpense)

router.put('/:id', verifyToken, [
    check("amount", `Amount should be decimal`).isDecimal().toFloat(),
    check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
    categoryValidation
], updateExpense)

router.delete('/:id', verifyToken, deleteExpense)

router.get('/', verifyToken, fetchExpense)

router.get('/total-current-month', verifyToken, fetchTotalExpenseForCurrentMonth)

export default router;
