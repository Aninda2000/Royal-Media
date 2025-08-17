import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { JWTPayload } from './types';

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

// JWT utilities
export const generateAccessToken = (payload: {
  userId: string;
  email: string;
}): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
};

export const generateRefreshToken = (payload: {
  userId: string;
  email: string;
}): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
};

// ObjectId utilities
export const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id);
};

export const toObjectId = (id: string): Types.ObjectId => {
  return new Types.ObjectId(id);
};

// String utilities
export const generateHandle = (firstName: string, lastName: string): string => {
  const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
  const random = Math.floor(Math.random() * 1000);
  return `${base}${random}`;
};

export const extractHashtags = (text: string): string[] => {
  const hashtags = text.match(/#[a-zA-Z0-9_]+/g);
  return hashtags ? hashtags.map(tag => tag.substring(1).toLowerCase()) : [];
};

export const extractMentions = (text: string): string[] => {
  const mentions = text.match(/@[a-zA-Z0-9_]+/g);
  return mentions ? mentions.map(mention => mention.substring(1).toLowerCase()) : [];
};

export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with single
};

// Date utilities
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  if (diffInWeeks < 4) return `${diffInWeeks}w`;
  if (diffInMonths < 12) return `${diffInMonths}mo`;
  return `${diffInYears}y`;
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

export const isThisWeek = (date: Date): boolean => {
  const now = new Date();
  const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
  return date >= weekStart;
};

// Array utilities
export const chunk = <T>(array: T[], size: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

export const shuffle = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Validation utilities
export const isEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

export const isValidHandle = (handle: string): boolean => {
  const handleRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return handleRegex.test(handle);
};

// Pagination utilities
export const calculatePagination = (
  total: number,
  limit: number,
  offset: number
) => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;
  
  return {
    total,
    limit,
    offset,
    totalPages,
    currentPage,
    hasNext: offset + limit < total,
    hasPrev: offset > 0,
  };
};

export const calculateCursorPagination = (
  items: any[],
  limit: number,
  cursorField: string = '_id'
) => {
  const hasNext = items.length > limit;
  const data = hasNext ? items.slice(0, -1) : items;
  const nextCursor = hasNext ? data[data.length - 1][cursorField].toString() : null;
  
  return {
    data,
    hasNext,
    nextCursor,
  };
};

// Error utilities
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'GENERIC_ERROR';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const createError = (
  message: string,
  statusCode: number,
  code?: string
): AppError => {
  return new AppError(message, statusCode, code);
};

// File utilities
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const generateFileName = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = getFileExtension(originalName);
  return `${timestamp}_${random}.${extension}`;
};

export const isImageFile = (mimetype: string): boolean => {
  return mimetype.startsWith('image/');
};

export const isVideoFile = (mimetype: string): boolean => {
  return mimetype.startsWith('video/');
};

export const getFileSizeString = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Rate limiting utilities
export const generateRateLimitKey = (
  identifier: string,
  action: string,
  window?: string
): string => {
  const windowSuffix = window ? `_${window}` : '';
  return `rate_limit:${action}:${identifier}${windowSuffix}`;
};

// Cache utilities
export const generateCacheKey = (...parts: string[]): string => {
  return parts.join(':');
};

export const calculateCacheTTL = (type: 'short' | 'medium' | 'long'): number => {
  switch (type) {
    case 'short':
      return 5 * 60; // 5 minutes
    case 'medium':
      return 60 * 60; // 1 hour
    case 'long':
      return 24 * 60 * 60; // 24 hours
    default:
      return 15 * 60; // 15 minutes
  }
};

// Privacy utilities
export const canViewProfile = (
  viewer: any,
  target: any,
  isFollowing: boolean
): boolean => {
  if (!target.isPrivate) return true;
  if (viewer && viewer._id.toString() === target._id.toString()) return true;
  if (target.isPrivate && !isFollowing) return false;
  return true;
};

export const canViewPost = (
  viewer: any,
  post: any,
  isFollowing: boolean
): boolean => {
  if (post.visibility === 'public') return true;
  if (viewer && viewer._id.toString() === post.authorId.toString()) return true;
  if (post.visibility === 'friends' && isFollowing) return true;
  return false;
};

// Search utilities
export const normalizeSearchQuery = (query: string): string => {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
};

export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};

// Social utilities
export const calculateEngagementRate = (
  likes: number,
  comments: number,
  shares: number,
  impressions: number
): number => {
  if (impressions === 0) return 0;
  return ((likes + comments + shares) / impressions) * 100;
};

export const generateSuggestionScore = (
  mutualFollowers: number,
  commonInterests: number,
  recentActivity: number
): number => {
  return (mutualFollowers * 0.5) + (commonInterests * 0.3) + (recentActivity * 0.2);
};