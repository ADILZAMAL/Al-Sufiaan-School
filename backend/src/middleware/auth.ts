import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

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
  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string);
    req.userId = (decoded as JwtPayload).userId;
    req.schoolId = (decoded as JwtPayload).schoolId;
    req.userRole = (decoded as JwtPayload).role;
    next();
  } catch (error) {
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
