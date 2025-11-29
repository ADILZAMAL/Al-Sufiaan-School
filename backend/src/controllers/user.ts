import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import School from '../models/School';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { sendError, sendSuccess } from '../utils/response';
import { Op } from 'sequelize';

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

// Get all users (SUPER_ADMIN only)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        {
          model: School,
          as: 'School',
          attributes: ['name', 'sid']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    sendSuccess(res, users, 'Users retrieved successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};

// Get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: School,
          as: 'School',
          attributes: ['name', 'sid']
        }
      ]
    });
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    sendSuccess(res, user, 'User retrieved successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};

// Create new user (SUPER_ADMIN only)
export const createUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { email, password, firstName, lastName, role, schoolId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });
    if (existingUser) {
      return sendError(res, 'User with this email already exists', 400);
    }

    // Verify school exists
    const school = await School.findByPk(schoolId);
    if (!school) {
      return sendError(res, 'Invalid school ID', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 8);
    const user = await User.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      schoolId,
      status: 'ACTIVE'
    });

    // Return user without password
    const userResponse = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: School,
          as: 'School',
          attributes: ['name', 'sid']
        }
      ]
    });

    sendSuccess(res, userResponse, 'User created successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};

// Update user (SUPER_ADMIN or self)
export const updateUser = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const userId = parseInt(req.params.id);
    const currentUser = await User.findByPk(req.userId);
    const { firstName, lastName, email, role, status } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { 
          email,
          id: { [Op.ne]: userId }
        }
      });
      if (existingUser) {
        return sendError(res, 'User with this email already exists', 400);
      }
    }

    // Only super admin can change role and status
    const updateData: any = { firstName, lastName, email };
    if (currentUser?.role === 'SUPER_ADMIN') {
      if (role) updateData.role = role;
      if (status) updateData.status = status;
    }

    await user.update(updateData);

    // Return updated user without password
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: School,
          as: 'School',
          attributes: ['name', 'sid']
        }
      ]
    });

    sendSuccess(res, updatedUser, 'User updated successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};

// Soft delete user (SUPER_ADMIN only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    const currentUserId = parseInt(req.userId as string);

    // Prevent self-deletion
    if (userId === currentUserId) {
      return sendError(res, 'You cannot delete your own account', 400);
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    await user.destroy();
    sendSuccess(res, null, 'User deleted successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};

// Update own profile
export const updateProfile = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array());
  }
  try {
    const { firstName, lastName, email } = req.body;
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: { 
          email,
          id: { [Op.ne]: req.userId }
        }
      });
      if (existingUser) {
        return sendError(res, 'User with this email already exists', 400);
      }
    }

    await user.update({ firstName, lastName, email });

    // Return updated user without password
    const updatedUser = await User.findByPk(req.userId, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: School,
          as: 'School',
          attributes: ['name', 'sid']
        }
      ]
    });

    sendSuccess(res, updatedUser, 'Profile updated successfully');
  } catch (error) {
    console.log(error);
    sendError(res, 'Something went wrong');
  }
};
