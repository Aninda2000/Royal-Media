import { Router, Response } from 'express'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { notificationService } from '../services/notificationService'
import { notificationSocketService } from '../services/socketService'
import { logger } from '../utils/logger'
import { z } from 'zod'

const router = Router()

// Validation schemas
const getNotificationsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('20'),
  unreadOnly: z.string().transform(val => val === 'true').default('false'),
})

const markAsReadSchema = z.object({
  notificationIds: z.array(z.string()).min(1),
})

const createNotificationSchema = z.object({
  recipientId: z.string(),
  type: z.enum(['like', 'comment', 'follow', 'message', 'mention', 'post', 'friend_request', 'system']),
  title: z.string().max(200),
  message: z.string().max(500),
  actorId: z.string().optional(),
  entityType: z.enum(['post', 'comment', 'user', 'conversation', 'message']).optional(),
  entityId: z.string().optional(),
  data: z.record(z.any()).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  expiresAt: z.string().datetime().optional(),
})

// Get user's notifications
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { page, limit, unreadOnly } = getNotificationsSchema.parse(req.query)

    const result = await notificationService.getNotifications(userId, page, limit, unreadOnly)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Error getting notifications:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get notifications',
      },
    })
  }
})

// Create notification (for internal service use)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const data = createNotificationSchema.parse(req.body)
    
    // Convert string dates to Date objects if needed
    const notificationData = {
      ...data,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    }

    const notification = await notificationService.createNotification(notificationData)

    // Emit real-time notification if user is online
    if (notificationSocketService.isUserOnline(data.recipientId)) {
      await notificationSocketService.emitNotification(data.recipientId, notification)
    }

    res.status(201).json({
      success: true,
      data: notification,
    })
  } catch (error) {
    logger.error('Error creating notification:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create notification',
      },
    })
  }
})

// Mark notifications as read
router.post('/read', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { notificationIds } = markAsReadSchema.parse(req.body)

    await notificationService.markAsRead(notificationIds, userId)

    res.json({
      success: true,
      data: { marked: true },
    })
  } catch (error) {
    logger.error('Error marking notifications as read:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notifications as read',
      },
    })
  }
})

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    await notificationService.markAllAsRead(userId)

    res.json({
      success: true,
      data: { marked: true },
    })
  } catch (error) {
    logger.error('Error marking all notifications as read:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark all notifications as read',
      },
    })
  }
})

// Mark single notification as read
router.patch('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const notificationId = req.params.id

    const notification = await notificationService.markSingleAsRead(notificationId, userId)

    if (!notification) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      })
      return
    }

    res.json({
      success: true,
      data: notification,
    })
  } catch (error) {
    logger.error('Error marking notification as read:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notification as read',
      },
    })
  }
})

// Delete notification
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const notificationId = req.params.id

    const deleted = await notificationService.deleteNotification(notificationId, userId)

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      })
      return
    }

    res.json({
      success: true,
      data: { deleted: true },
    })
  } catch (error) {
    logger.error('Error deleting notification:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete notification',
      },
    })
  }
})

// Clear all notifications
router.delete('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    await notificationService.clearAllNotifications(userId)

    res.json({
      success: true,
      message: 'All notifications cleared',
    })
  } catch (error) {
    logger.error('Error clearing all notifications:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to clear all notifications',
      },
    })
  }
})

// Get unread count
router.get('/unread-count', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const count = await notificationService.getUnreadCount(userId)

    res.json({
      success: true,
      data: { count },
    })
  } catch (error) {
    logger.error('Error getting unread count:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get unread count',
      },
    })
  }
})

// Get notification settings
router.get('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const settings = await notificationService.getNotificationSettings(userId)

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    logger.error('Error getting notification settings:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get notification settings',
      },
    })
  }
})

// Update notification settings
router.patch('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId

    const settings = await notificationService.updateNotificationSettings(userId, req.body)

    res.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    logger.error('Error updating notification settings:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update notification settings',
      },
    })
  }
})

// Bulk create notifications (for internal services)
router.post('/bulk', async (req, res: Response): Promise<void> => {
  try {
    // This endpoint should be called by internal services only
    // In production, you might want to add internal service authentication
    const notifications = req.body.notifications

    if (!Array.isArray(notifications)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'notifications must be an array',
        },
      })
      return
    }

    const createdNotifications = await notificationService.bulkCreateNotifications(notifications)

    // Emit real-time notifications for online users
    const notificationsByUser = createdNotifications.reduce((acc, notification) => {
      if (!acc[notification.recipientId]) {
        acc[notification.recipientId] = []
      }
      acc[notification.recipientId].push(notification)
      return acc
    }, {} as Record<string, any[]>)

    const bulkNotifications = Object.entries(notificationsByUser).map(([userId, userNotifications]) => ({
      userId,
      notification: userNotifications[0], // Send the first notification, others will be fetched
    }))

    await notificationSocketService.emitBulkNotifications(bulkNotifications)

    res.status(201).json({
      success: true,
      data: { created: createdNotifications.length },
    })
  } catch (error) {
    logger.error('Error bulk creating notifications:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to bulk create notifications',
      },
    })
  }
})

export default router