import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AuthPayload {
  studentId: string;
  email: string;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ data: null, error: 'Authorization header missing or malformed.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ data: null, error: 'Access token expired.' });
    } else {
      res.status(401).json({ data: null, error: 'Invalid access token.' });
    }
  }
}

/**
 * Cross-student guard: verifies the studentId in the route param (if present)
 * matches the authenticated user. Prevents cross-student data access.
 */
export function scopeToStudent(req: Request, res: Response, next: NextFunction): void {
  const paramId = req.params.studentId;
  if (paramId && req.user && paramId !== req.user.studentId) {
    res.status(403).json({ data: null, error: 'Access denied.' });
    return;
  }
  next();
}
