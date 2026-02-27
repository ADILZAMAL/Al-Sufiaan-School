import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import logger from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      userId: string;
      schoolId: string;
      userRole: 'SUPER_ADMIN' | 'ADMIN' | 'CASHIER';
    }
  }
}

const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  // Check for token in cookies (web) or Authorization header (mobile)
  let token = req.cookies["auth_token"];
  
  // If no cookie token, check Authorization header (for mobile apps)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  if (!token) {
    logger.warn('No token found in cookies or Authorization header', {
      requestId: res.locals.requestId,
      method: req.method,
      url: req.url,
    });
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    req.userId = (decoded as JwtPayload).userId;
    req.schoolId = (decoded as JwtPayload).schoolId;
    req.userRole = (decoded as JwtPayload).role;
    next();
  } catch (error) {
    logger.warn('Token verification failed', {
      requestId: res.locals.requestId,
      error: (error as Error).message,
    });
    return res.status(401).json({ message: "unauthorized" });
  }
};

export const requireRole = (allowedRoles: ('SUPER_ADMIN' | 'ADMIN' | 'CASHIER')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      return res.status(401).json({ 
        success: false, 
        error: { code: 'UNAUTHORIZED', message: 'User role not found' } 
      });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false, 
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } 
      });
    }

    next();
  };
};

export default verifyToken;
