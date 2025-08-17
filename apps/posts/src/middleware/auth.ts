import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { createError } from '../utils/common';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return next(createError('Access token is required', 401, 'MISSING_TOKEN'));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
      req.user = payload;
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.TokenExpiredError) {
        return next(createError('Token has expired', 401, 'TOKEN_EXPIRED'));
      } else if (jwtError instanceof jwt.JsonWebTokenError) {
        return next(createError('Invalid token', 401, 'INVALID_TOKEN'));
      } else {
        return next(createError('Token verification failed', 401, 'TOKEN_VERIFICATION_FAILED'));
      }
    }
  } catch (error) {
    next(createError('Authentication failed', 500, 'AUTH_ERROR'));
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;
        req.user = payload;
      } catch (jwtError) {
        // For optional auth, we don't throw errors for invalid tokens
        // Just proceed without user context
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors
    next();
  }
};