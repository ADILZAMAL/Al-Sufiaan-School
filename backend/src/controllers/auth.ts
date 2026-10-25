import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Staff from '../models/Staff';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendError, sendSuccess } from '../utils/response';
import { AUTH_COOKIE_NAME, AUTH_TOKEN_TTL_SECONDS, getAuthCookieOptions } from '../utils/cookieOptions';
import { validatePasswordStrength } from '../utils/passwordValidator';
import { hashPassword } from '../utils/password';
import logger from '../utils/logger';

export const login = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }

  const { mobileNumber, password, client } = req.body;

  try {
    const user = await User.findOne({ where: { mobileNumber } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendError(res, 'Invalid Credentials', 401);
    }

    const staffId = user.staffId ?? null;
    // The mobile app stores its token securely and re-validates it on launch,
    // so it gets a longer session than the web cookie.
    const expiresIn = client === 'mobile' ? (process.env.MOBILE_JWT_EXPIRES_IN || '7d') : AUTH_TOKEN_TTL_SECONDS;
    const token = jwt.sign(
      { userId: user.id, schoolId: user.schoolId, role: user.role, staffId },
      process.env.JWT_SECRET_KEY as string,
      { expiresIn } as jwt.SignOptions
    );

    res.cookie(AUTH_COOKIE_NAME, token, {
      ...getAuthCookieOptions(),
      maxAge: AUTH_TOKEN_TTL_SECONDS * 1000,
    });

    // Independent writes/reads: record last login and fetch the linked staff name in parallel
    const [, staff] = await Promise.all([
      user.update({ lastLogin: new Date() }),
      staffId ? Staff.findByPk(staffId, { attributes: ['name'] }) : Promise.resolve(null),
    ]);
    const staffName = staff?.name ?? null;

    // Token is also returned in the body for mobile apps (which use the Authorization header)
    sendSuccess(res, { userId: user.id, schoolId: user.schoolId, role: user.role, staffId, staffName, token }, 'Login successful');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

// GET /api/auth/validate-token — confirms the account still exists (staff login
// may have been disabled since the token was issued) and returns fresh user info.
export const validateSession = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.userId, { attributes: ['id', 'schoolId', 'role', 'staffId'] });
    if (!user) {
      return sendError(res, 'unauthorized', 401);
    }

    let staffName: string | null = null;
    if (user.staffId) {
      const staff = await Staff.findByPk(user.staffId, { attributes: ['name'] });
      staffName = staff?.name ?? null;
    }

    sendSuccess(res, { userId: user.id, schoolId: user.schoolId, role: user.role, staffId: user.staffId ?? null, staffName }, 'Token validated');
  } catch (error) {
    logger.error('Something went wrong', { error });
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

    await user.update({ password: await hashPassword(newPassword) });

    return sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    return sendError(res, 'Something went wrong');
  }
};
