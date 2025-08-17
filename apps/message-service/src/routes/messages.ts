import { Router, Response } from 'express'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { messageService } from '../services/messageService'
import {
  createMessageSchema,
  getMessagesSchema,
  updateMessageSchema,
} from '../schemas/validation'
import { logger } from '../utils/logger'

const router = Router()

// Get messages for a conversation
router.get('/:conversationId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.conversationId
    const { page, limit } = getMessagesSchema.parse(req.query)

    const result = await messageService.getMessages(conversationId, userId, page, limit)

    res.json({
      success: true,
      data: result,
    })
  } catch (error: unknown) {
    logger.error('Error getting messages:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get messages',
      },
    })
  }
})

// Send a message
router.post('/:conversationId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.conversationId
    const data = createMessageSchema.parse(req.body)

    const message = await messageService.createMessage(conversationId, userId, data)

    res.status(201).json({
      success: true,
      data: message,
    })
  } catch (error: unknown) {
    logger.error('Error creating message:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create message',
      },
    })
  }
})

// Update a message
router.patch('/:messageId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const messageId = req.params.messageId
    const data = updateMessageSchema.parse(req.body)

    const message = await messageService.updateMessage(messageId, userId, data)

    if (!message) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found or access denied',
        },
      })
      return
    }

    res.json({
      success: true,
      data: message,
    })
  } catch (error: unknown) {
    logger.error('Error updating message:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update message',
      },
    })
  }
})

// Delete a message
router.delete('/:messageId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const messageId = req.params.messageId

    const success = await messageService.deleteMessage(messageId, userId)

    if (!success) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found or access denied',
        },
      })
      return
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
    })
  } catch (error: unknown) {
    logger.error('Error deleting message:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete message',
      },
    })
  }
})

// Mark message as read
router.patch('/:messageId/read', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const messageId = req.params.messageId

    const message = await messageService.markAsRead(messageId, userId)

    if (!message) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found',
        },
      })
      return
    }

    res.json({
      success: true,
      data: message,
    })
  } catch (error: unknown) {
    logger.error('Error marking message as read:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark message as read',
      },
    })
  }
})

// Mark all messages in conversation as read
router.patch('/:conversationId/read-all', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.conversationId

    await messageService.markAllAsRead(conversationId, userId)

    res.json({
      success: true,
      message: 'All messages marked as read',
    })
  } catch (error: unknown) {
    logger.error('Error marking all messages as read:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark messages as read',
      },
    })
  }
})

export default router