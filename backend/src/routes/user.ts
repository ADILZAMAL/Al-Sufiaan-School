import express, {Request, Response} from 'express';
import {check} from 'express-validator';
import { 
    changePassword, 
    getAllUsers, 
    getUserById, 
    createUser, 
    updateUser, 
    deleteUser, 
    updateProfile,
    getCurrentUser 
} from '../controllers/user';
import auth from '../middleware/auth';
import { requireSuperAdmin, canModifyUser } from '../middleware/roleAuth';
const router = express.Router();

router.post(
    "/change-password",
    auth,
    [
        check('oldPassword', 'Old Password is required').isLength({
            min: 6
        }),
        check('newPassword', 'New Password with 6 or more character is required').isLength({
            min: 6
        })
    ],
    changePassword
)

// Get current user
router.get("/me", auth, getCurrentUser);

// Get all users (SUPER_ADMIN only)
router.get("/", auth, requireSuperAdmin, getAllUsers);

// Get user by ID
router.get("/:id", auth, canModifyUser, getUserById);

// Create new user (SUPER_ADMIN only)
router.post(
    "/",
    auth,
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
    auth,
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
    auth,
    [
        check('firstName', 'First Name is required').optional().isString().notEmpty(),
        check('lastName', 'Last Name is required').optional().isString().notEmpty(),
        check('email', 'Email is required').optional().isEmail()
    ],
    updateProfile
);

// Delete user (SUPER_ADMIN only)
router.delete("/:id", auth, requireSuperAdmin, deleteUser);

export default router;
