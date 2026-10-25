import { Router } from 'express';
import {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    markStaffLeftSchool,
} from '../controllers/staff';
import verifyToken, { requireRole } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// Staff records feed logins (name, mobile number = login ID), so only admins may change them.
// Logins themselves are managed through /api/users.
const staffEditors = requireRole(['SUPER_ADMIN', 'ADMIN']);

// POST /api/staff - Create new staff
router.post('/', staffEditors, createStaff);

// GET /api/staff - Get all staff for a school (query: schoolId, active, staffType)
router.get('/', getAllStaff);

// GET /api/staff/:id - Get specific staff by ID
router.get('/:id', getStaffById);

// PUT /api/staff/:id - Update staff
router.put('/:id', staffEditors, updateStaff);

// PUT /api/staff/:id/left-school - Mark staff as left school (also disables their login)
router.put('/:id/left-school', staffEditors, markStaffLeftSchool);

export default router;
