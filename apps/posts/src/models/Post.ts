import { Schema, model, Document, Types } from 'mongoose';
import './User'; // Import User model to register it with Mongoose

export interface IPost extends Document {
  _id: string;
  author: Types.ObjectId;
  content: string;
  images?: string[];
  videos?: string[];
  hashtags?: string[];
  mentions?: string[];
  likes: Types.ObjectId[];
  comments: Types.ObjectId[];
  shares: Types.ObjectId[];
  bookmarks: Types.ObjectId[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  bookmarksCount: number;
  isPublic: boolean;
  location?: {
    name: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  parentPost?: Types.ObjectId; // For reposts/shares
  originalPost?: Types.ObjectId; // For tracking original post in share chains
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment extends Document {
  _id: string;
  post: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  parentComment?: Types.ObjectId; // For nested comments/replies
  likes: Types.ObjectId[];
  likesCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ILike extends Document {
  _id: string;
  user: Types.ObjectId;
  post?: Types.ObjectId;
  comment?: Types.ObjectId;
  createdAt: Date;
}

export interface IBookmark extends Document {
  _id: string;
  user: Types.ObjectId;
  post: Types.ObjectId;
  createdAt: Date;
}

export interface IShare extends Document {
  _id: string;
  user: Types.ObjectId;
  originalPost: Types.ObjectId;
  sharedPost: Types.ObjectId; // The new post created when sharing
  createdAt: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
      trim: true,
    },
    images: [{
      type: String,
      maxlength: 500,
    }],
    videos: [{
      type: String,
      maxlength: 500,
    }],
    hashtags: [{
      type: String,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]+$/,
    }],
    mentions: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    comments: [{
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    }],
    shares: [{
      type: Schema.Types.ObjectId,
      ref: 'Share',
    }],
    bookmarks: [{
      type: Schema.Types.ObjectId,
      ref: 'Bookmark',
    }],
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    commentsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    sharesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bookmarksCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    location: {
      name: {
        type: String,
        maxlength: 100,
        trim: true,
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
    },
    parentPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      sparse: true,
    },
    originalPost: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      sparse: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

const CommentSchema = new Schema<IComment>(
  {
    post: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Post',
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
      trim: true,
    },
    parentComment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      sparse: true,
    },
    likes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    likesCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
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

const LikeSchema = new Schema<ILike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      sparse: true,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);

const BookmarkSchema = new Schema<IBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Post',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ShareSchema = new Schema<IShare>(
  {
    user: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    originalPost: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Post',
      index: true,
    },
    sharedPost: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Post',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ createdAt: -1 });
PostSchema.index({ hashtags: 1 });
PostSchema.index({ isPublic: 1, isDeleted: 1, createdAt: -1 });
PostSchema.index({ 'location.coordinates': '2dsphere' });

CommentSchema.index({ post: 1, createdAt: -1 });
CommentSchema.index({ author: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1, createdAt: -1 });

LikeSchema.index({ user: 1, post: 1 }, { unique: true, sparse: true });
LikeSchema.index({ user: 1, comment: 1 }, { unique: true, sparse: true });

BookmarkSchema.index({ user: 1, post: 1 }, { unique: true });

ShareSchema.index({ user: 1, originalPost: 1 }, { unique: true });

// Validation to ensure either post or comment is set for likes
LikeSchema.pre('save', function() {
  if (!this.post && !this.comment) {
    throw new Error('Like must be associated with either a post or comment');
  }
  if (this.post && this.comment) {
    throw new Error('Like cannot be associated with both post and comment');
  }
});

export const Post = model<IPost>('Post', PostSchema);
export const Comment = model<IComment>('Comment', CommentSchema);
export const Like = model<ILike>('Like', LikeSchema);
export const Bookmark = model<IBookmark>('Bookmark', BookmarkSchema);
export const Share = model<IShare>('Share', ShareSchema);