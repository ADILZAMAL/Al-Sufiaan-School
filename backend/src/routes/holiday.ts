import { Router } from 'express';
import verifyToken from '../middleware/auth';
import { body, param } from 'express-validator';
import {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
  checkIsHoliday,
} from '../controllers/holiday';

const router = Router();

// Validation rules for creating holiday
const createHolidayValidation = [
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date format (YYYY-MM-DD)'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date format (YYYY-MM-DD)')
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be equal to or after start date');
      }
      return true;
    }),
  body('name')
    .notEmpty()
    .withMessage('Holiday name is required')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Holiday name must be between 1 and 255 characters'),
  body('reason')
    .optional({ checkFalsy: true })
    .trim(),
];

// Validation rules for updating holiday
const updateHolidayValidation = [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date format (YYYY-MM-DD)'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date format (YYYY-MM-DD)'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Holiday name must be between 1 and 255 characters'),
  body('reason')
    .optional({ checkFalsy: true })
    .trim(),
];

// Validation for date parameter
const dateParamValidation = [
  param('date')
    .isISO8601()
    .withMessage('Date must be a valid date format (YYYY-MM-DD)'),
];

// Routes
router.post('/', verifyToken, createHolidayValidation, createHoliday);
router.get('/', verifyToken, getHolidays);
router.get('/check/:date', verifyToken, dateParamValidation, checkIsHoliday);
router.get('/:id', verifyToken, getHolidayById);
router.put('/:id', verifyToken, updateHolidayValidation, updateHoliday);
router.delete('/:id', verifyToken, deleteHoliday);

export default router;
