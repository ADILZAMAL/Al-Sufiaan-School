import express, { Router, Request, Response } from 'express';
import { getSchoolById, onboardSchool } from '../controllers/school';
import { check } from 'express-validator'
const router: Router = express.Router()

router.get("/:id",getSchoolById)

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