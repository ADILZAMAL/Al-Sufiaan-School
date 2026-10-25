import { Response } from 'express';
import { sendError } from './response';
import logger from './logger';

/**
 * An error that carries an HTTP status. Throw it from helpers (e.g. permission
 * checks) and let the controller's catch block turn it into a response via
 * `handleError`, or let `globalErrorHandler` do it for uncaught throws.
 */
export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: Record<string, unknown>) {
    super(message);
    this.name = 'HttpError';
  }
}

export const handleError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof HttpError) {
    return sendError(res, error.message, error.status, error.details);
  }
  logger.error(fallbackMessage, { error });
  return sendError(res, fallbackMessage, 500);
};
