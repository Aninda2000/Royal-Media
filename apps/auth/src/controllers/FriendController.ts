import { Request, Response } from 'express';
import { FriendService } from '../services/FriendService';
import { RequestWithUser } from '../middleware';

export class FriendController {
  private friendService = new FriendService();

  // Send friend request
  sendFriendRequest = async (req: RequestWithUser, res: Response) => {
    try {
      const { receiverId, message } = req.body;
      const senderId = req.user!.userId;

      if (!receiverId) {
        return res.status(400).json({
          success: false,
          message: 'Receiver ID is required'
        });
      }

      const friendRequest = await this.friendService.sendFriendRequest(senderId, receiverId, message);

      res.status(201).json({
        success: true,
        message: 'Friend request sent successfully',
        data: friendRequest
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to send friend request'
      });
    }
  };

  // Accept friend request
  acceptFriendRequest = async (req: RequestWithUser, res: Response) => {
    try {
      const { requestId } = req.params;
      const userId = req.user!.userId;

      const result = await this.friendService.acceptFriendRequest(requestId, userId);

      res.json({
        success: true,
        message: 'Friend request accepted',
        data: result
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to accept friend request'
      });
    }
  };

  // Reject friend request
  rejectFriendRequest = async (req: RequestWithUser, res: Response) => {
    try {
      const { requestId } = req.params;
      const userId = req.user!.userId;

      const request = await this.friendService.rejectFriendRequest(requestId, userId);

      res.json({
        success: true,
        message: 'Friend request rejected',
        data: request
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject friend request'
      });
    }
  };

  // Cancel friend request
  cancelFriendRequest = async (req: RequestWithUser, res: Response) => {
    try {
      const { requestId } = req.params;
      const userId = req.user!.userId;

      const request = await this.friendService.cancelFriendRequest(requestId, userId);

      res.json({
        success: true,
        message: 'Friend request cancelled',
        data: request
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to cancel friend request'
      });
    }
  };

  // Remove friend
  removeFriend = async (req: RequestWithUser, res: Response) => {
    try {
      const { friendId } = req.params;
      const userId = req.user!.userId;

      await this.friendService.removeFriend(userId, friendId);

      res.json({
        success: true,
        message: 'Friend removed successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to remove friend'
      });
    }
  };

  // Get pending friend requests received
  getPendingRequestsReceived = async (req: RequestWithUser, res: Response) => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.friendService.getPendingRequestsReceived(userId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get pending requests'
      });
    }
  };

  // Get pending friend requests sent
  getPendingRequestsSent = async (req: RequestWithUser, res: Response) => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.friendService.getPendingRequestsSent(userId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get sent requests'
      });
    }
  };

  // Get friends list
  getFriends = async (req: RequestWithUser, res: Response) => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.friendService.getFriends(userId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get friends list'
      });
    }
  };

  // Get friendship status with another user
  getFriendshipStatus = async (req: RequestWithUser, res: Response) => {
    try {
      const { userId: otherUserId } = req.params;
      const userId = req.user!.userId;

      const status = await this.friendService.getFriendshipStatus(userId, otherUserId);

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get friendship status'
      });
    }
  };

  // Search users
  searchUsers = async (req: RequestWithUser, res: Response) => {
    try {
      const { q: query } = req.query;
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
      }

      const result = await this.friendService.searchUsers(query, userId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to search users'
      });
    }
  };

  // Get mutual friends
  getMutualFriends = async (req: RequestWithUser, res: Response) => {
    try {
      const { userId: otherUserId } = req.params;
      const userId = req.user!.userId;

      const mutualFriends = await this.friendService.getMutualFriends(userId, otherUserId);

      res.json({
        success: true,
        data: mutualFriends
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get mutual friends'
      });
    }
  };

  // Get friend suggestions
  getFriendSuggestions = async (req: RequestWithUser, res: Response) => {
    try {
      const userId = req.user!.userId;
      const limit = parseInt(req.query.limit as string) || 10;

      const suggestions = await this.friendService.getFriendSuggestions(userId, limit);

      res.json({
        success: true,
        data: suggestions
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get friend suggestions'
      });
    }
  };

  // Block user
  blockUser = async (req: RequestWithUser, res: Response) => {
    try {
      const { userId: userToBlock } = req.params;
      const userId = req.user!.userId;

      await this.friendService.blockUser(userId, userToBlock);

      res.json({
        success: true,
        message: 'User blocked successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to block user'
      });
    }
  };

  // Unblock user
  unblockUser = async (req: RequestWithUser, res: Response) => {
    try {
      const { userId: userToUnblock } = req.params;
      const userId = req.user!.userId;

      await this.friendService.unblockUser(userId, userToUnblock);

      res.json({
        success: true,
        message: 'User unblocked successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to unblock user'
      });
    }
  };

  // Get blocked users
  getBlockedUsers = async (req: RequestWithUser, res: Response) => {
    try {
      const userId = req.user!.userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.friendService.getBlockedUsers(userId, page, limit);

      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to get blocked users'
      });
    }
  };
}