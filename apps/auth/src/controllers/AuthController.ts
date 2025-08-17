import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { User, IUser } from '../models/User';
import { redisClient } from '../config/database';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  createError,
  generateHandle,
  CreateUserSchema,
  LoginSchema,
} from '../utils/auth-utils';
import { createLogger } from '../utils/common';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email';
import * as crypto from 'crypto';

const logger = createLogger('auth-service');

export class AuthController {
  async register(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validation = CreateUserSchema.safeParse(req.body);
      if (!validation.success) {
        return next(createError(validation.error as string, 400, 'VALIDATION_ERROR'));
      }

      const { email, password, firstName, lastName, username } = validation.data;

      // Generate handle from username or create one
      const handle = username?.toLowerCase() || generateHandle(firstName, lastName);

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: email.toLowerCase() }, 
          { handle }, 
          ...(username ? [{ username }] : [])
        ],
      });

      if (existingUser) {
        let message = 'User already exists';
        if (existingUser.email === email.toLowerCase()) {
          message = 'Email is already registered';
        } else if (existingUser.handle === handle || (username && existingUser.username === username)) {
          message = 'Username is already taken';
        }
        return next(createError(message, 409, 'USER_EXISTS'));
      }

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');

      // Hash password and create user
      const passwordHash = await hashPassword(password);
      const user = new User({
        email: email.toLowerCase(),
        passwordHash,
        firstName,
        lastName,
        username,
        handle,
        emailVerificationToken,
        providers: ['local'],
        privacySettings: {
          profileVisibility: 'public',
          postsVisibility: 'public',
          friendsListVisible: true,
          allowFollowRequests: true,
          allowMessages: 'everyone',
        },
      });

      await user.save();

      // Generate tokens for immediate login after registration
      const payload = { userId: user._id.toString(), email: user.email };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store refresh token
      user.refreshTokens.push(refreshToken);
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();

      // Send verification email
      if (process.env.NODE_ENV !== 'test') {
        try {
          await sendVerificationEmail(email, emailVerificationToken);
        } catch (emailError) {
          logger.warn('Failed to send verification email', { error: emailError });
        }
      }

      logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        username: user.username,
        handle: user.handle,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email for verification.',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email, username, password } = req.body;

      // Validate input
      if (!password) {
        return next(createError('Password is required', 400, 'VALIDATION_ERROR'));
      }

      if (!email && !username) {
        return next(createError('Email or username is required', 400, 'VALIDATION_ERROR'));
      }

      // Find user by email or username
      const query = email 
        ? { email: email.toLowerCase() }
        : { $or: [{ username }, { handle: username.toLowerCase() }] };

      const user = await User.findOne(query).select('+passwordHash');
      if (!user) {
        return next(createError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
      }

      // Check if user has a password (not OAuth-only user)
      if (!user.passwordHash) {
        return next(createError('Please use Google OAuth to sign in', 401, 'OAUTH_REQUIRED'));
      }

      // Check if user is active
      if (!user.isActive) {
        return next(createError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED'));
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.passwordHash);
      if (!isPasswordValid) {
        return next(createError('Invalid credentials', 401, 'INVALID_CREDENTIALS'));
      }

      // Generate tokens
      const payload = { userId: user._id.toString(), email: user.email };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store refresh token
      user.refreshTokens.push(refreshToken);
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();

      // Cache user session (optional - continue if Redis fails)
      try {
        await redisClient.setEx(
          `user_session:${user._id}`,
          3600, // 1 hour
          JSON.stringify({
            userId: user._id,
            email: user.email,
            isOnline: true,
            lastSeen: new Date(),
          })
        );
      } catch (redisError) {
        logger.warn('Failed to cache user session in Redis:', redisError);
        // Continue without Redis caching
      }

      logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email,
        username: user.username || user.handle,
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async googleAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // This is handled by passport middleware
    // Just redirect to Google OAuth
  }

  async googleCallback(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = req.user as any as IUser;
      
      if (!user) {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
      }

      // Generate tokens
      const payload = { userId: user._id.toString(), email: user.email };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store refresh token
      user.refreshTokens.push(refreshToken);
      user.isOnline = true;
      user.lastSeen = new Date();
      await user.save();

      // Cache user session
      await redisClient.setEx(
        `user_session:${user._id}`,
        3600,
        JSON.stringify({
          userId: user._id,
          email: user.email,
          isOnline: true,
          lastSeen: new Date(),
        })
      );

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?token=${accessToken}&refresh=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
    }
  }

  async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return next(createError('Refresh token is required', 400, 'MISSING_TOKEN'));
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      
      // Find user and check if refresh token is valid
      const user = await User.findById(payload.userId);
      if (!user || !user.refreshTokens.includes(refreshToken)) {
        return next(createError('Invalid refresh token', 401, 'INVALID_TOKEN'));
      }

      // Generate new tokens
      const newPayload = { userId: user._id.toString(), email: user.email };
      const accessToken = generateAccessToken(newPayload);
      const newRefreshToken = generateRefreshToken(newPayload);

      // Replace refresh token
      user.refreshTokens = user.refreshTokens.filter(token => token !== refreshToken);
      user.refreshTokens.push(newRefreshToken);
      await user.save();

      res.json({
        success: true,
        data: {
          tokens: {
            accessToken,
            refreshToken: newRefreshToken,
            expiresIn: 15 * 60, // 15 minutes
          },
        },
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      next(createError('Invalid refresh token', 401, 'INVALID_TOKEN'));
    }
  }

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const userId = req.user?.userId;

      if (refreshToken && userId) {
        // Remove refresh token from user
        await User.findByIdAndUpdate(userId, {
          $pull: { refreshTokens: refreshToken },
          isOnline: false,
          lastSeen: new Date(),
        });

        // Remove user session from cache
        await redisClient.del(`user_session:${userId}`);
      }

      logger.info('User logged out successfully', { userId });

      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async verifyEmail(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;

      const user = await User.findOne({ emailVerificationToken: token });
      if (!user) {
        return next(createError('Invalid verification token', 400, 'INVALID_TOKEN'));
      }

      user.emailVerified = true;
      user.emailVerificationToken = undefined;
      await user.save();

      // Send welcome email
      if (process.env.NODE_ENV !== 'test') {
        try {
          await sendWelcomeEmail(user.email, user.firstName);
        } catch (emailError) {
          logger.warn('Failed to send welcome email', { error: emailError });
        }
      }

      logger.info('Email verified successfully', {
        userId: user._id,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Email verified successfully',
      });
    } catch (error) {
      logger.error('Email verification error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async forgotPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists or not
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
        });
      }

      // Check if user has a password (not OAuth-only user)
      if (!user.passwordHash) {
        return res.json({
          success: true,
          message: 'If the email exists, a password reset link has been sent.',
        });
      }

      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = resetExpires;
      await user.save();

      // Send password reset email
      if (process.env.NODE_ENV !== 'test') {
        try {
          await sendPasswordResetEmail(email, resetToken);
        } catch (emailError) {
          logger.warn('Failed to send password reset email', { error: emailError });
        }
      }

      logger.info('Password reset requested', {
        userId: user._id,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent.',
      });
    } catch (error) {
      logger.error('Forgot password error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { password } = req.body;

      if (!password || password.length < 8) {
        return next(createError('Password must be at least 8 characters', 400, 'INVALID_PASSWORD'));
      }

      const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });

      if (!user) {
        return next(createError('Invalid or expired reset token', 400, 'INVALID_TOKEN'));
      }

      // Hash new password
      const passwordHash = await hashPassword(password);

      user.passwordHash = passwordHash;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.refreshTokens = []; // Invalidate all refresh tokens
      await user.save();

      logger.info('Password reset successfully', {
        userId: user._id,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      logger.error('Reset password error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      res.json({
        success: true,
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Get me error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }
}