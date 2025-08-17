import axios from 'axios';

export interface NotificationPayload {
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

export class NotificationClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
    this.apiKey = process.env.NOTIFICATION_SERVICE_API_KEY || 'dev-api-key';
  }

  async createNotification(payload: NotificationPayload): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/api/notifications`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 5000, // 5 second timeout
      });
    } catch (error) {
      // Log error but don't throw to avoid breaking the main flow
      console.error('Failed to create notification:', error);
    }
  }

  async createFriendRequestNotification(senderId: string, receiverId: string, senderName: string): Promise<void> {
    await this.createNotification({
      recipientId: receiverId,
      type: 'friend_request',
      title: 'New Friend Request',
      message: `${senderName} sent you a friend request`,
      actorId: senderId,
      entityType: 'user',
      entityId: senderId,
      priority: 'normal',
      data: {
        type: 'friend_request_received',
        senderId,
        senderName,
      },
    });
  }

  async createFriendRequestAcceptedNotification(receiverId: string, senderId: string, receiverName: string): Promise<void> {
    await this.createNotification({
      recipientId: senderId,
      type: 'friend_request',
      title: 'Friend Request Accepted',
      message: `${receiverName} accepted your friend request`,
      actorId: receiverId,
      entityType: 'user',
      entityId: receiverId,
      priority: 'normal',
      data: {
        type: 'friend_request_accepted',
        receiverId,
        receiverName,
      },
    });
  }
}

export const notificationClient = new NotificationClient();