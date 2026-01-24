import { Router } from 'express';
import verifyToken from '../middleware/auth';
import { body, param, query } from 'express-validator';
import { AttendanceStatus } from '../models/Attendance';
import {
  bulkMarkAttendance,
  getAttendance,
  getAttendanceById,
  updateAttendance,
  getAttendanceStats,
  getAllAttendanceStats,
  getStudentsWithAttendance,
  getStudentAttendanceCalendar,
} from '../controllers/attendance';

const router = Router();

// Validation rules for bulk marking attendance
const bulkMarkAttendanceValidation = [
  body('attendances')
    .isArray({ min: 1 })
    .withMessage('Attendances array is required and must contain at least one record'),
  body('attendances.*.studentId')
    .notEmpty()
    .withMessage('Student ID is required')
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
  body('attendances.*.status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(Object.values(AttendanceStatus))
    .withMessage(`Status must be either ${Object.values(AttendanceStatus).join(' or ')}`),
  body('attendances.*.remarks')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // Allow null, undefined, or empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // If provided, must be a string
      if (typeof value !== 'string') {
        throw new Error('Remarks must be a string');
      }
      // Check length if it's a string
      if (value.length > 500) {
        throw new Error('Remarks cannot exceed 500 characters');
      }
      return true;
    }),
];

// Validation rules for updating attendance
const updateAttendanceValidation = [
  body('status')
    .optional()
    .isIn(Object.values(AttendanceStatus))
    .withMessage(`Status must be either ${Object.values(AttendanceStatus).join(' or ')}`),
  body('remarks')
    .optional({ checkFalsy: true })
    .custom((value) => {
      // Allow null, undefined, or empty string
      if (value === null || value === undefined || value === '') {
        return true;
      }
      // If provided, must be a string
      if (typeof value !== 'string') {
        throw new Error('Remarks must be a string');
      }
      // Check length if it's a string
      if (value.length > 500) {
        throw new Error('Remarks cannot exceed 500 characters');
      }
      return true;
    }),
];

// Validation rules for query parameters
const getAttendanceQueryValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date format (YYYY-MM-DD)'),
  query('classId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  query('sectionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Section ID must be a positive integer'),
  query('studentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Student ID must be a positive integer'),
];

const getAttendanceStatsValidation = [
  query('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid date format (YYYY-MM-DD)'),
  query('classId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  query('sectionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Section ID must be a positive integer'),
];

// Routes
router.post('/', verifyToken, bulkMarkAttendanceValidation, bulkMarkAttendance);
router.get('/', verifyToken, getAttendanceQueryValidation, getAttendance);
router.get('/stats', verifyToken, getAttendanceStatsValidation, getAttendanceStats);
router.get('/stats/all', verifyToken, getAllAttendanceStats);
router.get('/students/:classId/:sectionId', verifyToken, getStudentsWithAttendance);
router.get('/calendar/:studentId', verifyToken, getStudentAttendanceCalendar);
router.get('/:id', verifyToken, getAttendanceById);
router.put('/:id', verifyToken, updateAttendanceValidation, updateAttendance);

export default router;
