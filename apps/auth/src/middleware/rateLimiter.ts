export { 
  generalRateLimit as rateLimiter,
  generalRateLimit as rateLimitMiddleware,
  authRateLimit,
  passwordResetRateLimit,
  createAdvancedRateLimit,
  createUserRateLimit 
} from './rateLimit';