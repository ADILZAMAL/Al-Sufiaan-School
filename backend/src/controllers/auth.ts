import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendError, sendSuccess } from '../utils/response';

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({
      where: {
        email,
      },
    });
    if (!user) {
      return sendError(res, 'Invalid Credentials', 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid Credentials', 400);
    }

    const token = jwt.sign(
      { userId: user.id, schoolId: user.schoolId },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: '1d',
      }
    );

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 86400000,
    });

    sendSuccess(res, { userId: user.id, schoolId: user.schoolId }, 'Login successful');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};
