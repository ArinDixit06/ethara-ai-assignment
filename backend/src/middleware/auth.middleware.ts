import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { Role } from '@prisma/client';

// In-memory blacklist for simple token invalidation on logout
export const tokenBlacklist = new Set<string>();

export interface TokenPayload {
  id: string;
  email: string;
  role: Role;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return next(new ApiError(401, 'No token provided'));
  }

  if (tokenBlacklist.has(token)) {
    return next(new ApiError(401, 'Token is blacklisted (logged out)'));
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (err) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
};
