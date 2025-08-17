import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { createAdapter } from '@socket.io/redis-adapter'
import { authenticateSocket, AuthenticatedSocket } from '../middleware/socketAuth'
import { pubClient, subClient } from '../config/redis'
import { logger } from '../utils/logger'
import { TypingIndicator } from '../models/TypingIndicator'
import { messageService } from './messageService'
import { conversationService } from './conversationService'
import {
  joinConversationSchema,
  leaveConversationSchema,
  typingSchema,
  markAsReadSchema,
  createMessageSchema,
} from '../schemas/validation'

export class SocketService {
  private io: SocketIOServer
  private connectedUsers: Map<string, Set<string>> = new Map() // userId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    })

    this.setupRedisAdapter()
    this.setupMiddleware()
    this.setupEventHandlers()
  }

  private async setupRedisAdapter(): Promise<void> {
    try {
      await pubClient.connect()
      await subClient.connect()
      
      this.io.adapter(createAdapter(pubClient, subClient))
      logger.info('Socket.IO Redis adapter configured')
    } catch (error) {
      logger.error('Failed to setup Redis adapter:', error)
    }
  }

  private setupMiddleware(): void {
    this.io.use(authenticateSocket)
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.user?.userId
      if (!userId) {
        socket.disconnect()
        return
      }

      logger.info(`User ${userId} connected with socket ${socket.id}`)
      
      // Track connected user
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set())
      }
      this.connectedUsers.get(userId)!.add(socket.id)

      // Join user to their personal room
      socket.join(`user:${userId}`)

      // Handle joining conversations
      socket.on('joinConversation', async (data: any, callback?: (response: any) => void) => {
        try {
          const { conversationId } = joinConversationSchema.parse(data)
          
          // Verify user has access to conversation
          const conversation = await conversationService.getConversationById(conversationId, userId)
          if (!conversation) {
            callback?.({ success: false, error: 'Conversation not found or access denied' })
            return
          }

          socket.join(`conversation:${conversationId}`)
          callback?.({ success: true })
          
          logger.info(`User ${userId} joined conversation ${conversationId}`)
        } catch (error) {
          logger.error('Error joining conversation:', error)
          callback?.({ success: false, error: 'Failed to join conversation' })
        }
      })

      // Handle leaving conversations
      socket.on('leaveConversation', async (data: any, callback?: (response: any) => void) => {
        try {
          const { conversationId } = leaveConversationSchema.parse(data)
          
          socket.leave(`conversation:${conversationId}`)
          callback?.({ success: true })
          
          logger.info(`User ${userId} left conversation ${conversationId}`)
        } catch (error) {
          logger.error('Error leaving conversation:', error)
          callback?.({ success: false, error: 'Failed to leave conversation' })
        }
      })

      // Handle sending messages
      socket.on('sendMessage', async (data: any, callback?: (response: any) => void) => {
        try {
          const messageData = createMessageSchema.parse(data)
          
          // Create message
          const message = await messageService.createMessage(
            messageData.conversationId,
            userId,
            messageData
          )

          // Broadcast to conversation participants
          socket.to(`conversation:${messageData.conversationId}`).emit('newMessage', message)
          
          callback?.({ success: true, data: message })
          
          logger.info(`Message sent by ${userId} to conversation ${messageData.conversationId}`)
        } catch (error) {
          logger.error('Error sending message:', error)
          callback?.({ success: false, error: 'Failed to send message' })
        }
      })

      // Handle typing indicators
      socket.on('typing', async (data: any) => {
        try {
          const { conversationId, isTyping } = typingSchema.parse(data)
          
          // Broadcast typing status to other participants
          socket.to(`conversation:${conversationId}`).emit('userTyping', {
            userId,
            conversationId,
            isTyping,
            timestamp: new Date(),
          })

          // Store typing indicator in database
          if (isTyping) {
            await TypingIndicator.findOneAndUpdate(
              { userId, conversationId },
              { userId, conversationId, lastTyping: new Date() },
              { upsert: true }
            )
          } else {
            await TypingIndicator.deleteOne({ userId, conversationId })
          }
        } catch (error) {
          logger.error('Error handling typing:', error)
        }
      })

      // Handle marking messages as read
      socket.on('markAsRead', async (data: any, callback?: (response: any) => void) => {
        try {
          const { messageId } = markAsReadSchema.parse(data)
          
          const message = await messageService.markAsRead(messageId, userId)
          
          if (message) {
            // Notify other participants
            socket.to(`conversation:${message.conversationId}`).emit('messageRead', {
              messageId,
              userId,
              readAt: new Date(),
            })
          }
          
          callback?.({ success: true })
        } catch (error) {
          logger.error('Error marking message as read:', error)
          callback?.({ success: false, error: 'Failed to mark message as read' })
        }
      })

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User ${userId} disconnected (socket ${socket.id})`)
        
        // Remove socket from user's set
        const userSockets = this.connectedUsers.get(userId)
        if (userSockets) {
          userSockets.delete(socket.id)
          if (userSockets.size === 0) {
            this.connectedUsers.delete(userId)
          }
        }
      })
    })
  }

  // Send message to specific user
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data)
  }

  // Send message to conversation participants
  public sendToConversation(conversationId: string, event: string, data: any): void {
    this.io.to(`conversation:${conversationId}`).emit(event, data)
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId)
  }

  // Get online users count
  public getOnlineUsersCount(): number {
    return this.connectedUsers.size
  }

  // Get socket instance
  public getIO(): SocketIOServer {
    return this.io
  }
}

export let socketService: SocketService

export const initializeSocketService = (server: HTTPServer): SocketService => {
  socketService = new SocketService(server)
  return socketService
}