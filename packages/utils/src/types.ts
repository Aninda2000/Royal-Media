// Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
    total?: number;
  };
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CursorPaginationMeta {
  limit: number;
  hasNext: boolean;
  nextCursor?: string;
}

// User types
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  handle: string;
  bio?: string;
  location?: string;
  website?: string;
  workplace?: string;
  education?: string;
  avatarUrl?: string;
  coverUrl?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isVerified: boolean;
  isPrivate: boolean;
  isOnline: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isBlocked?: boolean;
  mutualFollowersCount?: number;
  canMessage?: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  postsVisibility: 'public' | 'friends' | 'private';
  friendsListVisible: boolean;
  allowFollowRequests: boolean;
  allowMessages: 'everyone' | 'friends' | 'none';
}

// Post types
export interface Post {
  _id: string;
  authorId: string;
  author?: User;
  text: string;
  mediaUrls: string[];
  hashtags: string[];
  mentions: string[];
  visibility: 'public' | 'friends' | 'private';
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isShared?: boolean;
  originalPost?: Post; // For reposts
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  _id: string;
  postId: string;
  authorId: string;
  author?: User;
  text: string;
  likeCount: number;
  replyCount: number;
  parentCommentId?: string;
  isLiked?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message types
export interface Conversation {
  _id: string;
  type: 'direct' | 'group';
  participantIds: string[];
  participants?: User[];
  name?: string;
  avatarUrl?: string;
  lastMessage?: Message;
  lastMessageAt: Date;
  unreadCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  text: string;
  mediaUrls: string[];
  readBy: {
    userId: string;
    readAt: Date;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export interface Notification {
  _id: string;
  recipientId: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'message' | 'share';
  actorId: string;
  actor?: User;
  entityType: 'post' | 'comment' | 'user' | 'message';
  entityId: string;
  entity?: Post | Comment | Message;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Media types
export interface Media {
  _id: string;
  ownerId: string;
  url: string;
  thumbnailUrl?: string;
  type: 'image' | 'video' | 'document';
  fileName: string;
  fileSize: number;
  mimeType: string;
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
  createdAt: Date;
}

export interface MediaUploadResponse {
  url: string;
  uploadUrl: string;
  thumbnailUrl?: string;
  key: string;
  type: 'image' | 'video' | 'document';
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Socket types
export interface SocketUser {
  userId: string;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface PresenceUpdate {
  userId: string;
  isOnline: boolean;
  lastSeen: Date;
}

// Search types
export interface SearchResult {
  users?: User[];
  posts?: Post[];
  hashtags?: {
    tag: string;
    count: number;
  }[];
  total: number;
  hasMore: boolean;
}

// Feed types
export interface FeedPost extends Post {
  reason?: 'following' | 'suggested' | 'trending' | 'repost';
  score?: number;
}

// Activity types
export interface Activity {
  _id: string;
  userId: string;
  type: 'post_created' | 'post_liked' | 'user_followed' | 'comment_created' | 'post_shared';
  entityId: string;
  data?: Record<string, any>;
  createdAt: Date;
}

// Analytics types
export interface UserAnalytics {
  profileViews: number;
  postImpressions: number;
  engagementRate: number;
  followersGrowth: number;
  topPosts: Post[];
}

export interface PostAnalytics {
  impressions: number;
  engagements: number;
  reach: number;
  clicks: number;
  saves: number;
}

// Report types
export interface Report {
  _id: string;
  reporterId: string;
  entityType: 'user' | 'post' | 'comment' | 'message';
  entityId: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'copyright' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: Date;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

// Health check types
export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  version: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected';
    redis: 'connected' | 'disconnected';
    storage: 'available' | 'unavailable';
  };
}

// Feature flags
export interface FeatureFlags {
  enableStories: boolean;
  enableLiveStreaming: boolean;
  enableMarketplace: boolean;
  enableGroups: boolean;
  enableEvents: boolean;
}

// Hashtag types
export interface Hashtag {
  _id: string;
  tag: string;
  count: number;
  trending: boolean;
  lastUsed: Date;
  createdAt: Date;
}

// Friend request types
export interface FriendRequest {
  _id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

// Block types
export interface Block {
  _id: string;
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}