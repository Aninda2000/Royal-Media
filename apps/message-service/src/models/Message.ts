import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  mediaUrls?: string[];
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system';
  replyToId?: string; // For message replies
  readBy: Array<{
    userId: string;
    readAt: Date;
  }>;
  editedAt?: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  senderId: {
    type: String,
    required: true,
    index: true,
  },
  text: {
    type: String,
    maxlength: 5000,
  },
  mediaUrls: [{
    type: String,
  }],
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'system'],
    default: 'text',
    required: true,
  },
  replyToId: {
    type: String,
    index: true,
  },
  readBy: [{
    userId: {
      type: String,
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    },
  }],
  editedAt: {
    type: Date,
  },
  deletedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, deletedAt: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', messageSchema);