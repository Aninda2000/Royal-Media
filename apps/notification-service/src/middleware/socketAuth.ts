import { Socket } from 'socket.io'
import { ExtendedError } from 'socket.io/dist/namespace'
import { verifyToken, JWTPayload } from '../utils/auth'
import { logger } from '../utils/logger'

export interface AuthenticatedSocket extends Socket {
  user?: JWTPayload
}

export const authenticateSocket = (socket: Socket, next: (err?: ExtendedError) => void): void => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1]

    if (!token) {
      return next(new Error('Authentication token is required'))
    }

    const payload = verifyToken(token)
    ;(socket as AuthenticatedSocket).user = payload
    
    logger.info(`Socket authenticated for user: ${payload.userId}`)
    next()
  } catch (error) {
    logger.error('Socket authentication failed:', error)
    next(new Error('Authentication failed'))
  }
}