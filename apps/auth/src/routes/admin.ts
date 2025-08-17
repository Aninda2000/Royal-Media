import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { 
  authenticateToken, 
  requireAdmin, 
  requireModerator 
} from '../middleware/auth';
import { 
  validateAdminUserCreation,
  validateRoleUpdate,
  validateUserId,
  validateSearch 
} from '../middleware/validation';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication
router.use(authenticateToken);

/**
 * @openapi
 * tags:
 *   name: Admin
 *   description: Admin management endpoints
 */

/**
 * @openapi
 * /admin/users:
 *   get:
 *     tags: [Admin]
 *     summary: List all users (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, premium, moderator, admin, super_admin]
 *         description: Filter by role
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verification status
 *     responses:
 *       200:
 *         description: List of users
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
 *                         $ref: '#/components/schemas/AdminUser'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         activeUsers:
 *                           type: integer
 *                         verifiedUsers:
 *                           type: integer
 */
router.get('/users', requireModerator, validateSearch, adminController.getUsers);

/**
 * @openapi
 * /admin/users:
 *   post:
 *     tags: [Admin]
 *     summary: Create new user (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - username
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "newuser@royal-media.com"
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 example: "newuser"
 *               firstName:
 *                 type: string
 *                 maxLength: 50
 *                 example: "New"
 *               lastName:
 *                 type: string
 *                 maxLength: 50
 *                 example: "User"
 *               role:
 *                 type: string
 *                 enum: [user, moderator, admin]
 *                 example: "user"
 *               isVerified:
 *                 type: boolean
 *                 default: false
 *                 example: true
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/users', requireAdmin, validateAdminUserCreation, adminController.createUser);

/**
 * @openapi
 * /admin/users/{userId}:
 *   get:
 *     tags: [Admin]
 *     summary: Get user details (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
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
 *                       $ref: '#/components/schemas/AdminUser'
 */
router.get('/users/:userId', requireModerator, validateUserId, adminController.getUserDetails);

/**
 * @openapi
 * /admin/users/{userId}/role:
 *   put:
 *     tags: [Admin]
 *     summary: Update user role (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, moderator, admin]
 *                 example: "moderator"
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.put('/users/:userId/role', 
  requireAdmin, 
  validateUserId, 
  validateRoleUpdate, 
  adminController.updateUserRole
);

/**
 * @openapi
 * /admin/users/{userId}/activate:
 *   patch:
 *     tags: [Admin]
 *     summary: Activate user account (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User account activated successfully
 */
router.patch('/users/:userId/activate', 
  requireAdmin, 
  validateUserId, 
  adminController.activateUser
);

/**
 * @openapi
 * /admin/users/{userId}/deactivate:
 *   patch:
 *     tags: [Admin]
 *     summary: Deactivate user account (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User account deactivated successfully
 */
router.patch('/users/:userId/deactivate', 
  requireAdmin, 
  validateUserId, 
  adminController.deactivateUser
);

/**
 * @openapi
 * /admin/users/{userId}/verify:
 *   patch:
 *     tags: [Admin]
 *     summary: Verify user email (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User email verified successfully
 */
router.patch('/users/:userId/verify', 
  requireAdmin, 
  validateUserId, 
  adminController.verifyUser
);

/**
 * @openapi
 * /admin/users/{userId}:
 *   delete:
 *     tags: [Admin]
 *     summary: Delete user account (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User account deleted successfully
 */
router.delete('/users/:userId', 
  requireAdmin, 
  validateUserId, 
  adminController.deleteUser
);

/**
 * @openapi
 * /admin/stats:
 *   get:
 *     tags: [Admin]
 *     summary: Get platform statistics (Admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
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
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         active:
 *                           type: integer
 *                         verified:
 *                           type: integer
 *                         newToday:
 *                           type: integer
 *                         newThisWeek:
 *                           type: integer
 *                         newThisMonth:
 *                           type: integer
 *                     roles:
 *                       type: object
 *                       properties:
 *                         user:
 *                           type: integer
 *                         premium:
 *                           type: integer
 *                         moderator:
 *                           type: integer
 *                         admin:
 *                           type: integer
 */
router.get('/stats', requireModerator, adminController.getStats);

export default router;