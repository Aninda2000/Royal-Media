import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { createError, hashPassword, generateRandomPassword } from '../utils/auth-utils';
import { createLogger } from '../utils/common';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email';

const logger = createLogger('admin-controller');

export class AdminController {
  async getUsers(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        role,
        isActive,
        isVerified,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = Math.min(parseInt(limit as string), 100);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query
      const filterQuery: any = {};

      if (search) {
        filterQuery.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      if (role) {
        filterQuery.role = role;
      }

      if (isActive !== undefined) {
        filterQuery.isActive = isActive === 'true';
      }

      if (isVerified !== undefined) {
        filterQuery.isVerified = isVerified === 'true';
      }

      // Build sort query
      const sortQuery: any = {};
      sortQuery[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      // Execute query
      const [users, totalUsers, stats] = await Promise.all([
        User.find(filterQuery)
          .select('-passwordHash -refreshTokens -emailVerificationToken -passwordResetToken')
          .sort(sortQuery)
          .skip(skip)
          .limit(limitNum),
        User.countDocuments(filterQuery),
        User.aggregate([
          {
            $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              activeUsers: {
                $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
              },
              verifiedUsers: {
                $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
              },
            }
          }
        ])
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
          stats: stats[0] || {
            totalUsers: 0,
            activeUsers: 0,
            verifiedUsers: 0,
          },
        },
      });
    } catch (error) {
      logger.error('Get users error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const {
        email,
        username,
        firstName,
        lastName,
        role = 'user',
        isVerified = false,
      } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existingUser) {
        return next(createError('User with this email or username already exists', 409, 'USER_EXISTS'));
      }

      // Generate random password
      const temporaryPassword = generateRandomPassword();
      const passwordHash = await hashPassword(temporaryPassword);

      // Create user
      const user = new User({
        email,
        username,
        firstName,
        lastName,
        role,
        isVerified,
        passwordHash,
        isActive: true,
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

      // Send welcome email with temporary password
      if (process.env.NODE_ENV !== 'test') {
        try {
          await sendWelcomeEmail(email, firstName, temporaryPassword);
        } catch (emailError) {
          logger.warn('Failed to send welcome email', { error: emailError });
        }
      }

      logger.info('User created by admin', {
        adminId: req.user?.userId,
        createdUserId: user._id,
        email: user.email,
        role: user.role,
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          user: {
            _id: user._id,
            email: user.email,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
          },
          temporaryPassword, // Only shown once
        },
      });
    } catch (error) {
      logger.error('Create user error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async getUserDetails(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId)
        .select('-passwordHash -refreshTokens -emailVerificationToken -passwordResetToken');

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      res.json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Get user details error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const adminRole = req.user?.role;

      // Super admin check for admin role assignment
      if (role === 'admin' && adminRole !== 'super_admin') {
        return next(createError('Only super admin can assign admin role', 403, 'INSUFFICIENT_PERMISSIONS'));
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          role,
          updatedAt: new Date(),
        },
        { new: true, runValidators: true }
      ).select('-passwordHash -refreshTokens');

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('User role updated by admin', {
        adminId: req.user?.userId,
        targetUserId: userId,
        oldRole: user.role,
        newRole: role,
      });

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Update user role error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async activateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isActive: true,
          deactivatedAt: undefined,
          updatedAt: new Date(),
        },
        { new: true }
      ).select('-passwordHash -refreshTokens');

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('User activated by admin', {
        adminId: req.user?.userId,
        targetUserId: userId,
      });

      res.json({
        success: true,
        message: 'User activated successfully',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Activate user error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async deactivateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Prevent deactivating super admin
      const targetUser = await User.findById(userId);
      if (targetUser?.role === 'super_admin') {
        return next(createError('Cannot deactivate super admin', 403, 'CANNOT_DEACTIVATE_SUPER_ADMIN'));
      }

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isActive: false,
          deactivatedAt: new Date(),
          refreshTokens: [], // Invalidate all sessions
          updatedAt: new Date(),
        },
        { new: true }
      ).select('-passwordHash -refreshTokens');

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('User deactivated by admin', {
        adminId: req.user?.userId,
        targetUserId: userId,
      });

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Deactivate user error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async verifyUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      const user = await User.findByIdAndUpdate(
        userId,
        {
          isVerified: true,
          emailVerificationToken: undefined,
          updatedAt: new Date(),
        },
        { new: true }
      ).select('-passwordHash -refreshTokens');

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('User verified by admin', {
        adminId: req.user?.userId,
        targetUserId: userId,
      });

      res.json({
        success: true,
        message: 'User verified successfully',
        data: {
          user,
        },
      });
    } catch (error) {
      logger.error('Verify user error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      // Prevent deleting super admin
      const targetUser = await User.findById(userId);
      if (targetUser?.role === 'super_admin') {
        return next(createError('Cannot delete super admin', 403, 'CANNOT_DELETE_SUPER_ADMIN'));
      }

      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        return next(createError('User not found', 404, 'USER_NOT_FOUND'));
      }

      logger.info('User deleted by admin', {
        adminId: req.user?.userId,
        deletedUserId: userId,
        deletedUserEmail: user.email,
      });

      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const [userStats, roleStats, recentActivity] = await Promise.all([
        // User statistics
        User.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: {
                $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
              },
              verified: {
                $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
              },
              newToday: {
                $sum: {
                  $cond: [
                    {
                      $gte: [
                        '$createdAt',
                        new Date(new Date().setHours(0, 0, 0, 0))
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              newThisWeek: {
                $sum: {
                  $cond: [
                    {
                      $gte: [
                        '$createdAt',
                        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
              newThisMonth: {
                $sum: {
                  $cond: [
                    {
                      $gte: [
                        '$createdAt',
                        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                      ]
                    },
                    1,
                    0
                  ]
                }
              },
            }
          }
        ]),

        // Role distribution
        User.aggregate([
          {
            $group: {
              _id: '$role',
              count: { $sum: 1 }
            }
          }
        ]),

        // Recent user registrations
        User.find()
          .select('firstName lastName email createdAt')
          .sort({ createdAt: -1 })
          .limit(10)
      ]);

      const stats = userStats[0] || {
        total: 0,
        active: 0,
        verified: 0,
        newToday: 0,
        newThisWeek: 0,
        newThisMonth: 0,
      };

      const roles = roleStats.reduce((acc: any, role: any) => {
        acc[role._id] = role.count;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          users: stats,
          roles,
          recentActivity,
        },
      });
    } catch (error) {
      logger.error('Get stats error:', error);
      next(createError('Internal server error', 500, 'INTERNAL_ERROR'));
    }
  }
}