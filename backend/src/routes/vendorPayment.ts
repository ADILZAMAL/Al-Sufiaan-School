import express from 'express';
import verifyToken from '../middleware/auth';
import { check } from 'express-validator';
import { 
  addVendorPayment, 
  fetchVendorPayments, 
  getVendorPaymentHistory,
  updateVendorPayment, 
  deleteVendorPayment 
} from '../controllers/vendorPayment';

const router = express.Router();

router.post('/', verifyToken, [
  check("amount").isDecimal().withMessage('Amount should be decimal').toFloat(),
  check("paymentMethod").isString().withMessage('Payment method must be a string').notEmpty().withMessage('Payment method is required'),
  check("vendorId").isInt({ min: 1 }).withMessage('vendorId must be a positive integer'),
  check("paymentDate").optional().isISO8601().withMessage('Payment date must be a valid date'),
  check("notes").optional().isString().withMessage('Notes must be a string')
], addVendorPayment);

router.get('/', verifyToken, fetchVendorPayments);

router.get('/vendor/:vendorId', verifyToken, getVendorPaymentHistory);

router.put('/:id', verifyToken, [
  check("amount").optional().isDecimal().withMessage('Amount should be decimal').toFloat(),
  check("paymentMethod").optional().isString().withMessage('Payment method must be a string').notEmpty().withMessage('Payment method is required'),
  check("paymentDate").optional().isISO8601().withMessage('Payment date must be a valid date'),
  check("notes").optional().isString().withMessage('Notes must be a string')
], updateVendorPayment);

router.delete('/:id', verifyToken, deleteVendorPayment);

export default router;
