import express, {Request, Response} from 'express';
import {check} from 'express-validator';
import {registerNewUser} from '../controllers/user';
const router = express.Router();

router.post(
    "/register",
    [
        check('firstName', 'First Name is required').isString(),
        check('lastName', 'Last Name is required').isString(),
        check('email', 'Email is required').isEmail(),
        check('sid', 'Sid is required').isLength({
            min: 3
        }),
        check('password', 'Password with 6 or more character is required').isLength({
            min: 6
        })
    ],
    registerNewUser
    )

export default router;