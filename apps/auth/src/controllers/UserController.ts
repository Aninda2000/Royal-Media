import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { createError, hashPassword, comparePassword } from '../utils/auth-utils';
import { createLogger } from '../utils/common';

const logger = createLogger('user-controller');

export class UserController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
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
      logger.error('Get profile error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const updates = req.body;

      // Remove sensitive fields that shouldn't be updated
      const allowedUpdates = [
        'firstName',
        'lastName',
        'bio',
        'location',
        'website',
        'dateOfBirth',
        'profileImage',
        'coverImage',
      ];

      const filteredUpdates: any = {};
      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          ...filteredUpdates,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('Profile updated successfully', {
        userId: user._id,
        updatedFields: Object.keys(filteredUpdates),
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { currentPassword, password } = req.body;

      const user = await User.findById(userId).select('+passwordHash');
      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      // Check if user has a password (not OAuth-only user)
      if (!user.passwordHash) {
        return next(createError('Cannot change password for OAuth-only accounts', 400, 'OAUTH_ACCOUNT'));
      }

      // Verify current password
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return next(createError('Current password is incorrect', 400, 'INVALID_PASSWORD'));
      }

      // Hash new password
      const newPasswordHash = await hashPassword(password);

      // Update password and invalidate all refresh tokens
      user.passwordHash = newPasswordHash;
      user.refreshTokens = [];
      user.updatedAt = new Date();
      await user.save();

      logger.info('Password changed successfully', {
        userId: user._id,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Password changed successfully. Please log in again.',
      });
    } catch (error) {
      logger.error('Change password error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      // Return public profile information only
      const publicProfile = {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        bio: user.bio,
        location: user.location,
        website: user.website,
        profileImage: user.profileImage,
        coverImage: user.coverImage,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        // Add privacy-controlled fields based on user's privacy settings
      };

      res.json({
        success: true,
        data: {
          user: publicProfile,
        },
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        search = '',
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const skip = (pageNum - 1) * limitNum;

      // Build search query
      const searchQuery: any = {
        isActive: true,
      };

      if (search) {
        searchQuery.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      // Build sort query
      const sortQuery: any = {};
      sortQuery[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      // Execute search
      const [users, totalUsers] = await Promise.all([
        User.find(searchQuery)
          .select('firstName lastName username bio location profileImage isVerified createdAt')
          .sort(sortQuery)
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(searchQuery),
      ]);

      const totalPages = Math.ceil(totalUsers / limitNum);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: pageNum,
            limit: limitNum,
            totalUsers,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
          },
        },
      });
    } catch (error) {
      logger.error('Search users error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async deactivateAccount(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isActive: false,
          deactivatedAt: new Date(),
          refreshTokens: [], // Invalidate all refresh tokens
        },
        { new: true }
      );

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('Account deactivated', {
        userId: user._id,
        email: user.email,
      });

      res.json({
        success: true,
        message: 'Account deactivated successfully',
      });
    } catch (error) {
      logger.error('Deactivate account error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async uploadProfileImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const file = req.file;

      if (!file) {
        return next(createError('No file uploaded', 400, 'NO_FILE'));
      }

      // In a real implementation, you would upload to AWS S3 or similar
      // For now, we'll just store the filename
      const imageUrl = `/uploads/profiles/${file.filename}`;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          profileImage: imageUrl,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('Profile image uploaded', {
        userId: user._id,
        imageUrl,
      });

      res.json({
        success: true,
        message: 'Profile image updated successfully',
        data: {
          imageUrl,
          user: user.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Upload profile image error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async uploadCoverImage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const file = req.file;

      if (!file) {
        return next(createError('No file uploaded', 400, 'NO_FILE'));
      }

      // In a real implementation, you would upload to AWS S3 or similar
      const imageUrl = `/uploads/covers/${file.filename}`;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          coverImage: imageUrl,
          updatedAt: new Date(),
        },
        { new: true }
      );

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('Cover image uploaded', {
        userId: user._id,
        imageUrl,
      });

      res.json({
        success: true,
        message: 'Cover image updated successfully',
        data: {
          imageUrl,
          user: user.toJSON(),
        },
      });
    } catch (error) {
      logger.error('Upload cover image error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }
}