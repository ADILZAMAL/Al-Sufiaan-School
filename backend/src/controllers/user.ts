import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User from '../models/User';
import Staff from '../models/Staff';
import { sendError, sendSuccess } from '../utils/response';
import { handleError } from '../utils/httpError';
import { Actor, createLogin, disableLogin, resetLoginPassword, updateLogin } from '../utils/loginAccounts';
import logger from '../utils/logger';

// Logins are managed through utils/loginAccounts; these handlers only translate HTTP <-> engine calls.

const actorOf = (req: Request): Actor => ({ id: Number(req.userId), role: req.userRole });

/** Sends the first validator message (shown as-is in the UI). Returns true when the request was rejected. */
const rejectInvalid = (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  sendError(res, errors.array()[0].msg, 400, { errors: errors.array() });
  return true;
};

const LOGIN_INCLUDE = [{ model: Staff, as: 'staff', attributes: ['id', 'name', 'mobileNumber'], required: false }];

const findSafeLogin = (id: number) =>
  User.findByPk(id, { attributes: { exclude: ['password'] }, include: LOGIN_INCLUDE });

// Get every active login (SUPER_ADMIN only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      where: { schoolId: req.schoolId },
      attributes: { exclude: ['password'] },
      include: LOGIN_INCLUDE,
      order: [['createdAt', 'DESC']],
    });
    sendSuccess(res, users, 'Users retrieved successfully');
  } catch (error) {
    logger.error('Something went wrong', { error });
    sendError(res, 'Something went wrong');
  }
};

// Create a login: linked to a staff member (staffId) or a non-staff office account
export const createUser = async (req: Request, res: Response) => {
  if (rejectInvalid(req, res)) return;
  try {
    const { staffId, role, password, firstName, lastName, mobileNumber, email } = req.body;
    const user = await createLogin(actorOf(req), Number(req.schoolId), {
      staffId, role, password, firstName, lastName, mobileNumber, email,
    });
    sendSuccess(res, await findSafeLogin(user.id), 'Login created successfully', 201);
  } catch (error) {
    handleError(res, error, 'Failed to create login');
  }
};

export const updateUser = async (req: Request, res: Response) => {
  if (rejectInvalid(req, res)) return;
  try {
    const userId = Number(req.params.id);
    const { role, firstName, lastName, mobileNumber, email } = req.body;
    await updateLogin(actorOf(req), userId, { role, firstName, lastName, mobileNumber, email });
    sendSuccess(res, await findSafeLogin(userId), 'Login updated successfully');
  } catch (error) {
    handleError(res, error, 'Failed to update login');
  }
};

export const resetUserPassword = async (req: Request, res: Response) => {
  if (rejectInvalid(req, res)) return;
  try {
    await resetLoginPassword(actorOf(req), Number(req.params.id), req.body.password);
    sendSuccess(res, null, 'Password reset successfully');
  } catch (error) {
    handleError(res, error, 'Failed to reset password');
  }
};

// Disable = soft delete; history stays linked and a staff login can be enabled again from the staff profile
export const deleteUser = async (req: Request, res: Response) => {
  try {
    await disableLogin(actorOf(req), Number(req.params.id));
    sendSuccess(res, null, 'Login disabled successfully');
  } catch (error) {
    handleError(res, error, 'Failed to disable login');
  }
};
