import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  _id: string;
  recipientId: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'mention' | 'post' | 'friend_request' | 'system';
  title: string;
  message: string;
  actorId?: string; // User who performed the action
  entityType?: 'post' | 'comment' | 'user' | 'conversation' | 'message';
  entityId?: string; // ID of the related entity
  data?: Record<string, any>; // Additional metadata
  readAt?: Date;
  clickedAt?: Date;
  emailSent?: boolean;
  pushSent?: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  recipientId: {
    type: String,
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['like', 'comment', 'follow', 'message', 'mention', 'post', 'friend_request', 'system'],
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 200,
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },
  actorId: {
    type: String,
    index: true,
  },
  entityType: {
    type: String,
    enum: ['post', 'comment', 'user', 'conversation', 'message'],
  },
  entityId: {
    type: String,
    index: true,
  },
  data: {
    type: Schema.Types.Mixed,
    default: {},
  },
  readAt: {
    type: Date,
  },
  clickedAt: {
    type: Date,
  },
  emailSent: {
    type: Boolean,
    default: false,
  },
  pushSent: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }, // TTL index
  },
}, {
  timestamps: true,
});

// Indexes
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ actorId: 1, entityType: 1, entityId: 1 });

export const Notification = mongoose.model<INotification>('Notification', notificationSchema);