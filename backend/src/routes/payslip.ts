import { Router, Request, Response, NextFunction } from 'express';
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
import verifyToken, { denyRoles } from '../middleware/auth';
import Payslip from '../models/Payslip';
import { sendError } from '../utils/response';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Teachers (mobile app) may only read their own payslips; everything else is admin-only.
const adminOnly = denyRoles(['TEACHER']);

const ownStaffOnly = (req: Request, res: Response, next: NextFunction) => {
    if (req.userRole === 'TEACHER' && Number(req.params.staffId) !== req.staffId) {
        return sendError(res, 'You can only view your own payslips', 403);
    }
    next();
};

const ownPayslipOnly = async (req: Request, res: Response, next: NextFunction) => {
    if (req.userRole !== 'TEACHER') return next();
    const payslip = await Payslip.findByPk(req.params.id, { attributes: ['staffId'] });
    if (!payslip || payslip.staffId !== req.staffId) {
        return sendError(res, 'Payslip not found', 404);
    }
    next();
};

// POST /api/payslips/generate - Generate new payslip
router.post('/generate', adminOnly, generatePayslip);

// GET /api/payslips/staff/:staffId - Get all payslips for a specific staff member
router.get('/staff/:staffId', ownStaffOnly, getPayslipsByStaff);

// GET /api/payslips/staff/:staffId/next-available-month - Get next available month for payslip generation
router.get('/staff/:staffId/next-available-month', adminOnly, getNextAvailableMonth);

// GET /api/payslips/check/:staffId/:month/:year - Check if payslip exists
router.get('/check/:staffId/:month/:year', adminOnly, checkPayslipExists);

// GET /api/payslips/all - Get all payslips for a school (with filters)
router.get('/all', adminOnly, getAllPayslips);

// GET /api/payslips/:id - Get specific payslip by ID
router.get('/:id', ownPayslipOnly, getPayslipById);

// GET /api/payslips/:id/with-payments - Get payslip with payment details
router.get('/:id/with-payments', ownPayslipOnly, getPayslipWithPayments);

// GET /api/payslips/:id/payments - Get payment history for a payslip
router.get('/:id/payments', ownPayslipOnly, getPaymentHistory);

// POST /api/payslips/:id/payments - Make a payment for a payslip
router.post('/:id/payments', adminOnly, makePayment);

// DELETE /api/payslips/:id/payments/:paymentId - Delete a payment
router.delete('/:id/payments/:paymentId', adminOnly, deletePayment);

// DELETE /api/payslips/:id - Delete payslip
router.delete('/:id', adminOnly, deletePayslip);

export default router;
