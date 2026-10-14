import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isDev = env.NODE_ENV === 'development';

  // Never expose stack traces in production
  const message = statusCode < 500
    ? err.message
    : isDev
    ? err.message
    : 'Internal server error.';

  res.status(statusCode).json({
    data: null,
    error: message,
    ...(isDev && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}

export function notFound(req: Request, res: Response): void {
  res.status(404).json({ data: null, error: `Route ${req.method} ${req.path} not found.` });
}

/** Convenience: create a typed error with a status code */
export function createError(message: string, statusCode: number): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}
