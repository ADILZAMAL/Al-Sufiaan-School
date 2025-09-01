import express from 'express';
import verifyToken from '../middleware/auth';
import { check } from 'express-validator';
import { 
  addVendorBill, 
  fetchVendorBills, 
  updateVendorBill, 
  deleteVendorBill 
} from '../controllers/vendorBill';

const router = express.Router();

router.post('/', verifyToken, [
  check("amount").isDecimal().withMessage('Amount should be decimal').toFloat(),
  check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
  check("vendorId").isInt({ min: 1 }).withMessage('vendorId must be a positive integer')
], addVendorBill);

router.get('/', verifyToken, fetchVendorBills);

router.put('/:id', verifyToken, [
  check("amount").isDecimal().withMessage('Amount should be decimal').toFloat(),
  check("name").isString().withMessage('Name must be a string').notEmpty().withMessage('Name is required'),
  check("vendorId").isInt({ min: 1 }).withMessage('vendorId must be a positive integer')
], updateVendorBill);

router.delete('/:id', verifyToken, deleteVendorBill);

export default router;
