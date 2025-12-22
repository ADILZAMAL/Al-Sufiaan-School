// import { Router } from 'express';
// import { authenticate } from '../middleware/auth';
// import { hasPermission } from '../middleware/roleAuth';
// import {
//   generateMonthlyFee,
//   getStudentMonthlyFees,
//   getMonthlyFeeById,
//   updateMonthlyFeeStatus,
//   getSchoolMonthlyFees,
//   getMonthlyFeeAnalytics,
//   bulkGenerateMonthlyFees,
//   deleteMonthlyFee
// } from '../controllers/monthlyFee';

// const router = Router();

// // Generate monthly fee for a student
// router.post(
//   '/students/:studentId/fees/generate',
//   authenticate,
//   hasPermission('fees:create'),
//   generateMonthlyFee
// );

// // Get monthly fees for a specific student
// router.get(
//   '/students/:studentId/fees',
//   authenticate,
//   hasPermission('fees:read'),
//   getStudentMonthlyFees
// );

// // Get all monthly fees for a school
// router.get(
//   '/fees',
//   authenticate,
//   hasPermission('fees:read'),
//   getSchoolMonthlyFees
// );

// // Get monthly fee analytics
// router.get(
//   '/fees/analytics',
//   authenticate,
//   hasPermission('fees:read'),
//   getMonthlyFeeAnalytics
// );

// // Get specific monthly fee by ID
// router.get(
//   '/fees/:id',
//   authenticate,
//   hasPermission('fees:read'),
//   getMonthlyFeeById
// );

// // Update monthly fee status
// router.patch(
//   '/fees/:id/status',
//   authenticate,
//   hasPermission('fees:update'),
//   updateMonthlyFeeStatus
// );

// // Bulk generate monthly fees for multiple students
// router.post(
//   '/fees/bulk-generate',
//   authenticate,
//   hasPermission('fees:create'),
//   bulkGenerateMonthlyFees
// );

// // Delete monthly fee (soft delete/status change)
// router.delete(
//   '/fees/:id',
//   authenticate,
//   hasPermission('fees:delete'),
//   deleteMonthlyFee
// );

// export default router;
