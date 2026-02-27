import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import logger from '../utils/logger';
import User from '../models/User';

// Middleware to check if user is SUPER_ADMIN
export const requireSuperAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    
    if (user.role !== 'SUPER_ADMIN') {
      return sendError(res, 'Access denied. Super admin privileges required.', 403);
    }
    
    next();
  } catch (error) {
    logger.error('requireSuperAdmin check failed', {
      requestId: res.locals.requestId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    sendError(res, 'Something went wrong');
  }
};

// Middleware to check if user can modify the target user (self or super admin)
export const canModifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const currentUser = await User.findByPk(req.userId);
    if (!currentUser) {
      return sendError(res, 'User not found', 404);
    }
    
    const targetUserId = parseInt(req.params.id);
    
    // Super admin can modify anyone
    if (currentUser.role === 'SUPER_ADMIN') {
      return next();
    }
    
    // Users can only modify themselves
    if (currentUser.id === targetUserId) {
      return next();
    }
    
    return sendError(res, 'Access denied. You can only modify your own profile.', 403);
  } catch (error) {
    logger.error('canModifyUser check failed', {
      requestId: res.locals.requestId,
      error: (error as Error).message,
      stack: (error as Error).stack,
    });
    sendError(res, 'Something went wrong');
  }
};
