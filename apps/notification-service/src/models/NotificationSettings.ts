import mongoose, { Document, Schema } from 'mongoose';

export interface INotificationSettings extends Document {
  userId: string;
  emailNotifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    messages: boolean;
    mentions: boolean;
    posts: boolean;
    friendRequests: boolean;
    system: boolean;
  };
  pushNotifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    messages: boolean;
    mentions: boolean;
    posts: boolean;
    friendRequests: boolean;
    system: boolean;
  };
  inAppNotifications: {
    likes: boolean;
    comments: boolean;
    follows: boolean;
    messages: boolean;
    mentions: boolean;
    posts: boolean;
    friendRequests: boolean;
    system: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string; // Format: "HH:mm"
    endTime: string; // Format: "HH:mm"
    timezone: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  createdAt: Date;
  updatedAt: Date;
}

const notificationSettingsSchema = new Schema<INotificationSettings>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  emailNotifications: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    posts: { type: Boolean, default: false },
    friendRequests: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
  },
  pushNotifications: {
    likes: { type: Boolean, default: false },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    posts: { type: Boolean, default: false },
    friendRequests: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
  },
  inAppNotifications: {
    likes: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
    follows: { type: Boolean, default: true },
    messages: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
    posts: { type: Boolean, default: true },
    friendRequests: { type: Boolean, default: true },
    system: { type: Boolean, default: true },
  },
  quietHours: {
    enabled: { type: Boolean, default: false },
    startTime: { type: String, default: '22:00' },
    endTime: { type: String, default: '08:00' },
    timezone: { type: String, default: 'UTC' },
  },
  frequency: {
    type: String,
    enum: ['immediate', 'hourly', 'daily', 'weekly'],
    default: 'immediate',
  },
}, {
  timestamps: true,
});

export const NotificationSettings = mongoose.model<INotificationSettings>('NotificationSettings', notificationSettingsSchema);