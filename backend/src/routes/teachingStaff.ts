import { Router } from 'express';
import {
    createTeachingStaff,
    getAllTeachingStaff,
    getTeachingStaffById,
    updateTeachingStaff,
    deleteTeachingStaff
} from '../controllers/teachingStaff';
import verifyToken from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// POST /api/teaching-staff - Create new teaching staff
router.post('/', createTeachingStaff);

// GET /api/teaching-staff - Get all teaching staff for a school
router.get('/', getAllTeachingStaff);

// GET /api/teaching-staff/:id - Get specific teaching staff by ID
router.get('/:id', getTeachingStaffById);

// PUT /api/teaching-staff/:id - Update teaching staff
router.put('/:id', updateTeachingStaff);

// DELETE /api/teaching-staff/:id - Delete teaching staff
router.delete('/:id', deleteTeachingStaff);

export default router;
