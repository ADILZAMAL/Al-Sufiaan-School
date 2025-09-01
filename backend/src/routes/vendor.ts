import express from 'express';
import verifyToken from '../middleware/auth';
import { check } from 'express-validator';
import { 
  addVendor, 
  fetchVendors, 
  getVendorById, 
  updateVendor, 
  deleteVendor, 
  getVendorSummary 
} from '../controllers/vendor';

const router = express.Router();

router.post('/', verifyToken, [
  check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
  check("mobile").isString().withMessage('Mobile must be a string').notEmpty().withMessage('Mobile is required'),
  check("categoryId").isInt({ min: 1 }).withMessage('categoryId must be a positive integer'),
  check("upiNumberId").optional().isString().withMessage('UPI Number ID must be a string'),
  check("accountNumber").optional().isString().withMessage('Account Number must be a string'),
  check("ifscCode").optional().isString().withMessage('IFSC Code must be a string'),
  check("address").optional().isString().withMessage('Address must be a string')
], addVendor);

router.get('/', verifyToken, fetchVendors);

router.get('/:id', verifyToken, getVendorById);

router.get('/:id/summary', verifyToken, getVendorSummary);

router.put('/:id', verifyToken, [
  check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
  check("mobile").isString().withMessage('Mobile must be a string').notEmpty().withMessage('Mobile is required'),
  check("categoryId").isInt({ min: 1 }).withMessage('categoryId must be a positive integer'),
  check("upiNumberId").optional().isString().withMessage('UPI Number ID must be a string'),
  check("accountNumber").optional().isString().withMessage('Account Number must be a string'),
  check("ifscCode").optional().isString().withMessage('IFSC Code must be a string'),
  check("address").optional().isString().withMessage('Address must be a string')
], updateVendor);

router.delete('/:id', verifyToken, deleteVendor);

export default router;
