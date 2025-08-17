import { Router, Response } from 'express'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { conversationService } from '../services/conversationService'
import {
  createConversationSchema,
  updateConversationSchema,
  getConversationsSchema,
} from '../schemas/validation'
import { logger } from '../utils/logger'

const router = Router()

// Get user's conversations
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const { page, limit } = getConversationsSchema.parse(req.query)

    const result = await conversationService.getConversations(userId, page, limit)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    logger.error('Error getting conversations:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get conversations',
      },
    })
  }
})

// Create new conversation
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const data = createConversationSchema.parse(req.body)

    const conversation = await conversationService.createConversation(userId, data)

    res.status(201).json({
      success: true,
      data: conversation,
    })
  } catch (error) {
    logger.error('Error creating conversation:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create conversation',
      },
    })
  }
})

// Get conversation by ID
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id

    const conversation = await conversationService.getConversationById(conversationId, userId)

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      })
      return
    }

    res.json({
      success: true,
      data: conversation,
    })
  } catch (error) {
    logger.error('Error getting conversation:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to get conversation',
      },
    })
  }
})

// Update conversation
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id
    const data = updateConversationSchema.parse(req.body)

    const conversation = await conversationService.updateConversation(conversationId, userId, data)

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      })
      return
    }

    res.json({
      success: true,
      data: conversation,
    })
  } catch (error) {
    logger.error('Error updating conversation:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update conversation',
      },
    })
  }
})

// Delete conversation
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id

    const success = await conversationService.deleteConversation(conversationId, userId)

    if (!success) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      })
      return
    }

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    })
  } catch (error) {
    logger.error('Error deleting conversation:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete conversation',
      },
    })
  }
})

// Add participant to conversation
router.post('/:id/participants', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id
    const { participantId } = req.body

    const conversation = await conversationService.addParticipant(conversationId, userId, participantId)

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      })
      return
    }

    res.json({
      success: true,
      data: conversation,
    })
  } catch (error) {
    logger.error('Error adding participant:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to add participant',
      },
    })
  }
})

// Remove participant from conversation
router.delete('/:id/participants/:participantId', authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.userId
    const conversationId = req.params.id
    const participantId = req.params.participantId

    const conversation = await conversationService.removeParticipant(conversationId, userId, participantId)

    if (!conversation) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Conversation not found',
        },
      })
      return
    }

    res.json({
      success: true,
      data: conversation,
    })
  } catch (error) {
    logger.error('Error removing participant:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to remove participant',
      },
    })
  }
})

export default router