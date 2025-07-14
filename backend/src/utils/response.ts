import { Response } from 'express';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    [key: string]: any;
  };
}

export const sendSuccess = <T>(res: Response, data: T, message = 'Success', statusCode = 200) => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
};

export const sendError = (res: Response, errorMessage: string, statusCode = 500, errorDetails?: any) => {
  const response: ApiResponse<null> = {
    success: false,
    message: errorMessage,
    error: {
      message: errorMessage,
      ...errorDetails,
    },
  };
  res.status(statusCode).json(response);
};
