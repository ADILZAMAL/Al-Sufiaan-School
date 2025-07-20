import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import School from '../models/School';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { sendError, sendSuccess } from '../utils/response';

export const registerNewUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const school = await School.findOne({
      where: {
        sid: req.body.sid,
      },
    });
    if (!school) {
      return sendError(res, 'Invalid Sid', 400);
    }
    let user = await User.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (user) {
      return sendError(res, 'User already exists', 400);
    }
    user = await User.create({
      ...req.body,
      schoolId: school.id,
      password: await bcrypt.hash(req.body.password, 8),
    });
    sendSuccess(res, user, 'User registered successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};

export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
}

export const changePassword = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findByPk(req.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', 400);
    }
    if (oldPassword === newPassword) {
      return sendError(res, 'New password cannot be the same as the old password', 400);
    }
    user.password = await bcrypt.hash(newPassword, 8);
    await user.save();
    sendSuccess(res, null, 'Password changed successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
}
