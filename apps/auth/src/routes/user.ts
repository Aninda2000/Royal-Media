import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { 
  authenticateToken, 
  requireVerified, 
  requireActive 
} from '../middleware/auth';
import { 
  validateProfileUpdate, 
  validateChangePassword,
  validateUserId,
  validateSearch 
} from '../middleware/validation';

const router = Router();
const userController = new UserController();

/**
 * @openapi
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @openapi
 * /users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Get user profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 */
router.get('/profile', authenticateToken, userController.getProfile);

/**
 * @openapi
 * /users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *                 example: "Doe"
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 example: "Software developer passionate about technology"
 *               location:
 *                 type: string
 *                 maxLength: 100
 *                 example: "New York, NY"
 *               website:
 *                 type: string
 *                 format: uri
 *                 example: "https://johndoe.com"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', 
  authenticateToken, 
  requireVerified, 
  validateProfileUpdate, 
  userController.updateProfile
);

/**
 * @openapi
 * /users/change-password:
 *   put:
 *     tags: [Users]
 *     summary: Change user password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - password
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "currentpassword123"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: "newpassword123"
 *               confirmPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.put('/change-password', 
  authenticateToken, 
  validateChangePassword, 
  userController.changePassword
);

/**
 * @openapi
 * /users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/PublicUser'
 */
router.get('/:userId', validateUserId, userController.getUserById);

/**
 * @openapi
 * /users/search:
 *   get:
 *     tags: [Users]
 *     summary: Search users
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PublicUser'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/search', validateSearch, userController.searchUsers);

/**
 * @openapi
 * /users/deactivate:
 *   patch:
 *     tags: [Users]
 *     summary: Deactivate user account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 */
router.patch('/deactivate', authenticateToken, userController.deactivateAccount);

export default router;