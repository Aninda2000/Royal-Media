'use client';

import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import { toast } from 'sonner';

export interface NotificationData {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'post' | 'friend_request' | 'system';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  data?: Record<string, any>;
}

export const useNotifications = () => {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const notificationServiceUrl = process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL || 'http://localhost:3003';

  const connectSocket = useCallback(() => {
    if (!user || !token || socketRef.current?.connected) return;

    const socket = io(notificationServiceUrl, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Connected to notification service');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from notification service');
    });

    socket.on('connect_error', (error) => {
      console.error('Notification socket connection error:', error);
    });

    // Listen for new notifications
    socket.on('new_notification', (notification: NotificationData) => {
      console.log('New notification received:', notification);
      
      // Show toast notification based on type
      if (notification.type === 'friend_request') {
        if (notification.data?.type === 'friend_request_received') {
          toast.success(notification.title, {
            description: notification.message,
            action: {
              label: 'View',
              onClick: () => {
                window.location.href = '/friends?tab=requests';
              },
            },
          });
        } else if (notification.data?.type === 'friend_request_accepted') {
          toast.success(notification.title, {
            description: notification.message,
            action: {
              label: 'View Profile',
              onClick: () => {
                window.location.href = `/profile/${notification.actorId}`;
              },
            },
          });
        }
      } else {
        // Generic notification toast
        toast(notification.title, {
          description: notification.message,
        });
      }

      // Trigger custom event for other components to listen to
      window.dispatchEvent(new CustomEvent('newNotification', { detail: notification }));
    });

    // Listen for unread count updates
    socket.on('unread_count_updated', ({ count }: { count: number }) => {
      console.log('Unread count updated:', count);
      window.dispatchEvent(new CustomEvent('unreadCountUpdated', { detail: count }));
    });

    socketRef.current = socket;
  }, [user, token, notificationServiceUrl]);

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  // Socket management
  useEffect(() => {
    if (user && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [user, token, connectSocket, disconnectSocket]);

  // API methods
  const markAsRead = useCallback((notificationIds: string[]) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark_as_read', { notificationIds }, (response: any) => {
        if (!response.success) {
          console.error('Failed to mark notifications as read:', response.error);
        }
      });
    }
  }, []);

  const markAllAsRead = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('mark_all_as_read', {}, (response: any) => {
        if (!response.success) {
          console.error('Failed to mark all notifications as read:', response.error);
        }
      });
    }
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('delete_notification', { notificationId }, (response: any) => {
        if (!response.success) {
          console.error('Failed to delete notification:', response.error);
        }
      });
    }
  }, []);

  const getNotifications = useCallback((page = 1, limit = 20, unreadOnly = false): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('get_notifications', { page, limit, unreadOnly }, (response: any) => {
          if (response.success) {
            resolve(response.data);
          } else {
            reject(new Error(response.error));
          }
        });
      } else {
        reject(new Error('Socket not connected'));
      }
    });
  }, []);

  const getUnreadCount = useCallback((): Promise<number> => {
    return new Promise((resolve, reject) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('get_unread_count', {}, (response: any) => {
          if (response.success) {
            resolve(response.data.count);
          } else {
            reject(new Error(response.error));
          }
        });
      } else {
        reject(new Error('Socket not connected'));
      }
    });
  }, []);

  return {
    isConnected: socketRef.current?.connected || false,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotifications,
    getUnreadCount,
  };
};