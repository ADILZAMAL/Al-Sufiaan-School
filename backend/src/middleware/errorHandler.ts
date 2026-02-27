import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { sendError } from '../utils/response';
import logger from '../utils/logger';

// 4-argument signature is required for Express to recognize this as an error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
    const requestId = res.locals.requestId;

    // If headers already sent, delegate to Express default handler
    if (res.headersSent) {
        return next(err);
    }

    let statusCode: number = err.status || err.statusCode || 500;
    let message = 'Internal server error';

    // Multer file upload errors (size, type, etc.)
    if (err instanceof MulterError) {
        statusCode = 400;
        message = err.code === 'LIMIT_FILE_SIZE'
            ? 'File too large. Maximum size is 5MB.'
            : err.message;
    }
    // Sequelize validation / unique constraint errors
    else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 400;
        message = err.errors?.[0]?.message || 'Validation error';
    }
    // JWT errors
    else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Invalid or expired token';
    }
    // Generic errors with a message
    else if (err.message) {
        message = statusCode < 500 ? err.message : 'Internal server error';
    }

    const logMeta: Record<string, any> = {
        requestId,
        method: req.method,
        url: req.url,
        statusCode,
        errorName: err.name,
    };

    if (statusCode >= 500) {
        logMeta.stack = err.stack;
        logger.error(`Unhandled error: ${err.message}`, logMeta);
    } else {
        logger.warn(`Client error: ${err.message}`, logMeta);
    }

    sendError(res, message, statusCode);
};
