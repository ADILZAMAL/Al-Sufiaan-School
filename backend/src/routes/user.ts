import express, {Request, Response} from 'express';
import {check} from 'express-validator';
import { 
    getAllUsers, 
    getUserById, 
    createUser, 
    updateUser, 
    deleteUser, 
    updateProfile
} from '../controllers/user';
import verifyToken from '../middleware/auth';
import { requireSuperAdmin, canModifyUser } from '../middleware/roleAuth';
const router = express.Router();

// Get all users (SUPER_ADMIN only)
router.get("/", verifyToken, requireSuperAdmin, getAllUsers);

// Get user by ID
router.get("/:id", verifyToken, canModifyUser, getUserById);

// Create new user (SUPER_ADMIN only)
router.post(
    "/",
    verifyToken,
    requireSuperAdmin,
    [
        check('firstName', 'First Name is required').isString().notEmpty(),
        check('lastName', 'Last Name is required').isString().notEmpty(),
        check('email', 'Email is required').isEmail(),
        check('password', 'Password with 6 or more characters is required').isLength({
            min: 6
        }),
        check('role', 'Role is required').isIn(['SUPER_ADMIN', 'ADMIN', 'CASHIER']),
        check('schoolId', 'School ID is required').isInt()
    ],
    createUser
);

// Update user (SUPER_ADMIN or self)
router.put(
    "/:id",
    verifyToken,
    canModifyUser,
    [
        check('firstName', 'First Name is required').optional().isString().notEmpty(),
        check('lastName', 'Last Name is required').optional().isString().notEmpty(),
        check('email', 'Email is required').optional().isEmail(),
        check('role', 'Invalid role').optional().isIn(['SUPER_ADMIN', 'ADMIN', 'CASHIER'])
    ],
    updateUser
);

// Update own profile
router.put(
    "/profile/me",
    verifyToken,
    [
        check('firstName', 'First Name is required').optional().isString().notEmpty(),
        check('lastName', 'Last Name is required').optional().isString().notEmpty(),
        check('email', 'Email is required').optional().isEmail()
    ],
    updateProfile
);

// Delete user (SUPER_ADMIN only)
router.delete("/:id", verifyToken, requireSuperAdmin, deleteUser);

export default router;
