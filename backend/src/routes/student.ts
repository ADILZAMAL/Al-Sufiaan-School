import { Router } from 'express';
// import { authenticate } from '../middleware/auth';
// import { authorize } from '../middleware/roleAuth';
import verifyToken from '../middleware/auth';
import { body } from 'express-validator';
import {Gender, BloodGroup, Religion} from "../models/Student"

import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByClass
} from '../controllers/student';
import { generateMonthlyFee, getStudentFeeTimelineController, collectFeePaymentController } from '../controllers/monthlyFee';

const router = Router();

// Validation rules for creating a student
const createStudentValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('First name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
  
  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Phone number must be a valid Indian mobile number'),
  
  body('dateOfBirth')
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date')
    .toDate()
    .custom((value) => {
      if (value >= new Date()) {
        throw new Error('Date of birth must be in the past');
      }
      return true;
    }),
  
  body('gender')
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(Object.values(Gender))
    .withMessage('Gender must be MALE, FEMALE, or OTHER'),
  
  body('bloodGroup')
    .notEmpty()
    .withMessage('Blood group is required')
    .isIn(Object.values(BloodGroup))
    .withMessage('Invalid blood group'),
  
  body('religion')
    .notEmpty()
    .withMessage('Religion is required')
    .isIn(Object.values(Religion))
    .withMessage('Invalid religion'),
  
  body('aadhaarNumber')
    .optional()
    .matches(/^[0-9]{12}$/)
    .withMessage('Aadhaar number must be exactly 12 digits'),
  
  body('classId')
    .notEmpty()
    .withMessage('Class is required')
    .isInt({ min: 1 })
    .withMessage('Class ID must be a positive integer'),
  
  body('sectionId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Section ID must be a positive integer'),
  
  body('rollNumber')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Roll number cannot exceed 20 characters'),
  
  body('address')
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ min: 5, max: 500 })
    .withMessage('Address must be between 5 and 500 characters'),
  
  body('city')
    .notEmpty()
    .withMessage('City is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('City must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('City can only contain letters and spaces'),
  
  body('state')
    .notEmpty()
    .withMessage('State is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('State must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('State can only contain letters and spaces'),
  
  body('pincode')
    .notEmpty()
    .withMessage('Pincode is required')
    .matches(/^[0-9]{6}$/)
    .withMessage('Pincode must be exactly 6 digits'),
  
  body('fatherName')
    .notEmpty()
    .withMessage('Father name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Father name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Father name can only contain letters and spaces'),
  
  body('fatherPhone')
    .optional()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Father phone must be a valid Indian mobile number'),
  
  body('fatherOccupation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Father occupation cannot exceed 100 characters'),
  
  body('motherName')
    .notEmpty()
    .withMessage('Mother name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Mother name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Mother name can only contain letters and spaces'),
  
  body('motherPhone')
    .optional()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Mother phone must be a valid Indian mobile number'),
  
  body('motherOccupation')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Mother occupation cannot exceed 100 characters'),
  
  body('guardianName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Guardian name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Guardian name can only contain letters and spaces'),
  
  body('guardianRelation')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Guardian relation cannot exceed 50 characters'),
  
  body('guardianPhone')
    .optional()
    .matches(/^(\+91)?[6-9]\d{9}$/)
    .withMessage('Guardian phone must be a valid Indian mobile number'),
  
  body('fatherAadharNumber')
    .optional()
    .matches(/^[0-9]{12}$/)
    .withMessage('Father Aadhaar number must be exactly 12 digits'),
  
  // Photo URLs (optional)
  body('studentPhoto')
    .optional()
    .isURL()
    .withMessage('Student photo must be a valid URL'),
  
  body('fatherPhoto')
    .optional()
    .isURL()
    .withMessage('Father photo must be a valid URL'),
  
  body('motherPhoto')
    .optional()
    .isURL()
    .withMessage('Mother photo must be a valid URL'),
  
  body('guardianPhoto')
    .optional()
    .isURL()
    .withMessage('Guardian photo must be a valid URL'),
  
  // Custom validation: At least one parent or guardian phone should be provided
  body().custom((value, { req }) => {
    const { fatherPhone, motherPhone, guardianPhone } = req.body;
    if (!fatherPhone && !motherPhone && !guardianPhone) {
      throw new Error('At least one parent or guardian phone number is required');
    }
    return true;
  })
];

router.get('/', verifyToken, getAllStudents);

router.post('/', verifyToken, createStudentValidation, createStudent);


router.get('/class/:classId', verifyToken, getStudentsByClass);
router.get('/:id', verifyToken, getStudentById);

// Student routes - Write access for authorized roles
router.put('/:id', verifyToken, updateStudent);
router.delete('/:id', verifyToken, deleteStudent);

// Student routes - Fees
router.post(
  '/:studentId/fees/generate',
  verifyToken,
  generateMonthlyFee
)

router.get(
  '/:studentId/fees/timeline',
  verifyToken,
  getStudentFeeTimelineController
)

// Collect fee payment
router.post(
  '/:studentId/fees/:monthlyFeeId/collect',
  verifyToken,
  collectFeePaymentController
)

export default router;
