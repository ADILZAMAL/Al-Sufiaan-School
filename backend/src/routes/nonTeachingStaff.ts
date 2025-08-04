import { Router } from 'express';
import {
    createNonTeachingStaff,
    getAllNonTeachingStaff,
    getNonTeachingStaffById,
    updateNonTeachingStaff,
    deleteNonTeachingStaff
} from '../controllers/nonTeachingStaff';
import verifyToken from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(verifyToken);

// POST /api/non-teaching-staff - Create new non-teaching staff
router.post('/', createNonTeachingStaff);

// GET /api/non-teaching-staff - Get all non-teaching staff for a school
router.get('/', getAllNonTeachingStaff);

// GET /api/non-teaching-staff/:id - Get specific non-teaching staff by ID
router.get('/:id', getNonTeachingStaffById);

// PUT /api/non-teaching-staff/:id - Update non-teaching staff
router.put('/:id', updateNonTeachingStaff);

// DELETE /api/non-teaching-staff/:id - Delete non-teaching staff
router.delete('/:id', deleteNonTeachingStaff);

export default router;
