import { Conversation, IConversation } from '../models/Conversation';
import { Message, IMessage } from '../models/Message';
import { CreateConversationInput, UpdateConversationInput } from '../schemas/validation';
import { logger } from '../utils/logger';

export class ConversationService {
  async createConversation(
    userId: string,
    data: CreateConversationInput
  ): Promise<IConversation> {
    try {
      // Ensure the creator is included in participants
      const participantIds = Array.from(new Set([userId, ...data.participantIds]));
      
      // For direct messages, check if conversation already exists
      if (data.type === 'direct' && participantIds.length === 2) {
        const existingConversation = await Conversation.findOne({
          type: 'direct',
          participantIds: { $all: participantIds, $size: 2 },
        });
        
        if (existingConversation) {
          return existingConversation;
        }
      }

      const conversation = new Conversation({
        ...data,
        participantIds,
        createdBy: userId,
      });

      await conversation.save();
      logger.info(`Conversation created: ${conversation._id} by user: ${userId}`);
      
      return conversation;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ conversations: IConversation[]; total: number; hasMore: boolean }> {
    try {
      const skip = (page - 1) * limit;
      
      const conversations = await Conversation.find({
        participantIds: userId,
      })
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit + 1) // Get one extra to check if there are more
        .exec();

      const hasMore = conversations.length > limit;
      if (hasMore) {
        conversations.pop(); // Remove the extra conversation
      }

      const total = await Conversation.countDocuments({
        participantIds: userId,
      });

      return {
        conversations,
        total,
        hasMore,
      };
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getConversationById(
    conversationId: string,
    userId: string
  ): Promise<IConversation | null> {
    try {
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participantIds: userId,
      });

      return conversation;
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  }

  async updateConversation(
    conversationId: string,
    userId: string,
    data: UpdateConversationInput
  ): Promise<IConversation | null> {
    try {
      const conversation = await Conversation.findOneAndUpdate(
        {
          _id: conversationId,
          participantIds: userId,
          type: 'group', // Only group conversations can be updated
        },
        data,
        { new: true }
      );

      if (conversation) {
        logger.info(`Conversation updated: ${conversationId} by user: ${userId}`);
      }

      return conversation;
    } catch (error) {
      logger.error('Error updating conversation:', error);
      throw error;
    }
  }

  async addParticipants(
    conversationId: string,
    userId: string,
    participantIds: string[]
  ): Promise<IConversation | null> {
    try {
      const conversation = await Conversation.findOneAndUpdate(
        {
          _id: conversationId,
          participantIds: userId,
          type: 'group',
        },
        {
          $addToSet: { participantIds: { $each: participantIds } },
        },
        { new: true }
      );

      if (conversation) {
        logger.info(`Participants added to conversation: ${conversationId} by user: ${userId}`);
      }

      return conversation;
    } catch (error) {
      logger.error('Error adding participants:', error);
      throw error;
    }
  }

  async removeParticipant(
    conversationId: string,
    userId: string,
    participantId: string
  ): Promise<IConversation | null> {
    try {
      const conversation = await Conversation.findOneAndUpdate(
        {
          _id: conversationId,
          participantIds: userId,
          type: 'group',
        },
        {
          $pull: { participantIds: participantId },
        },
        { new: true }
      );

      if (conversation) {
        logger.info(`Participant removed from conversation: ${conversationId} by user: ${userId}`);
      }

      return conversation;
    } catch (error) {
      logger.error('Error removing participant:', error);
      throw error;
    }
  }

  async updateLastMessage(
    conversationId: string,
    message: IMessage
  ): Promise<void> {
    try {
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessageAt: message.createdAt,
        lastMessage: {
          text: message.text || '[Media]',
          senderId: message.senderId,
          createdAt: message.createdAt,
        },
      });
    } catch (error) {
      logger.error('Error updating last message:', error);
      throw error;
    }
  }
}

export const conversationService = new ConversationService();