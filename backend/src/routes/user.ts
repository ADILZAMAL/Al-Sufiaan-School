import express from 'express';
import { check } from 'express-validator';
import { getAllUsers, createUser, updateUser, resetUserPassword, deleteUser } from '../controllers/user';
import verifyToken, { requireRole } from '../middleware/auth';
import { USER_ROLES } from '../models/User';
const router = express.Router();

// Who may touch which login (Admins: Teacher logins only) is decided in utils/loginAccounts
const loginManagers = requireRole(['SUPER_ADMIN', 'ADMIN']);

const loginFields = [
    check('role', 'Choose a valid role').optional().isIn(USER_ROLES),
    check('firstName', 'First name must be text').optional().isString(),
    check('lastName', 'Last name must be text').optional({ values: 'null' }).isString(),
    check('mobileNumber', 'Mobile number must be 10 digits').optional().matches(/^\d{10}$/),
    check('email', 'Enter a valid email address').optional({ values: 'falsy' }).trim().isEmail(),
];

// List every login (SUPER_ADMIN only — the User Management page)
router.get("/", verifyToken, requireRole(['SUPER_ADMIN']), getAllUsers);

// Create a login (for a staff member via staffId, or a non-staff office account)
router.post(
    "/",
    verifyToken,
    loginManagers,
    [
        ...loginFields,
        check('role', 'Role is required').exists(),
        check('password', 'Password is required').isString(),
        check('staffId', 'Invalid staff member').optional().isInt({ min: 1 }).toInt(),
    ],
    createUser
);

// Update role / name / mobile / email
router.put("/:id", verifyToken, loginManagers, loginFields, updateUser);

// Reset someone else's password (own password: PUT /api/auth/change-password)
router.put(
    "/:id/password",
    verifyToken,
    loginManagers,
    [check('password', 'Password is required').isString()],
    resetUserPassword
);

// Disable a login (soft delete)
router.delete("/:id", verifyToken, loginManagers, deleteUser);

export default router;
