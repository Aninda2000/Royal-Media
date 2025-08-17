import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyAccessToken, createError } from '../utils/auth-utils';
import { createLogger } from '../utils/logger';
import { User, IUser } from '../models/User';
import { AuthenticatedRequest, JWTUser } from '../types/auth';

const logger = createLogger('auth-service');

// JWT Token verification middleware
export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', code: 'MISSING_TOKEN' });
    }

    try {
      const decoded = await verifyAccessToken(token);
      
      // Fetch user from database to ensure they still exist and are active
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized', code: 'USER_NOT_FOUND' });
      }

      if (!user.isActive) {
        return res.status(401).json({ error: 'Unauthorized', code: 'USER_INACTIVE' });
      }

      // Attach user to request
      req.user = {
        userId: user._id.toString(),
        email: user.email,
        username: user.username,
        role: user.role,
        isVerified: user.isVerified
      };

      next();
    } catch (tokenError) {
      logger.error('Token verification failed:', tokenError);
      return res.status(401).json({ error: 'Unauthorized', code: 'INVALID_TOKEN' });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ error: 'Internal server error', code: 'AUTH_MIDDLEWARE_ERROR' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
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
        const decoded = await verifyAccessToken(token);
        
        // Fetch user from database
        const user = await User.findById(decoded.userId).select('-password -refreshTokens');
        
        if (user && user.isActive) {
          req.user = {
            userId: user._id.toString(),
            email: user.email,
            username: user.username,
            role: user.role,
            isVerified: user.isVerified
          };
        }
      } catch (tokenError) {
        // Silently fail for optional auth
        logger.debug('Optional auth token verification failed:', tokenError);
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth middleware error:', error);
    next(); // Continue without authentication
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized', code: 'MISSING_AUTH' });
    }

    if (!roles.includes(req.user.role || '')) {
      return res.status(403).json({ error: 'Forbidden', code: 'INSUFFICIENT_PERMISSIONS' });
    }

    next();
  };
};

// Admin-only middleware
export const requireAdmin = authorize('admin', 'super_admin');

// Moderator middleware (admin and moderator)
export const requireModerator = authorize('moderator', 'admin', 'super_admin');

// Verified user middleware
export const requireVerified = (req: AuthenticatedRequest, res: Response, next: NextFunction): Response | void => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'MISSING_AUTH' });
  }

  if (!req.user.isVerified) {
    return res.status(403).json({ error: 'Forbidden', code: 'EMAIL_NOT_VERIFIED' });
  }

  next();
};

// Active user middleware
export const requireActive = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', code: 'MISSING_AUTH' });
  }

  try {
    const user = await User.findById(req.user.userId);
    
    if (!user || !user.isActive) {
      return res.status(403).json({ error: 'Forbidden', code: 'USER_INACTIVE' });
    }

    next();
  } catch (error) {
    logger.error('Active user check failed:', error);
    return res.status(500).json({ error: 'Internal server error', code: 'USER_CHECK_ERROR' });
  }
};

export { AuthenticatedRequest, JWTUser } from '../types/auth';