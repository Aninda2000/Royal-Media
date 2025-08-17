import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { Post, Comment, Like, Bookmark, Share } from '../models/Post';
import { createError, extractHashtags, extractMentions, sanitizeContent, paginate, formatTimeAgo } from '../utils/common';
import { createLogger } from '../utils/common';
import { redisClient } from '../config/database';

const logger = createLogger('posts-service');

export class PostsController {
  // Create a new post
  async createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return next(createError('User not authenticated', 401, 'UNAUTHORIZED'));
      }

      const { content, images, videos, location, isPublic = true } = req.body;

      if (!content || content.trim().length === 0) {
        return next(createError('Post content is required', 400, 'CONTENT_REQUIRED'));
      }

      const sanitizedContent = sanitizeContent(content);
      const hashtags = extractHashtags(sanitizedContent);
      const mentions = extractMentions(sanitizedContent);

      const post = new Post({
        author: userId,
        content: sanitizedContent,
        images: images || [],
        videos: videos || [],
        hashtags,
        mentions,
        location,
        isPublic,
      });

      await post.save();
      await post.populate('author', 'firstName lastName username handle profileImage isVerified');

      logger.info('Post created successfully', {
        postId: post._id,
        userId,
        hashtags: hashtags.length,
        mentions: mentions.length,
      });

      res.status(201).json({
        success: true,
        message: 'Post created successfully',
        data: { post },
      });
    } catch (error) {
      logger.error('Create post error:', error);
      next(createError('Failed to create post', 500, 'CREATE_POST_ERROR'));
    }
  }

  // Get feed posts
  async getFeed(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { page = 1, limit = 20 } = req.query;
      const { page: normalizedPage, limit: normalizedLimit, skip } = paginate(
        Number(page),
        Number(limit)
      );

      // For now, show all public posts. In a real app, you'd filter by following
      const query = {
        isDeleted: false,
        isPublic: true,
      };

      const posts = await Post.find(query)
        .populate('author', 'firstName lastName username handle profileImage isVerified')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .lean();

      const totalPosts = await Post.countDocuments(query);
      const hasMore = skip + posts.length < totalPosts;

      // Add user interaction data if authenticated
      if (userId) {
        for (const post of posts) {
          (post as any).isLiked = post.likes.some(like => like.toString() === userId);
          (post as any).isBookmarked = await Bookmark.exists({ user: userId, post: post._id });
        }
      }

      // Format timestamps
      const formattedPosts = posts.map(post => ({
        ...post,
        timeAgo: formatTimeAgo(new Date(post.createdAt)),
      }));

      res.json({
        success: true,
        data: {
          posts: formattedPosts,
          pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total: totalPosts,
            hasMore,
          },
        },
      });
    } catch (error) {
      logger.error('Get feed error:', error);
      next(createError('Failed to fetch feed', 500, 'FETCH_FEED_ERROR'));
    }
  }

  // Get a specific post
  async getPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const userId = req.user?.userId;

      const post = await Post.findOne({ _id: postId, isDeleted: false })
        .populate('author', 'firstName lastName username handle profileImage isVerified')
        .lean();

      if (!post) {
        return next(createError('Post not found', 404, 'POST_NOT_FOUND'));
      }

      // Check if user can view the post
      if (!post.isPublic && post.author._id.toString() !== userId) {
        return next(createError('Post not found', 404, 'POST_NOT_FOUND'));
      }

      // Add user interaction data if authenticated
      if (userId) {
        (post as any).isLiked = post.likes.some(like => like.toString() === userId);
        (post as any).isBookmarked = await Bookmark.exists({ user: userId, post: post._id });
      }

      res.json({
        success: true,
        data: { post },
      });
    } catch (error) {
      logger.error('Get post error:', error);
      next(createError('Failed to fetch post', 500, 'FETCH_POST_ERROR'));
    }
  }

  // Like/unlike a post
  async toggleLike(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;

      if (!userId) {
        return next(createError('User not authenticated', 401, 'UNAUTHORIZED'));
      }

      const post = await Post.findOne({ _id: postId, isDeleted: false });
      if (!post) {
        return next(createError('Post not found', 404, 'POST_NOT_FOUND'));
      }

      const existingLike = await Like.findOne({ user: userId, post: postId });

      if (existingLike) {
        // Unlike
        await Like.deleteOne({ _id: existingLike._id });
        await Post.findByIdAndUpdate(postId, {
          $pull: { likes: userId },
          $inc: { likesCount: -1 },
        });

        logger.info('Post unliked', { postId, userId });

        res.json({
          success: true,
          message: 'Post unliked',
          data: { liked: false },
        });
      } else {
        // Like
        const like = new Like({ user: userId, post: postId });
        await like.save();

        await Post.findByIdAndUpdate(postId, {
          $addToSet: { likes: userId },
          $inc: { likesCount: 1 },
        });

        logger.info('Post liked', { postId, userId });

        res.json({
          success: true,
          message: 'Post liked',
          data: { liked: true },
        });
      }
    } catch (error) {
      logger.error('Toggle like error:', error);
      next(createError('Failed to toggle like', 500, 'TOGGLE_LIKE_ERROR'));
    }
  }

  // Bookmark/unbookmark a post
  async toggleBookmark(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;

      if (!userId) {
        return next(createError('User not authenticated', 401, 'UNAUTHORIZED'));
      }

      const post = await Post.findOne({ _id: postId, isDeleted: false });
      if (!post) {
        return next(createError('Post not found', 404, 'POST_NOT_FOUND'));
      }

      const existingBookmark = await Bookmark.findOne({ user: userId, post: postId });

      if (existingBookmark) {
        // Remove bookmark
        await Bookmark.deleteOne({ _id: existingBookmark._id });
        await Post.findByIdAndUpdate(postId, {
          $pull: { bookmarks: existingBookmark._id },
          $inc: { bookmarksCount: -1 },
        });

        res.json({
          success: true,
          message: 'Bookmark removed',
          data: { bookmarked: false },
        });
      } else {
        // Add bookmark
        const bookmark = new Bookmark({ user: userId, post: postId });
        await bookmark.save();

        await Post.findByIdAndUpdate(postId, {
          $addToSet: { bookmarks: bookmark._id },
          $inc: { bookmarksCount: 1 },
        });

        res.json({
          success: true,
          message: 'Post bookmarked',
          data: { bookmarked: true },
        });
      }
    } catch (error) {
      logger.error('Toggle bookmark error:', error);
      next(createError('Failed to toggle bookmark', 500, 'TOGGLE_BOOKMARK_ERROR'));
    }
  }

  // Add comment to a post
  async addComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;
      const { content, parentCommentId } = req.body;

      if (!userId) {
        return next(createError('User not authenticated', 401, 'UNAUTHORIZED'));
      }

      if (!content || content.trim().length === 0) {
        return next(createError('Comment content is required', 400, 'CONTENT_REQUIRED'));
      }

      const post = await Post.findOne({ _id: postId, isDeleted: false });
      if (!post) {
        return next(createError('Post not found', 404, 'POST_NOT_FOUND'));
      }

      const sanitizedContent = sanitizeContent(content);

      const comment = new Comment({
        post: postId,
        author: userId,
        content: sanitizedContent,
        parentComment: parentCommentId || undefined,
      });

      await comment.save();
      await comment.populate('author', 'firstName lastName username handle profileImage');

      // Update post comment count
      await Post.findByIdAndUpdate(postId, {
        $addToSet: { comments: comment._id },
        $inc: { commentsCount: 1 },
      });

      res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: { comment },
      });
    } catch (error) {
      logger.error('Add comment error:', error);
      next(createError('Failed to add comment', 500, 'ADD_COMMENT_ERROR'));
    }
  }

  // Get comments for a post
  async getComments(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const { page: normalizedPage, limit: normalizedLimit, skip } = paginate(
        Number(page),
        Number(limit)
      );

      const post = await Post.findOne({ _id: postId, isDeleted: false });
      if (!post) {
        return next(createError('Post not found', 404, 'POST_NOT_FOUND'));
      }

      const comments = await Comment.find({ post: postId, isDeleted: false })
        .populate('author', 'firstName lastName username handle profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(normalizedLimit)
        .lean();

      const totalComments = await Comment.countDocuments({ post: postId, isDeleted: false });
      const hasMore = skip + comments.length < totalComments;

      res.json({
        success: true,
        data: {
          comments,
          pagination: {
            page: normalizedPage,
            limit: normalizedLimit,
            total: totalComments,
            hasMore,
          },
        },
      });
    } catch (error) {
      logger.error('Get comments error:', error);
      next(createError('Failed to fetch comments', 500, 'FETCH_COMMENTS_ERROR'));
    }
  }

  // Delete a post
  async deletePost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const { postId } = req.params;

      if (!userId) {
        return next(createError('User not authenticated', 401, 'UNAUTHORIZED'));
      }

      const post = await Post.findOne({ _id: postId, isDeleted: false });
      if (!post) {
        return next(createError('Post not found', 404, 'POST_NOT_FOUND'));
      }

      // Check if user owns the post
      if (post.author.toString() !== userId) {
        return next(createError('Not authorized to delete this post', 403, 'FORBIDDEN'));
      }

      // Soft delete
      await Post.findByIdAndUpdate(postId, { isDeleted: true });

      logger.info('Post deleted', { postId, userId });

      res.json({
        success: true,
        message: 'Post deleted successfully',
      });
    } catch (error) {
      logger.error('Delete post error:', error);
      next(createError('Failed to delete post', 500, 'DELETE_POST_ERROR'));
    }
  }

  // Get trending hashtags
  async getTrendingHashtags(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { limit = 10 } = req.query;

      // Aggregate hashtags from recent posts (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const trendingHashtags = await Post.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo },
            isDeleted: false,
            isPublic: true,
            hashtags: { $exists: true, $ne: [] },
          },
        },
        { $unwind: '$hashtags' },
        {
          $group: {
            _id: '$hashtags',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: Number(limit) },
        {
          $project: {
            hashtag: '$_id',
            count: 1,
            _id: 0,
          },
        },
      ]);

      res.json({
        success: true,
        data: { hashtags: trendingHashtags },
      });
    } catch (error) {
      logger.error('Get trending hashtags error:', error);
      next(createError('Failed to fetch trending hashtags', 500, 'FETCH_TRENDING_ERROR'));
    }
  }
}