import { Router } from 'express';
import { PostsController } from '../controllers/PostsController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();
const postsController = new PostsController();

/**
 * @openapi
 * tags:
 *   name: Posts
 *   description: Posts and feed management endpoints
 */

/**
 * @openapi
 * /posts:
 *   post:
 *     tags: [Posts]
 *     summary: Create a new post
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Just launched my new project! 🚀 #coding #project"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["image1.jpg", "image2.jpg"]
 *               videos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["video1.mp4"]
 *               location:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     example: "San Francisco, CA"
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [-122.4194, 37.7749]
 *               isPublic:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Post created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticateToken as any, postsController.createPost as any);

/**
 * @openapi
 * /posts/feed:
 *   get:
 *     tags: [Posts]
 *     summary: Get user feed
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: Feed posts retrieved successfully
 */
router.get('/feed', optionalAuth as any, postsController.getFeed as any);

/**
 * @openapi
 * /posts/trending/hashtags:
 *   get:
 *     tags: [Posts]
 *     summary: Get trending hashtags
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of hashtags to return
 *     responses:
 *       200:
 *         description: Trending hashtags retrieved successfully
 */
router.get('/trending/hashtags', postsController.getTrendingHashtags as any);

/**
 * @openapi
 * /posts/{postId}:
 *   get:
 *     tags: [Posts]
 *     summary: Get a specific post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get('/:postId', optionalAuth as any, postsController.getPost as any);

/**
 * @openapi
 * /posts/{postId}:
 *   delete:
 *     tags: [Posts]
 *     summary: Delete a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Not authorized to delete this post
 *       404:
 *         description: Post not found
 */
router.delete('/:postId', authenticateToken as any, postsController.deletePost as any);

/**
 * @openapi
 * /posts/{postId}/like:
 *   post:
 *     tags: [Posts]
 *     summary: Like or unlike a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Like status toggled successfully
 *       404:
 *         description: Post not found
 */
router.post('/:postId/like', authenticateToken as any, postsController.toggleLike as any);

/**
 * @openapi
 * /posts/{postId}/bookmark:
 *   post:
 *     tags: [Posts]
 *     summary: Bookmark or unbookmark a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     responses:
 *       200:
 *         description: Bookmark status toggled successfully
 *       404:
 *         description: Post not found
 */
router.post('/:postId/bookmark', authenticateToken as any, postsController.toggleBookmark as any);

/**
 * @openapi
 * /posts/{postId}/comments:
 *   get:
 *     tags: [Posts]
 *     summary: Get comments for a post
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of comments per page
 *     responses:
 *       200:
 *         description: Comments retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get('/:postId/comments', postsController.getComments as any);

/**
 * @openapi
 * /posts/{postId}/comments:
 *   post:
 *     tags: [Posts]
 *     summary: Add a comment to a post
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: Post ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Great post! Thanks for sharing."
 *               parentCommentId:
 *                 type: string
 *                 description: ID of parent comment for replies
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Post not found
 */
router.post('/:postId/comments', authenticateToken as any, postsController.addComment as any);

export default router;