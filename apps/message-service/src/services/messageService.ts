import { Message, IMessage } from '../models/Message';
import { SendMessageInput, EditMessageInput } from '../schemas/validation';
import { conversationService } from './conversationService';
import { logger } from '../utils/logger';

export class MessageService {
  async sendMessage(
    conversationId: string,
    senderId: string,
    data: SendMessageInput
  ): Promise<IMessage> {
    try {
      // Verify user is participant in conversation
      const conversation = await conversationService.getConversationById(conversationId, senderId);
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      const message = new Message({
        conversationId,
        senderId,
        ...data,
        readBy: [{ userId: senderId, readAt: new Date() }], // Mark as read by sender
      });

      await message.save();
      
      // Update conversation's last message
      await conversationService.updateLastMessage(conversationId, message);
      
      logger.info(`Message sent: ${message._id} in conversation: ${conversationId} by user: ${senderId}`);
      
      return message;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
    before?: string
  ): Promise<{ messages: IMessage[]; hasMore: boolean }> {
    try {
      // Verify user is participant in conversation
      const conversation = await conversationService.getConversationById(conversationId, userId);
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      const query: any = {
        conversationId,
        deletedAt: { $exists: false },
      };

      // If 'before' is provided, get messages before that message
      if (before) {
        const beforeMessage = await Message.findById(before);
        if (beforeMessage) {
          query.createdAt = { $lt: beforeMessage.createdAt };
        }
      }

      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(limit + 1) // Get one extra to check if there are more
        .exec();

      const hasMore = messages.length > limit;
      if (hasMore) {
        messages.pop(); // Remove the extra message
      }

      // Reverse to get chronological order (oldest first)
      messages.reverse();

      return {
        messages,
        hasMore,
      };
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }

  async editMessage(
    messageId: string,
    userId: string,
    data: EditMessageInput
  ): Promise<IMessage | null> {
    try {
      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          senderId: userId,
          deletedAt: { $exists: false },
        },
        {
          text: data.text,
          editedAt: new Date(),
        },
        { new: true }
      );

      if (message) {
        logger.info(`Message edited: ${messageId} by user: ${userId}`);
      }

      return message;
    } catch (error) {
      logger.error('Error editing message:', error);
      throw error;
    }
  }

  async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<IMessage | null> {
    try {
      const message = await Message.findOneAndUpdate(
        {
          _id: messageId,
          senderId: userId,
          deletedAt: { $exists: false },
        },
        {
          deletedAt: new Date(),
        },
        { new: true }
      );

      if (message) {
        logger.info(`Message deleted: ${messageId} by user: ${userId}`);
      }

      return message;
    } catch (error) {
      logger.error('Error deleting message:', error);
      throw error;
    }
  }

  async markAsRead(
    conversationId: string,
    userId: string,
    messageId?: string
  ): Promise<void> {
    try {
      // Verify user is participant in conversation
      const conversation = await conversationService.getConversationById(conversationId, userId);
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      const query: any = {
        conversationId,
        senderId: { $ne: userId }, // Don't mark own messages
        'readBy.userId': { $ne: userId }, // Not already read by user
        deletedAt: { $exists: false },
      };

      if (messageId) {
        query._id = messageId;
      }

      await Message.updateMany(query, {
        $push: {
          readBy: {
            userId,
            readAt: new Date(),
          },
        },
      });

      logger.info(`Messages marked as read in conversation: ${conversationId} by user: ${userId}`);
    } catch (error) {
      logger.error('Error marking messages as read:', error);
      throw error;
    }
  }

  async getUnreadCount(
    conversationId: string,
    userId: string
  ): Promise<number> {
    try {
      const count = await Message.countDocuments({
        conversationId,
        senderId: { $ne: userId },
        'readBy.userId': { $ne: userId },
        deletedAt: { $exists: false },
      });

      return count;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }

  async searchMessages(
    conversationId: string,
    userId: string,
    query: string,
    limit: number = 20
  ): Promise<IMessage[]> {
    try {
      // Verify user is participant in conversation
      const conversation = await conversationService.getConversationById(conversationId, userId);
      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      const messages = await Message.find({
        conversationId,
        text: { $regex: query, $options: 'i' },
        deletedAt: { $exists: false },
      })
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return messages;
    } catch (error) {
      logger.error('Error searching messages:', error);
      throw error;
    }
  }
}

export const messageService = new MessageService();