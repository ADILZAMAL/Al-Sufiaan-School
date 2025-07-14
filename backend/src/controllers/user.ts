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
