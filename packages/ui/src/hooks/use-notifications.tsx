"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

interface Notification {
  _id: string
  recipientId: string
  type: 'likes' | 'comments' | 'follows' | 'messages' | 'mentions' | 'posts' | 'friendRequests' | 'system'
  title: string
  message: string
  actorId?: string
  entityType?: 'post' | 'comment' | 'user' | 'conversation' | 'message'
  entityId?: string
  data?: Record<string, any>
  readAt?: Date
  clickedAt?: Date
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: Date
  updatedAt: Date
}

interface NotificationSettings {
  userId: string
  emailNotifications: {
    likes: boolean
    comments: boolean
    follows: boolean
    messages: boolean
    mentions: boolean
    posts: boolean
    friendRequests: boolean
    system: boolean
  }
  pushNotifications: {
    likes: boolean
    comments: boolean
    follows: boolean
    messages: boolean
    mentions: boolean
    posts: boolean
    friendRequests: boolean
    system: boolean
  }
  inAppNotifications: {
    likes: boolean
    comments: boolean
    follows: boolean
    messages: boolean
    mentions: boolean
    posts: boolean
    friendRequests: boolean
    system: boolean
  }
  soundEnabled: boolean
  vibrationEnabled: boolean
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  createdAt: Date
  updatedAt: Date
}

interface NotificationContextType {
  socket: Socket | null
  notifications: Notification[]
  unreadCount: number
  settings: NotificationSettings | null
  isConnected: boolean
  isLoading: boolean
  error: string | null
  
  // Notification actions
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (notificationId: string) => Promise<void>
  clearAllNotifications: () => Promise<void>
  
  // Settings actions
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>
  
  // Real-time actions
  sendNotification: (notification: Omit<Notification, '_id' | 'createdAt' | 'updatedAt'>) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user, token } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter(n => !n.readAt).length

  // Initialize socket connection
  useEffect(() => {
    if (!user || !token) {
      setIsLoading(false)
      return
    }

    const socketInstance = io(process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL!, {
      auth: {
        token: token
      },
      transports: ['websocket']
    })

    socketInstance.on('connect', () => {
      console.log('Connected to notification service')
      setIsConnected(true)
      setError(null)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from notification service')
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('Notification service connection error:', error)
      setError('Failed to connect to notification service')
      setIsConnected(false)
    })

    // Listen for new notifications
    socketInstance.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
      
      // Show toast notification if in-app notifications are enabled
      if (settings?.inAppNotifications[notification.type] !== false) {
        toast(notification.title, {
          description: notification.message,
          action: notification.entityId ? {
            label: 'View',
            onClick: () => handleNotificationClick(notification)
          } : undefined
        })
      }
    })

    // Listen for notification updates
    socketInstance.on('notificationRead', (notificationId: string) => {
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId
            ? { ...n, readAt: new Date() }
            : n
        )
      )
    })

    socketInstance.on('notificationDeleted', (notificationId: string) => {
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
    })

    socketInstance.on('allNotificationsRead', () => {
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: new Date() }))
      )
    })

    socketInstance.on('allNotificationsCleared', () => {
      setNotifications([])
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [user, token, settings])

  // Fetch initial notifications and settings
  useEffect(() => {
    if (!user || !token) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch notifications
        const notificationsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL}/api/notifications`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (notificationsResponse.ok) {
          const notificationsData = await notificationsResponse.json()
          setNotifications(notificationsData.data || [])
        }

        // Fetch settings
        const settingsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL}/api/notifications/settings`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        )
        
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSettings(settingsData.data)
        }
      } catch (error) {
        console.error('Error fetching notification data:', error)
        setError('Failed to load notifications')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, token])

  const handleNotificationClick = (notification: Notification) => {
    // Handle navigation based on notification type and entity
    // This would integrate with your routing system
    console.log('Notification clicked:', notification)
  }

  const markAsRead = async (notificationId: string) => {
    if (!token) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL}/api/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n =>
          n._id === notificationId
            ? { ...n, readAt: new Date() }
            : n
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
      toast.error('Failed to mark notification as read')
    }
  }

  const markAllAsRead = async () => {
    if (!token) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL}/api/notifications/read-all`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read')
      }

      // Optimistically update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, readAt: new Date() }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('Failed to mark all notifications as read')
    }
  }

  const deleteNotification = async (notificationId: string) => {
    if (!token) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL}/api/notifications/${notificationId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete notification')
      }

      // Optimistically update local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId))
    } catch (error) {
      console.error('Error deleting notification:', error)
      toast.error('Failed to delete notification')
    }
  }

  const clearAllNotifications = async () => {
    if (!token) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL}/api/notifications`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!response.ok) {
        throw new Error('Failed to clear all notifications')
      }

      // Optimistically update local state
      setNotifications([])
    } catch (error) {
      console.error('Error clearing all notifications:', error)
      toast.error('Failed to clear all notifications')
    }
  }

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!token) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_NOTIFICATION_SERVICE_URL}/api/notifications/settings`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newSettings)
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update notification settings')
      }

      const updatedSettings = await response.json()
      setSettings(updatedSettings.data)
      toast.success('Notification settings updated')
    } catch (error) {
      console.error('Error updating notification settings:', error)
      toast.error('Failed to update notification settings')
    }
  }

  const sendNotification = (notification: Omit<Notification, '_id' | 'createdAt' | 'updatedAt'>) => {
    if (socket) {
      socket.emit('sendNotification', notification)
    }
  }

  const value: NotificationContextType = {
    socket,
    notifications,
    unreadCount,
    settings,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    sendNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}