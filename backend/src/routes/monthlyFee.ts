import { Router } from 'express';
import verifyToken, { requireRole } from '../middleware/auth';
import { 
  generateMonthlyFee,
  getStudentFeeTimelineController,
  collectFeePaymentController,
  getAllIncomingPayments,
  verifyPaymentController
} from '../controllers/monthlyFee';

const router = Router();

// Generate monthly fee for a student
router.post(
  '/students/:studentId/fees/generate',
  verifyToken,
  generateMonthlyFee
);

// Get student fee timeline
router.get(
  '/students/:studentId/fees/timeline',
  verifyToken,
  getStudentFeeTimelineController
);

// Collect fee payment for a student
router.post(
  '/students/:studentId/fees/:monthlyFeeId/payments',
  verifyToken,
  collectFeePaymentController
);

// Get all incoming payments
router.get(
  '/payments',
  verifyToken,
  getAllIncomingPayments
);

// Verify a payment (Admin only)
router.post(
  '/payments/:paymentId/verify',
  verifyToken,
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  verifyPaymentController
);

export default router;
