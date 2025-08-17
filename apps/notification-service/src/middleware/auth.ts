import { Request, Response, NextFunction } from 'express'
import { verifyToken, JWTPayload } from '../utils/auth'
import { logger } from '../utils/logger'

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'MISSING_TOKEN',
        message: 'Access token is required',
      },
    })
    return
  }

  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch (error) {
    logger.error('Token verification failed:', error)
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token',
      },
    })
  }
}