import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  passwordHash?: string; // Optional for OAuth users
  firstName: string;
  lastName: string;
  handle: string;
  username?: string; // Added missing field
  role: string; // Added missing field
  isActive: boolean; // Added missing field
  profileImage?: string; // Added missing field
  coverImage?: string; // Added missing field
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
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshTokens: string[];
  // OAuth fields
  googleId?: string;
  providers: string[];
  // Privacy settings
  privacySettings: {
    profileVisibility: 'public' | 'friends' | 'private';
    postsVisibility: 'public' | 'friends' | 'private';
    friendsListVisible: boolean;
    allowFollowRequests: boolean;
    allowMessages: 'everyone' | 'friends' | 'none';
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: function() {
        return !this.googleId; // Only required if not OAuth user
      },
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    handle: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]{3,30}$/,
      index: true,
    },
    username: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'super_admin', 'moderator'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    profileImage: {
      type: String,
      default: null,
    },
    coverImage: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    location: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    website: {
      type: String,
      maxlength: 200,
      trim: true,
    },
    workplace: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    education: {
      type: String,
      maxlength: 100,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    coverUrl: {
      type: String,
      default: null,
    },
    followersCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    followingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    postsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      sparse: true,
    },
    passwordResetToken: {
      type: String,
      sparse: true,
    },
    passwordResetExpires: {
      type: Date,
    },
    refreshTokens: [{
      type: String,
    }],
    // OAuth fields
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    providers: [{
      type: String,
      enum: ['local', 'google'],
    }],
    // Privacy settings
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public',
      },
      postsVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public',
      },
      friendsListVisible: {
        type: Boolean,
        default: true,
      },
      allowFollowRequests: {
        type: Boolean,
        default: true,
      },
      allowMessages: {
        type: String,
        enum: ['everyone', 'friends', 'none'],
        default: 'everyone',
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc: any, ret: any) => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.passwordHash;
        delete ret.refreshTokens;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ handle: 1 });
UserSchema.index({ googleId: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isVerified: 1, isActive: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Method to safely return user data
UserSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  delete userObject.passwordHash;
  delete userObject.refreshTokens;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  return userObject;
};

export const User = model<IUser>('User', UserSchema);