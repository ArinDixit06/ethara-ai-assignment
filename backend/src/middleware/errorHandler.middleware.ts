import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import multer from 'multer';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errors = err.errors || undefined;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  } else if (err.code === 'P2002') {
    statusCode = 409;
    const target = (err.meta?.target as string[])?.join(', ') || 'fields';
    message = `Duplicate value for field: ${target}`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Record not found';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid or expired token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message || message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // Log error with Winston
  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.url} - 500 Internal Server Error: ${err.stack || err.message || err}`);
  } else {
    logger.warn(`${req.method} ${req.url} - Client Error (${statusCode}): ${message}`);
  }

  const responseBody: { success: boolean; message: string; errors?: any; stack?: string } = {
    success: false,
    message,
  };

  if (errors) {
    responseBody.errors = errors;
  }

  if (env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test') {
    responseBody.stack = err.stack;
  }

  return res.status(statusCode).json(responseBody);
};

export default errorHandler;
