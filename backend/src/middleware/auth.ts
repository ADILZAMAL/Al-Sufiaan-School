import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from '../utils/logger';
import { sendError } from '../utils/response';
import { AUTH_COOKIE_NAME } from '../utils/cookieOptions';
import type { UserRole } from '../models/User';

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

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
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

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as JwtPayload;
    req.userId = decoded.userId;
    req.schoolId = decoded.schoolId;
    req.userRole = decoded.role;
    req.staffId = decoded.staffId ?? null;
    next();
  } catch (error) {
    logger.warn('Token verification failed', {
      requestId: res.locals.requestId,
      error: (error as Error).message,
    });
    return sendError(res, 'unauthorized', 401);
  }
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
