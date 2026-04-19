import express, { Router, Request, Response } from 'express';
import { getSchoolById, getAllSchools, onboardSchool, updateSchool, getCurrentSchool, createSuperAdmin, getSchoolSuperAdmin, getLogoBase64 } from '../controllers/school';
import { check, body } from 'express-validator';
import { sendError } from '../utils/response';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import verifyToken, { verifyOnboardToken } from '../middleware/auth';

const router: Router = express.Router();

router.get("/", getAllSchools)
router.get("/current", verifyToken, getCurrentSchool)
router.get("/logo-base64", verifyToken, getLogoBase64)
router.get("/:id", getSchoolById)
router.get("/:id/super-admin", getSchoolSuperAdmin)

router.post("/verify-onboard", (req: Request, res: Response) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ONBOARD_USERNAME ?? '';
  const expectedPass = process.env.ONBOARD_PASSWORD ?? '';

  const usernameMatch =
    username?.length === expectedUser.length &&
    crypto.timingSafeEqual(Buffer.from(username) as NodeJS.ArrayBufferView, Buffer.from(expectedUser) as NodeJS.ArrayBufferView);
  const passwordMatch =
    password?.length === expectedPass.length &&
    crypto.timingSafeEqual(Buffer.from(password) as NodeJS.ArrayBufferView, Buffer.from(expectedPass) as NodeJS.ArrayBufferView);

  if (!usernameMatch || !passwordMatch) {
    return sendError(res, 'Invalid credentials', 403);
  }

  const token = jwt.sign(
    { onboard: true },
    process.env.ONBOARD_JWT_SECRET as string,
    { expiresIn: '1h' }
  );
  return res.json({ success: true, data: { token }, message: 'Credentials verified' });
});

router.put("/:id", [
    check("name", "School Name is required").optional().isString(),
    check("street", "Street is required").optional().isString(),
    check("city", "City is required").optional().isString(),
    check("district", "District is required").optional().isString(),
    check("state", "State is required").optional().isString(),
    check("pincode", "PinCode is required").optional().isString(),
    check("mobile", "Mobile is required").optional().isString(),
    check("udiceCode", "Udice Code is required").optional().isString(),
    check("email", "Email is required").optional().isEmail(),
    check("sid", "SId with 3 or more character is required").optional().isLength({min: 3}),
    check("active", "Active status is required").optional().isBoolean(),
    body('paymentModes').optional().isArray().withMessage('Payment modes must be an array'),
    body('paymentModes').optional().notEmpty().withMessage('Payment modes cannot be empty'),
    body('paymentModes.*').optional().isString().withMessage('Each payment mode must be a string'),
    body('logoUrl').optional({ nullable: true }).isURL().withMessage('Logo URL must be a valid URL'),
], updateSchool);

router.post("/create-super-admin", verifyOnboardToken, [
    check("firstName", "First name is required").isString(),
    check("lastName", "Last name is required").isString(),
    check("mobileNumber", "Valid 10-digit mobile number is required").matches(/^\d{10}$/),
    check("adminPassword", "Password must be at least 6 characters").isLength({ min: 6 }),
    check("schoolId", "School ID is required").isInt(),
], createSuperAdmin);

router.post("/onboard", verifyOnboardToken, [
    check("name", "School Name is required").isString(),
    check("street", "Street is required").isString(),
    check("city", "City is required").isString(),
    check("district", "District is required").isString(),
    check("state", "State is required").isString(),
    check("pincode", "PinCode is required").isString(),
    check("mobile", "Mobile is required").isString(),
    check("udiceCode", "Udice Code is required").isString(),
    check("email", "Email is required").isEmail(),
    check("sid", "SId with 3 or more character is required").isLength({min: 3}),
    body('logoUrl').optional({ nullable: true }).isURL().withMessage('Logo URL must be a valid URL'),
], onboardSchool);

export default router;
