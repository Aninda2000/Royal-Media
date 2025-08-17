import { z } from 'zod';

// Conversation schemas
export const createConversationSchema = z.object({
  participantIds: z.array(z.string()).min(1).max(50),
  type: z.enum(['direct', 'group']).default('direct'),
  name: z.string().max(100).optional(),
});

export const updateConversationSchema = z.object({
  name: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

// Message schemas
export const sendMessageSchema = z.object({
  text: z.string().max(5000).optional(),
  mediaUrls: z.array(z.string().url()).max(10).optional(),
  messageType: z.enum(['text', 'image', 'video', 'audio', 'file']).default('text'),
  replyToId: z.string().optional(),
}).refine(
  (data) => data.text || (data.mediaUrls && data.mediaUrls.length > 0),
  {
    message: 'Either text or mediaUrls must be provided',
  }
);

export const editMessageSchema = z.object({
  text: z.string().max(5000),
});

// Query schemas
export const getMessagesSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).default('50'),
  before: z.string().optional(), // Message ID for pagination
});

export const getConversationsSchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default('1'),
  limit: z.string().transform(Number).pipe(z.number().min(1).max(50)).default('20'),
});

// Socket event schemas
export const joinConversationSchema = z.object({
  conversationId: z.string(),
});

export const leaveConversationSchema = z.object({
  conversationId: z.string(),
});

export const typingSchema = z.object({
  conversationId: z.string(),
  isTyping: z.boolean(),
});

export const markAsReadSchema = z.object({
  conversationId: z.string(),
  messageId: z.string().optional(), // If not provided, marks all messages as read
});

// Type exports
export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
export type GetConversationsInput = z.infer<typeof getConversationsSchema>;
export type JoinConversationInput = z.infer<typeof joinConversationSchema>;
export type LeaveConversationInput = z.infer<typeof leaveConversationSchema>;
export type TypingInput = z.infer<typeof typingSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;