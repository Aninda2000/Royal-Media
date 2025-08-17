/**
 * Middleware exports for Royal Media Auth Service
 * 
 * © Design and Developed by Aninda Sundar Roy
 */

// Authentication & Authorization
export * from './auth';

// Security & Protection
export * from './security';

// Rate Limiting
export * from './rateLimiter';

// Input Validation
export * from './validation';

// Error Handling
export * from './errorHandler';

// Type definitions for middleware
export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    username?: string;
    role?: string;
    isVerified?: boolean;
    iat?: number;
    exp?: number;
  };
  requestId?: string;
}

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  };
  cors: {
    origins: string[];
    credentials: boolean;
    methods: string[];
  };
  helmet: {
    contentSecurityPolicy: boolean;
    hsts: boolean;
    frameguard: boolean;
  };
}