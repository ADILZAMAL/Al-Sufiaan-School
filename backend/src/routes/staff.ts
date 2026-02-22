import { Router } from 'express';
import {
    createStaff,
    getAllStaff,
    getStaffById,
    updateStaff,
    markStaffLeftSchool
} from '../controllers/staff';
import verifyToken from '../middleware/auth';

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

export default router;
