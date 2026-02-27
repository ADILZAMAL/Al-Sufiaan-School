import express from 'express';
import { check } from 'express-validator';
import { login, changePassword } from '../controllers/auth';
import { Request, Response } from 'express';
import verifyToken from '../middleware/auth';
import { sendSuccess } from '../utils/response';
import { getAuthCookieClearOptions } from '../utils/cookieOptions';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           minLength: 6
 *           description: User password
 *     LoginResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *             schoolId:
 *               type: string
 *             role:
 *               type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */
router.post(
    "/login",
    [
        check("email").optional().isEmail().withMessage("Invalid email format"),
        check("mobileNumber").optional().notEmpty().withMessage("Mobile number is required"),
        check("password", "Password is required").isLength({ min: 8 }),
    ],
    login
)

/**
 * @swagger
 * /api/auth/validate-token:
 *   get:
 *     summary: Validate JWT token and get user info
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid or expired token
 */
router.get("/validate-token", verifyToken, (req: Request, res: Response) => {
    sendSuccess(res, { userId: req.userId, schoolId: req.schoolId, role: req.userRole }, 'Token validated');
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and clear cookie
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
router.post("/logout", (req: Request, res: Response) => {
    // Use the same cookie options as login to ensure proper clearing in cross-site scenarios
    const cookieOptions = getAuthCookieClearOptions();
    res.cookie("auth_token", "", cookieOptions);
    sendSuccess(res, {}, 'Signed out');
});

// PUT /api/auth/change-password — Authenticated staff/user changes their own password
router.put("/change-password", verifyToken, changePassword);

export default router
