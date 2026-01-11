import express, { Router, Request, Response } from 'express';
import { getSchoolById, getAllSchools, onboardSchool, updateSchool, getCurrentSchool } from '../controllers/school';
import { check, body } from 'express-validator'
const router: Router = express.Router()

router.get("/", getAllSchools)
router.get("/current", getCurrentSchool)
router.get("/:id",getSchoolById)

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
    body('hostelFee').optional().isFloat({ gt: 0 }).withMessage('Hostel fee must be a positive number'),
    body('admissionFee').optional().isFloat({ gt: 0 }).withMessage('Admission fee must be a positive number')
], updateSchool);

router.post("/onboard", [
    check("name", "School Name is required").isString(),
    check("street", "Street is required").isString(),
    check("city", "City is required").isString(),
    check("district", "District is required").isString(),
    check("state", "State is required").isString(),
    check("pincode", "PinCode is required").isString(),
    check("mobile", "Mobile is required").isString(),
    check("udiceCode", "Udice Code is required").isString(),
    check("email", "Email is required").isEmail(),
    check("sid", "SId with 3 or more character is required").isLength({min: 3})
], onboardSchool);

export default router
