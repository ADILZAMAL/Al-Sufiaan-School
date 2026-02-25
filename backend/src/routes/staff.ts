import { Router } from 'express';
import {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    markStaffLeftSchool,
    enableStaffLogin,
    disableStaffLogin,
    resetStaffPassword,
} from '../controllers/staff';
import verifyToken, { requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// POST /api/staff - Create new staff
router.post('/', createStaff);

// GET /api/staff - Get all staff for a school (query: schoolId, active, staffType)
router.get('/', getAllStaff);

// GET /api/staff/:id - Get specific staff by ID
router.get('/:id', getStaffById);

// PUT /api/staff/:id - Update staff
router.put('/:id', updateStaff);

// PUT /api/staff/:id/left-school - Mark staff as left school
router.put('/:id/left-school', markStaffLeftSchool);

// POST /api/staff/:id/enable-login - Enable mobile app login for staff
router.post('/:id/enable-login', requireRole(['SUPER_ADMIN', 'ADMIN']), enableStaffLogin);

// DELETE /api/staff/:id/disable-login - Disable mobile app login for staff
router.delete('/:id/disable-login', requireRole(['SUPER_ADMIN', 'ADMIN']), disableStaffLogin);

// PUT /api/staff/:id/reset-password - Reset staff login password
router.put('/:id/reset-password', requireRole(['SUPER_ADMIN', 'ADMIN']), resetStaffPassword);

export default router;
