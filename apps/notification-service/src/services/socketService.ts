import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { authenticateSocket, AuthenticatedSocket } from '../middleware/socketAuth';
import { redisClient } from '../config/redis';
import { logger } from '../utils/logger';
import { notificationService } from './notificationService';

export class NotificationSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupRedisAdapter();
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private async setupRedisAdapter(): Promise<void> {
    try {
      const pubClient = redisClient.getPublisher();
      const subClient = redisClient.getSubscriber();
      
      this.io.adapter(createAdapter(pubClient, subClient));
      logger.info('Notification Socket.IO Redis adapter configured');
    } catch (error) {
      logger.error('Failed to setup Redis adapter:', error);
    }
  }

  private setupMiddleware(): void {
    this.io.use(authenticateSocket);
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.user?.userId;
    if (!userId) {
      logger.error('Socket connected without user ID');
      socket.disconnect();
      return;
    }

    logger.info(`User connected to notifications: ${userId} (socket: ${socket.id})`);

    // Track connected user
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socket.id);

    // Join user's personal notification room
    socket.join(`notifications:${userId}`);

    // Send unread count on connection
    this.sendUnreadCount(userId);

    // Setup event handlers
    this.setupSocketEvents(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }

  private setupSocketEvents(socket: AuthenticatedSocket): void {
    const userId = socket.user!.userId;

    // Get notifications
    socket.on('get_notifications', async (data, callback) => {
      try {
        const { page = 1, limit = 20, unreadOnly = false } = data || {};
        const result = await notificationService.getNotifications(userId, page, limit, unreadOnly);
        
        callback({ success: true, data: result });
      } catch (error) {
        logger.error('Error getting notifications via socket:', error);
        callback({ success: false, error: 'Failed to get notifications' });
      }
    });

    // Mark notifications as read
    socket.on('mark_as_read', async (data, callback) => {
      try {
        const { notificationIds } = data;
        
        if (!Array.isArray(notificationIds)) {
          callback({ success: false, error: 'notificationIds must be an array' });
          return;
        }

        await notificationService.markAsRead(notificationIds, userId);
        
        // Send updated unread count
        this.sendUnreadCount(userId);
        
        callback({ success: true });
      } catch (error) {
        logger.error('Error marking notifications as read via socket:', error);
        callback({ success: false, error: 'Failed to mark notifications as read' });
      }
    });

    // Mark all notifications as read
    socket.on('mark_all_as_read', async (data, callback) => {
      try {
        await notificationService.markAllAsRead(userId);
        
        // Send updated unread count
        this.sendUnreadCount(userId);
        
        callback({ success: true });
      } catch (error) {
        logger.error('Error marking all notifications as read via socket:', error);
        callback({ success: false, error: 'Failed to mark all notifications as read' });
      }
    });

    // Delete notification
    socket.on('delete_notification', async (data, callback) => {
      try {
        const { notificationId } = data;
        
        if (!notificationId) {
          callback({ success: false, error: 'notificationId is required' });
          return;
        }

        const deleted = await notificationService.deleteNotification(notificationId, userId);
        
        if (deleted) {
          // Send updated unread count
          this.sendUnreadCount(userId);
          callback({ success: true });
        } else {
          callback({ success: false, error: 'Notification not found' });
        }
      } catch (error) {
        logger.error('Error deleting notification via socket:', error);
        callback({ success: false, error: 'Failed to delete notification' });
      }
    });

    // Get unread count
    socket.on('get_unread_count', async (data, callback) => {
      try {
        const count = await notificationService.getUnreadCount(userId);
        callback({ success: true, data: { count } });
      } catch (error) {
        logger.error('Error getting unread count via socket:', error);
        callback({ success: false, error: 'Failed to get unread count' });
      }
    });

    // Get notification settings
    socket.on('get_notification_settings', async (data, callback) => {
      try {
        const settings = await notificationService.getNotificationSettings(userId);
        callback({ success: true, data: settings });
      } catch (error) {
        logger.error('Error getting notification settings via socket:', error);
        callback({ success: false, error: 'Failed to get notification settings' });
      }
    });

    // Update notification settings
    socket.on('update_notification_settings', async (data, callback) => {
      try {
        const settings = await notificationService.updateNotificationSettings(userId, data);
        callback({ success: true, data: settings });
      } catch (error) {
        logger.error('Error updating notification settings via socket:', error);
        callback({ success: false, error: 'Failed to update notification settings' });
      }
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket): void {
    const userId = socket.user?.userId;
    if (!userId) return;

    logger.info(`User disconnected from notifications: ${userId} (socket: ${socket.id})`);

    // Remove socket from connected users
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
  }

  private async sendUnreadCount(userId: string): Promise<void> {
    try {
      const count = await notificationService.getUnreadCount(userId);
      this.io.to(`notifications:${userId}`).emit('unread_count_updated', { count });
    } catch (error) {
      logger.error('Error sending unread count:', error);
    }
  }

  // Public methods for external services to emit notifications
  public async emitNotification(userId: string, notification: any): Promise<void> {
    try {
      // Send the notification to the user
      this.io.to(`notifications:${userId}`).emit('new_notification', notification);
      
      // Update unread count
      this.sendUnreadCount(userId);
      
      logger.info(`Notification emitted to user: ${userId}`);
    } catch (error) {
      logger.error('Error emitting notification:', error);
    }
  }

  public async emitBulkNotifications(notifications: Array<{ userId: string; notification: any }>): Promise<void> {
    try {
      const userIds = new Set<string>();
      
      for (const { userId, notification } of notifications) {
        this.io.to(`notifications:${userId}`).emit('new_notification', notification);
        userIds.add(userId);
      }
      
      // Update unread counts for all affected users
      for (const userId of userIds) {
        this.sendUnreadCount(userId);
      }
      
      logger.info(`Bulk notifications emitted to ${userIds.size} users`);
    } catch (error) {
      logger.error('Error emitting bulk notifications:', error);
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  public async broadcastSystemNotification(notification: any): Promise<void> {
    try {
      this.io.emit('system_notification', notification);
      logger.info('System notification broadcasted to all users');
    } catch (error) {
      logger.error('Error broadcasting system notification:', error);
    }
  }
}

export let notificationSocketService: NotificationSocketService;