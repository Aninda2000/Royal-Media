import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { redisClient } from '../config/database';
import { env } from '../config/env';
import { createError } from '../utils/auth-utils';
import { createLogger } from '../utils/common';

const logger = createLogger('auth-service');

// General rate limiting
export const generalRateLimit = rateLimit({
  windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS), // 15 minutes
  max: parseInt(env.RATE_LIMIT_MAX_REQUESTS), // 100 requests per window
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiting for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limiting
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    success: false,
    error: 'Too many password reset requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Advanced rate limiting with Redis
export const createAdvancedRateLimit = (
  key: string,
  maxRequests: number,
  windowMs: number
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const identifier = req.ip || req.connection.remoteAddress || 'unknown';
      const rateLimitKey = `rate_limit:${key}:${identifier}`;
      
      const current = await redisClient.incr(rateLimitKey);
      
      if (current === 1) {
        await redisClient.expire(rateLimitKey, Math.ceil(windowMs / 1000));
      }
      
      const ttl = await redisClient.ttl(rateLimitKey);
      
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current).toString(),
        'X-RateLimit-Reset': (Date.now() + ttl * 1000).toString(),
      });
      
      if (current > maxRequests) {
        logger.warn('Rate limit exceeded', {
          key,
          identifier,
          current,
          maxRequests,
          path: req.path,
        });
        
        return next(
          createError(
            'Too many requests, please try again later.',
            429,
            'RATE_LIMIT_EXCEEDED'
          )
        );
      }
      
      next();
    } catch (error) {
      logger.error('Rate limiting error:', error);
      // Continue on rate limiting errors to avoid blocking requests
      next();
    }
  };
};

// User-specific rate limiting
export const createUserRateLimit = (
  action: string,
  maxRequests: number,
  windowMs: number
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(); // Skip rate limiting if user is not authenticated
      }
      
      const rateLimitKey = `rate_limit:${action}:user:${userId}`;
      
      const current = await redisClient.incr(rateLimitKey);
      
      if (current === 1) {
        await redisClient.expire(rateLimitKey, Math.ceil(windowMs / 1000));
      }
      
      const ttl = await redisClient.ttl(rateLimitKey);
      
      res.set({
        'X-RateLimit-Limit': maxRequests.toString(),
        'X-RateLimit-Remaining': Math.max(0, maxRequests - current).toString(),
        'X-RateLimit-Reset': (Date.now() + ttl * 1000).toString(),
      });
      
      if (current > maxRequests) {
        logger.warn('User rate limit exceeded', {
          action,
          userId,
          current,
          maxRequests,
          path: req.path,
        });
        
        return next(
          createError(
            `Too many ${action} requests, please try again later.`,
            429,
            'USER_RATE_LIMIT_EXCEEDED'
          )
        );
      }
      
      next();
    } catch (error) {
      logger.error('User rate limiting error:', error);
      // Continue on rate limiting errors
      next();
    }
  };
};