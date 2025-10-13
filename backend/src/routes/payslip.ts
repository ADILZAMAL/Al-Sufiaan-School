import { Router } from 'express';
import {
    generatePayslip,
    getPayslipsByStaff,
    getPayslipById,
    checkPayslipExists,
    getAllPayslips,
    deletePayslip,
    makePayment,
    getPaymentHistory,
    getPayslipWithPayments,
    deletePayment,
    getNextAvailableMonth
} from '../controllers/payslip';
import verifyToken from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// POST /api/payslips/generate - Generate new payslip
router.post('/generate', generatePayslip);

// GET /api/payslips/staff/:staffType/:staffId - Get all payslips for a specific staff member
router.get('/staff/:staffType/:staffId', getPayslipsByStaff);

// GET /api/payslips/staff/:staffType/:staffId/next-available-month - Get next available month for payslip generation
router.get('/staff/:staffType/:staffId/next-available-month', getNextAvailableMonth);

// GET /api/payslips/check/:staffType/:staffId/:month/:year - Check if payslip exists
router.get('/check/:staffType/:staffId/:month/:year', checkPayslipExists);

// GET /api/payslips/all - Get all payslips for a school (with filters)
router.get('/all', getAllPayslips);

// GET /api/payslips/:id - Get specific payslip by ID
router.get('/:id', getPayslipById);

// GET /api/payslips/:id/with-payments - Get payslip with payment details
router.get('/:id/with-payments', getPayslipWithPayments);

// GET /api/payslips/:id/payments - Get payment history for a payslip
router.get('/:id/payments', getPaymentHistory);

// POST /api/payslips/:id/payments - Make a payment for a payslip
router.post('/:id/payments', makePayment);

// DELETE /api/payslips/:id/payments/:paymentId - Delete a payment
router.delete('/:id/payments/:paymentId', deletePayment);

// DELETE /api/payslips/:id - Delete payslip
router.delete('/:id', deletePayslip);

export default router;
