import { Notification, INotification } from '../models/Notification';
import { NotificationSettings, INotificationSettings } from '../models/NotificationSettings';
import { logger } from '../utils/logger';

export interface CreateNotificationInput {
  recipientId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'post' | 'friend_request' | 'system';
  title: string;
  message: string;
  actorId?: string;
  entityType?: 'post' | 'comment' | 'user' | 'conversation' | 'message';
  entityId?: string;
  data?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date;
}

export class NotificationService {
  async createNotification(input: CreateNotificationInput): Promise<INotification> {
    try {
      // Check if user has notification settings
      const settings = await this.getNotificationSettings(input.recipientId);
      
      // Check if this type of notification is enabled for in-app notifications
      if (!settings.inAppNotifications[input.type as keyof typeof settings.inAppNotifications]) {
        logger.info(`Notification type ${input.type} disabled for user ${input.recipientId}`);
        throw new Error('Notification type disabled');
      }

      const notification = new Notification(input);
      await notification.save();

      logger.info(`Notification created: ${notification._id} for user: ${input.recipientId}`);
      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{ notifications: INotification[]; total: number; unreadCount: number; hasMore: boolean }> {
    try {
      const skip = (page - 1) * limit;
      
      const query: any = { recipientId: userId };
      if (unreadOnly) {
        query.readAt = { $exists: false };
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit + 1) // Get one extra to check if there are more
        .exec();

      const hasMore = notifications.length > limit;
      if (hasMore) {
        notifications.pop(); // Remove the extra notification
      }

      const total = await Notification.countDocuments({ recipientId: userId });
      const unreadCount = await Notification.countDocuments({
        recipientId: userId,
        readAt: { $exists: false },
      });

      return {
        notifications,
        total,
        unreadCount,
        hasMore,
      };
    } catch (error) {
      logger.error('Error getting notifications:', error);
      throw error;
    }
  }

  async markAsRead(
    notificationIds: string[],
    userId: string
  ): Promise<void> {
    try {
      await Notification.updateMany(
        {
          _id: { $in: notificationIds },
          recipientId: userId,
          readAt: { $exists: false },
        },
        {
          readAt: new Date(),
        }
      );

      logger.info(`Marked ${notificationIds.length} notifications as read for user: ${userId}`);
    } catch (error) {
      logger.error('Error marking notifications as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await Notification.updateMany(
        {
          recipientId: userId,
          readAt: { $exists: false },
        },
        {
          readAt: new Date(),
        }
      );

      logger.info(`Marked all notifications as read for user: ${userId}`);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await Notification.deleteOne({
        _id: notificationId,
        recipientId: userId,
      });

      const deleted = result.deletedCount > 0;
      if (deleted) {
        logger.info(`Notification deleted: ${notificationId} by user: ${userId}`);
      }

      return deleted;
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getNotificationSettings(userId: string): Promise<INotificationSettings> {
    try {
      let settings = await NotificationSettings.findOne({ userId });
      
      if (!settings) {
        // Create default settings for new user
        settings = new NotificationSettings({ userId });
        await settings.save();
        logger.info(`Created default notification settings for user: ${userId}`);
      }

      return settings;
    } catch (error) {
      logger.error('Error getting notification settings:', error);
      throw error;
    }
  }

  async updateNotificationSettings(
    userId: string,
    updates: Partial<INotificationSettings>
  ): Promise<INotificationSettings> {
    try {
      const settings = await NotificationSettings.findOneAndUpdate(
        { userId },
        updates,
        { new: true, upsert: true }
      );

      logger.info(`Notification settings updated for user: ${userId}`);
      return settings!;
    } catch (error) {
      logger.error('Error updating notification settings:', error);
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const count = await Notification.countDocuments({
        recipientId: userId,
        readAt: { $exists: false },
      });

      return count;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  async bulkCreateNotifications(notifications: CreateNotificationInput[]): Promise<INotification[]> {
    try {
      const validNotifications = [];
      
      for (const notif of notifications) {
        const settings = await this.getNotificationSettings(notif.recipientId);
        if (settings.inAppNotifications[notif.type as keyof typeof settings.inAppNotifications]) {
          validNotifications.push(notif);
        }
      }

      if (validNotifications.length === 0) {
        return [];
      }

      const createdNotifications = await Notification.insertMany(validNotifications);
      logger.info(`Bulk created ${createdNotifications.length} notifications`);
      
      return createdNotifications;
    } catch (error) {
      logger.error('Error bulk creating notifications:', error);
      throw error;
    }
  }

  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      logger.info(`Cleaned up ${result.deletedCount} expired notifications`);
    } catch (error) {
      logger.error('Error cleaning up expired notifications:', error);
      throw error;
    }
  }

  async getNotificationsByType(
    userId: string,
    type: string,
    limit: number = 10
  ): Promise<INotification[]> {
    try {
      const notifications = await Notification.find({
        recipientId: userId,
        type,
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return notifications;
    } catch (error) {
      logger.error('Error getting notifications by type:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService();