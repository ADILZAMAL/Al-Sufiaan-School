import express, { } from 'express';
import { check } from 'express-validator'
import { login } from '../controllers/auth';
import { Request, Response } from 'express'
import verifyToken from '../middleware/auth'

const router = express.Router();

router.post(
    "/login",
    [
        check("email", "Email is required").isEmail(),
        check("password", "Password is required").isLength({
            min: 6,
        })
    ],
    login
)

router.get("/validate-token", verifyToken, (req: Request, res: Response) => {
    res.status(200).send({ userId: req.userId, schoolId: req.schoolId })
}
)

export default router