import {Request, Response} from 'express';
import {validationResult} from 'express-validator'
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() });
    }
    const {email, password} = req.body
    try {
        const user = await User.findOne({
            where: {
                email
            }
        });
        if(!user){
            return res.status(400).json({message: "Invalid Credentials"});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({message: "Invalid Credentials"});
        }

        const token = jwt.sign(
            {userId: user.id, schoolId: user.schoolId},
            process.env.JWT_SECRET_KEY as string,
            {
                expiresIn: '1d'
            }

        )
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 86400000,
        })
        res.status(200).json({userId: user.id, schoolId: user.schoolId})
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Something went wrong"})
    }
}