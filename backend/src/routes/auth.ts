import express from 'express';
import { check } from 'express-validator';
import { login } from '../controllers/auth';
import { Request, Response } from 'express';
import verifyToken from '../middleware/auth';
import { sendSuccess } from '../utils/response';

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
    sendSuccess(res, { userId: req.userId, schoolId: req.schoolId, role: req.userRole }, 'Token validated');
});

router.post("/logout", (req: Request, res: Response) => {
    res.cookie("auth_token", "", {
        expires: new Date(0),
    });
    sendSuccess(res, {}, 'Signed out');
});

export default router
