import { Schema, model, Document } from 'mongoose';

export interface IFriendship extends Document {
  _id: string;
  userId1: string;
  userId2: string;
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>(
  {
    userId1: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userId2: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for efficient queries
FriendshipSchema.index({ userId1: 1, userId2: 1 }, { unique: true });
FriendshipSchema.index({ userId1: 1 });
FriendshipSchema.index({ userId2: 1 });
FriendshipSchema.index({ createdAt: -1 });

// Ensure userId1 is always less than userId2 to avoid duplicates
FriendshipSchema.pre('save', function(next) {
  if (this.userId1.toString() > this.userId2.toString()) {
    const temp = this.userId1;
    this.userId1 = this.userId2;
    this.userId2 = temp;
  }
  next();
});

export const Friendship = model<IFriendship>('Friendship', FriendshipSchema);