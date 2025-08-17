import mongoose, { Document, Schema } from 'mongoose';

export interface ITypingIndicator extends Document {
  conversationId: string;
  userId: string;
  isTyping: boolean;
  lastTypingAt: Date;
}

const typingIndicatorSchema = new Schema<ITypingIndicator>({
  conversationId: {
    type: String,
    required: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  isTyping: {
    type: Boolean,
    default: false,
  },
  lastTypingAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Compound index for efficient queries
typingIndicatorSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
typingIndicatorSchema.index({ lastTypingAt: 1 }, { expireAfterSeconds: 300 }); // Auto-delete after 5 minutes

export const TypingIndicator = mongoose.model<ITypingIndicator>('TypingIndicator', typingIndicatorSchema);