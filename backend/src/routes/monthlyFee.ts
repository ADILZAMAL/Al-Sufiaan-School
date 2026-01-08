import { Router } from 'express';
import verifyToken from '../middleware/auth';
import { 
  generateMonthlyFee,
  getStudentFeeTimelineController,
  collectFeePaymentController,
  getAllIncomingPayments
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

export default router;
