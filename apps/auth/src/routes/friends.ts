import { Router } from 'express';
import { FriendController } from '../controllers/FriendController';
import { authenticateToken } from '../middleware';

const router = Router();
const friendController = new FriendController();

// Friend request routes
router.post('/requests', authenticateToken, friendController.sendFriendRequest);
router.patch('/requests/:requestId/accept', authenticateToken, friendController.acceptFriendRequest);
router.patch('/requests/:requestId/reject', authenticateToken, friendController.rejectFriendRequest);
router.patch('/requests/:requestId/cancel', authenticateToken, friendController.cancelFriendRequest);

// Friend management routes
router.delete('/friends/:friendId', authenticateToken, friendController.removeFriend);
router.get('/friends', authenticateToken, friendController.getFriends);

// Friend request listing routes
router.get('/requests/received', authenticateToken, friendController.getPendingRequestsReceived);
router.get('/requests/sent', authenticateToken, friendController.getPendingRequestsSent);

// Friendship status and search routes
router.get('/status/:userId', authenticateToken, friendController.getFriendshipStatus);
router.get('/search', authenticateToken, friendController.searchUsers);

// Advanced friend features
router.get('/mutual/:userId', authenticateToken, friendController.getMutualFriends);
router.get('/suggestions', authenticateToken, friendController.getFriendSuggestions);

// Blocking features
router.post('/block/:userId', authenticateToken, friendController.blockUser);
router.delete('/block/:userId', authenticateToken, friendController.unblockUser);
router.get('/blocked', authenticateToken, friendController.getBlockedUsers);

export { router as friendRoutes };