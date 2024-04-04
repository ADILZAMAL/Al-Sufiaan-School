import express,{} from 'express';
import {check} from 'express-validator'
import { login } from '../controllers/auth';

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

export default router