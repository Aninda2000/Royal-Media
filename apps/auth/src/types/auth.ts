import { Request } from 'express';
import { IUser } from '../models/User';

export interface JWTUser {
  userId: string;
  email: string;
  username?: string;
  role?: string;
  isVerified?: boolean;
  iat?: number;
  exp?: number;
}

export interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  filename?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTUser;
  file?: MulterFile;
}

declare global {
  namespace Express {
    interface User {
      userId: string;
      email: string;
      username?: string;
      role?: string;
      isVerified?: boolean;
    }
  }
}