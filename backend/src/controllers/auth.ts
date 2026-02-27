import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Staff from '../models/Staff';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendError, sendSuccess } from '../utils/response';
import { getAuthCookieOptions } from '../utils/cookieOptions';
import { validatePasswordStrength } from '../utils/passwordValidator';

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  const { email, mobileNumber, password } = req.body;

  if (!email && !mobileNumber) {
    return sendError(res, 'Email or mobile number is required', 400);
  }

  try {
    const user = await User.findOne({
      where: email ? { email } : { mobileNumber },
    });
    if (!user) {
      return sendError(res, 'Invalid Credentials', 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid Credentials', 400);
    }

    const token = jwt.sign(
      { userId: user.id, schoolId: user.schoolId, role: user.role, staffId: user.staffId ?? null },
      process.env.JWT_SECRET_KEY as string,
      {
        expiresIn: '1d',
      }
    );

    const cookieOptions = {
      ...getAuthCookieOptions(),
      maxAge: 86400000, // 1 day in milliseconds
    };
    res.cookie('auth_token', token, cookieOptions);

    // Update last login timestamp
    await user.update({ lastLogin: new Date() });

    // Fetch staff name for TEACHER users
    let staffName: string | null = null;
    if (user.staffId) {
      const staff = await Staff.findByPk(user.staffId, { attributes: ['name'] });
      staffName = staff?.name ?? null;
    }

    // Also return token in response body for mobile apps
    sendSuccess(res, { userId: user.id, schoolId: user.schoolId, role: user.role, staffId: user.staffId ?? null, staffName, token }, 'Login successful');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return sendError(res, 'Current password and new password are required', 400);
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return sendError(res, passwordError, 400);
  }

  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    if (currentPassword === newPassword) {
      return sendError(res, 'New password must be different from current password', 400);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.log(error);
    return sendError(res, 'Something went wrong');
  }
};
