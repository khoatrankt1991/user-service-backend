import { Request, Response, NextFunction } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export const createSuccessResponse = <T>(
  data?: T,
  message: string = 'Success',
  meta?: Record<string, unknown>
): ApiResponse<T> => ({
  success: true,
  message,
  data,
  meta,
  timestamp: new Date().toISOString()
});

export const createErrorResponse = (
  message: string,
  code: string = 'INTERNAL_ERROR',
  details?: unknown
): ApiError => ({
  success: false,
  error: {
    code,
    message,
    details
  },
  timestamp: new Date().toISOString()
});

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  // Default to 500 server error
  let statusCode = 500;
  let errorCode = 'INTERNAL_ERROR';
  let message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  // Handle specific error types
  if (err.message.includes('already exists') || err.message.includes('already registered')) {
    statusCode = 409;
    errorCode = 'CONFLICT';
  } else if (err.message.includes('not found')) {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  } else if (err.message.includes('Invalid') || err.message.includes('required')) {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.message.includes('Unauthorized') || err.message.includes('Invalid email or password')) {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  } else if (err.message.includes('cannot') || err.message.includes('not allowed') || err.message.includes('admin')) {
    statusCode = 403;
    errorCode = 'FORBIDDEN';
  }

  res.status(statusCode).json(createErrorResponse(message, errorCode));
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json(
    createErrorResponse(`Route ${req.method} ${req.path} not found`, 'NOT_FOUND')
  );
};
