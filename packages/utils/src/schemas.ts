import { z } from 'zod';

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  handle: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const UpdateUserSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional(),
  workplace: z.string().max(100).optional(),
  education: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  coverUrl: z.string().url().optional(),
  isPrivate: z.boolean().optional(),
});

export const FollowUserSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

// Post schemas
export const CreatePostSchema = z.object({
  text: z.string().min(1).max(2000),
  mediaUrls: z.array(z.string().url()).optional(),
  hashtags: z.array(z.string()).optional(),
  mentions: z.array(z.string()).optional(),
  visibility: z.enum(['public', 'friends', 'private']).default('public'),
});

export const UpdatePostSchema = z.object({
  text: z.string().min(1).max(2000).optional(),
  visibility: z.enum(['public', 'friends', 'private']).optional(),
});

export const CreateCommentSchema = z.object({
  text: z.string().min(1).max(1000),
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  parentCommentId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
});

export const LikeSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/),
});

export const SharePostSchema = z.object({
  postId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  text: z.string().max(500).optional(),
});

// Message schemas
export const CreateConversationSchema = z.object({
  participantIds: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/)).min(1),
  type: z.enum(['direct', 'group']),
  name: z.string().min(1).max(100).optional(),
});

export const SendMessageSchema = z.object({
  conversationId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  text: z.string().min(1).max(2000),
  mediaUrls: z.array(z.string().url()).optional(),
});

export const UpdateMessageSchema = z.object({
  text: z.string().min(1).max(2000),
});

// Notification schemas
export const CreateNotificationSchema = z.object({
  recipientId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  type: z.enum(['like', 'comment', 'follow', 'mention', 'message', 'share']),
  actorId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  entityType: z.enum(['post', 'comment', 'user', 'message']),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  data: z.record(z.any()).optional(),
});

// Search schemas
export const SearchSchema = z.object({
  q: z.string().min(1).max(100),
  type: z.enum(['users', 'posts', 'hashtags', 'all']).optional(),
  limit: z.number().min(1).max(50).optional(),
  offset: z.number().min(0).optional(),
});

// Media schemas
export const MediaUploadSchema = z.object({
  type: z.enum(['image', 'video', 'document']),
  fileName: z.string().min(1),
  fileSize: z.number().positive(),
  mimeType: z.string(),
});

// Pagination schemas
export const PaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
});

export const CursorPaginationSchema = z.object({
  limit: z.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Privacy schemas
export const PrivacySettingsSchema = z.object({
  profileVisibility: z.enum(['public', 'friends', 'private']).optional(),
  postsVisibility: z.enum(['public', 'friends', 'private']).optional(),
  friendsListVisible: z.boolean().optional(),
  allowFollowRequests: z.boolean().optional(),
  allowMessages: z.enum(['everyone', 'friends', 'none']).optional(),
});

// Report schemas
export const ReportSchema = z.object({
  entityType: z.enum(['user', 'post', 'comment', 'message']),
  entityId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'copyright', 'other']),
  description: z.string().max(500).optional(),
});

// Type exports
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type FollowUserInput = z.infer<typeof FollowUserSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type LikeInput = z.infer<typeof LikeSchema>;
export type SharePostInput = z.infer<typeof SharePostSchema>;
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;
export type SendMessageInput = z.infer<typeof SendMessageSchema>;
export type UpdateMessageInput = z.infer<typeof UpdateMessageSchema>;
export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type MediaUploadInput = z.infer<typeof MediaUploadSchema>;
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type CursorPaginationInput = z.infer<typeof CursorPaginationSchema>;
export type PrivacySettingsInput = z.infer<typeof PrivacySettingsSchema>;
export type ReportInput = z.infer<typeof ReportSchema>;