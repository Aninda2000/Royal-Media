import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  _id: string;
  participantIds: string[];
  type: 'direct' | 'group';
  name?: string; // For group chats
  avatarUrl?: string; // For group chats
  lastMessageAt: Date;
  lastMessage?: {
    text: string;
    senderId: string;
    createdAt: Date;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>({
  participantIds: [{
    type: String,
    required: true,
    index: true,
  }],
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct',
    required: true,
  },
  name: {
    type: String,
    maxlength: 100,
  },
  avatarUrl: {
    type: String,
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  lastMessage: {
    text: {
      type: String,
      maxlength: 1000,
    },
    senderId: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  createdBy: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
conversationSchema.index({ participantIds: 1, lastMessageAt: -1 });
conversationSchema.index({ lastMessageAt: -1 });

export const Conversation = mongoose.model<IConversation>('Conversation', conversationSchema);