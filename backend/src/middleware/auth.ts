import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from '../utils/logger';
import { sendError } from '../utils/response';
import { AUTH_COOKIE_NAME } from '../utils/cookieOptions';
import User, { type UserRole } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      schoolId: string;
      userRole: UserRole;
      /** Linked staff record for TEACHER (and other staff) logins; null for plain users. */
      staffId: number | null;
    }
  }
}

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  // Cookie for web, Authorization: Bearer header for mobile
  const authHeader = req.headers.authorization;
  const token: string | undefined =
    req.cookies[AUTH_COOKIE_NAME] ||
    (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined);

  if (!token) {
    logger.warn('No token found in cookies or Authorization header', {
      requestId: res.locals.requestId,
      method: req.method,
      url: req.url,
    });
    return sendError(res, 'unauthorized', 401);
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload;
  } catch (error) {
    logger.warn('Token verification failed', {
      requestId: res.locals.requestId,
      error: (error as Error).message,
    });
    return sendError(res, 'unauthorized', 401);
  }

  // The token outlives account changes, so the role comes from the DB: a disabled login or a changed role applies
  // on the next request. A DB failure must stay a 500 — clients sign out on 401 (mobile also drops unsynced drafts).
  // Errors are handled here because canUpdateSchool (routes/school.ts) calls this directly.
  let user: User | null;
  try {
    user = await User.findByPk(decoded.userId, { attributes: ['id', 'role', 'staffId'] });
  } catch (error) {
    logger.error('Session lookup failed', {
      requestId: res.locals.requestId,
      error: (error as Error).message,
    });
    return sendError(res, 'Something went wrong');
  }
  if (!user) {
    logger.warn('Token for a disabled or deleted login', { requestId: res.locals.requestId, userId: decoded.userId });
    return sendError(res, 'unauthorized', 401);
  }

  req.userId = decoded.userId;
  req.schoolId = decoded.schoolId;
  req.userRole = user.role;
  req.staffId = user.staffId ?? null;
  next();
};

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return sendError(res, 'User role not found', 401, { code: 'UNAUTHORIZED' });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return sendError(res, 'Insufficient permissions', 403, { code: 'FORBIDDEN' });
    }

    next();
  };
};

/** Inverse of requireRole: blocks only the listed roles, everyone else passes. */
export const denyRoles = (deniedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (deniedRoles.includes(req.userRole)) {
      return sendError(res, 'Insufficient permissions', 403, { code: 'FORBIDDEN' });
    }
    next();
  };
};

export const verifyOnboardToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return sendError(res, 'Onboard token required', 401);
  try {
    jwt.verify(token, process.env.ONBOARD_JWT_SECRET as string);
    next();
  } catch {
    return sendError(res, 'Invalid or expired onboard token', 403);
  }
};

export default verifyToken;
