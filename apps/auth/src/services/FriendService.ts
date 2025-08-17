import { FriendRequest, IFriendRequest } from '../models/FriendRequest';
import { Friendship, IFriendship } from '../models/Friendship';
import { User, IUser } from '../models/User';
import { Types } from 'mongoose';
import { notificationClient } from './NotificationClient';

export class FriendService {
  // Send a friend request
  async sendFriendRequest(senderId: string, receiverId: string, message?: string): Promise<IFriendRequest> {
    // Validate that users exist
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId)
    ]);

    if (!sender || !receiver) {
      throw new Error('User not found');
    }

    if (senderId === receiverId) {
      throw new Error('Cannot send friend request to yourself');
    }

    // Check if they are already friends
    const existingFriendship = await this.areFriends(senderId, receiverId);
    if (existingFriendship) {
      throw new Error('Users are already friends');
    }

    // Check if there's already a pending request
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { senderId, receiverId, status: 'pending' },
        { senderId: receiverId, receiverId: senderId, status: 'pending' }
      ]
    });

    if (existingRequest) {
      throw new Error('Friend request already exists');
    }

    // Check receiver's privacy settings
    if (!receiver.privacySettings.allowFollowRequests) {
      throw new Error('User does not accept friend requests');
    }

    const friendRequest = new FriendRequest({
      senderId,
      receiverId,
      message,
      status: 'pending'
    });

    const savedRequest = await friendRequest.save();

    // Send notification to the receiver
    try {
      await notificationClient.createFriendRequestNotification(
        senderId,
        receiverId,
        `${sender.firstName} ${sender.lastName}`
      );
    } catch (error) {
      console.error('Failed to send friend request notification:', error);
    }

    return savedRequest;
  }

  // Accept a friend request
  async acceptFriendRequest(requestId: string, userId: string): Promise<{ friendship: IFriendship; request: IFriendRequest }> {
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.receiverId.toString() !== userId) {
      throw new Error('Unauthorized to accept this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    // Create friendship
    const friendship = new Friendship({
      userId1: request.senderId,
      userId2: request.receiverId
    });

    // Update request status
    request.status = 'accepted';
    request.respondedAt = new Date();

    // Save both in parallel
    const [savedFriendship, savedRequest] = await Promise.all([
      friendship.save(),
      request.save()
    ]);

    // Send notification to the original sender
    try {
      const receiver = await User.findById(userId);
      if (receiver) {
        await notificationClient.createFriendRequestAcceptedNotification(
          userId,
          request.senderId.toString(),
          `${receiver.firstName} ${receiver.lastName}`
        );
      }
    } catch (error) {
      console.error('Failed to send friend request accepted notification:', error);
    }

    return { friendship: savedFriendship, request: savedRequest };
  }

  // Reject a friend request
  async rejectFriendRequest(requestId: string, userId: string): Promise<IFriendRequest> {
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.receiverId.toString() !== userId) {
      throw new Error('Unauthorized to reject this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    request.status = 'rejected';
    request.respondedAt = new Date();

    return await request.save();
  }

  // Cancel a friend request (by sender)
  async cancelFriendRequest(requestId: string, userId: string): Promise<IFriendRequest> {
    const request = await FriendRequest.findById(requestId);
    
    if (!request) {
      throw new Error('Friend request not found');
    }

    if (request.senderId.toString() !== userId) {
      throw new Error('Unauthorized to cancel this request');
    }

    if (request.status !== 'pending') {
      throw new Error('Friend request is not pending');
    }

    request.status = 'cancelled';

    return await request.save();
  }

  // Remove friendship
  async removeFriend(userId: string, friendId: string): Promise<boolean> {
    const friendship = await Friendship.findOne({
      $or: [
        { userId1: userId, userId2: friendId },
        { userId1: friendId, userId2: userId }
      ]
    });

    if (!friendship) {
      throw new Error('Friendship not found');
    }

    await friendship.deleteOne();
    return true;
  }

  // Get pending friend requests received by user
  async getPendingRequestsReceived(userId: string, page = 1, limit = 20): Promise<{
    requests: (IFriendRequest & { sender: IUser })[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;
    
    const [requests, total] = await Promise.all([
      FriendRequest.find({ receiverId: userId, status: 'pending' })
        .populate('senderId', 'firstName lastName handle avatarUrl profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FriendRequest.countDocuments({ receiverId: userId, status: 'pending' })
    ]);

    return {
      requests: requests.map(req => ({
        ...req,
        sender: req.senderId as any
      })),
      total,
      hasMore: skip + requests.length < total
    };
  }

  // Get pending friend requests sent by user
  async getPendingRequestsSent(userId: string, page = 1, limit = 20): Promise<{
    requests: (IFriendRequest & { receiver: IUser })[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;
    
    const [requests, total] = await Promise.all([
      FriendRequest.find({ senderId: userId, status: 'pending' })
        .populate('receiverId', 'firstName lastName handle avatarUrl profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FriendRequest.countDocuments({ senderId: userId, status: 'pending' })
    ]);

    return {
      requests: requests.map(req => ({
        ...req,
        receiver: req.receiverId as any
      })),
      total,
      hasMore: skip + requests.length < total
    };
  }

  // Get user's friends list
  async getFriends(userId: string, page = 1, limit = 20): Promise<{
    friends: IUser[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;
    
    const friendships = await Friendship.find({
      $or: [{ userId1: userId }, { userId2: userId }]
    }).lean();

    const friendIds = friendships.map(f => 
      f.userId1.toString() === userId ? f.userId2 : f.userId1
    );

    const [friends, total] = await Promise.all([
      User.find({ _id: { $in: friendIds } })
        .select('firstName lastName handle avatarUrl profileImage isOnline lastSeen')
        .sort({ firstName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      friendIds.length
    ]);

    return {
      friends,
      total,
      hasMore: skip + friends.length < total
    };
  }

  // Check if two users are friends
  async areFriends(userId1: string, userId2: string): Promise<boolean> {
    const friendship = await Friendship.findOne({
      $or: [
        { userId1, userId2 },
        { userId1: userId2, userId2: userId1 }
      ]
    });

    return !!friendship;
  }

  // Get friendship status between two users
  async getFriendshipStatus(userId: string, otherUserId: string): Promise<{
    status: 'friends' | 'request_sent' | 'request_received' | 'none';
    requestId?: string;
  }> {
    // Check if they are friends
    const areFriends = await this.areFriends(userId, otherUserId);
    if (areFriends) {
      return { status: 'friends' };
    }

    // Check for pending requests
    const pendingRequest = await FriendRequest.findOne({
      $or: [
        { senderId: userId, receiverId: otherUserId, status: 'pending' },
        { senderId: otherUserId, receiverId: userId, status: 'pending' }
      ]
    });

    if (pendingRequest) {
      if (pendingRequest.senderId.toString() === userId) {
        return { status: 'request_sent', requestId: pendingRequest._id.toString() };
      } else {
        return { status: 'request_received', requestId: pendingRequest._id.toString() };
      }
    }

    return { status: 'none' };
  }

  // Search for users to send friend requests to
  async searchUsers(query: string, currentUserId: string, page = 1, limit = 20): Promise<{
    users: (IUser & { friendshipStatus: any })[];
    total: number;
    hasMore: boolean;
  }> {
    const skip = (page - 1) * limit;
    
    const searchRegex = new RegExp(query, 'i');
    const [users, total] = await Promise.all([
      User.find({
        _id: { $ne: currentUserId },
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { handle: searchRegex },
          { email: searchRegex }
        ]
      })
        .select('firstName lastName handle avatarUrl profileImage isOnline')
        .sort({ firstName: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({
        _id: { $ne: currentUserId },
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { handle: searchRegex },
          { email: searchRegex }
        ]
      })
    ]);

    // Get friendship status for each user
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const friendshipStatus = await this.getFriendshipStatus(currentUserId, user._id.toString());
        return {
          ...user,
          friendshipStatus
        };
      })
    );

    return {
      users: usersWithStatus,
      total,
      hasMore: skip + users.length < total
    };
  }

  // Get mutual friends between two users
  async getMutualFriends(userId1: string, userId2: string): Promise<{
    friends: IUser[];
    total: number;
  }> {
    // Get friends of both users
    const [user1Friendships, user2Friendships] = await Promise.all([
      Friendship.find({
        $or: [{ userId1 }, { userId2: userId1 }]
      }).lean(),
      Friendship.find({
        $or: [{ userId1: userId2 }, { userId2 }]
      }).lean()
    ]);

    // Extract friend IDs
    const user1FriendIds = user1Friendships.map(f => 
      f.userId1.toString() === userId1 ? f.userId2.toString() : f.userId1.toString()
    );
    const user2FriendIds = user2Friendships.map(f => 
      f.userId1.toString() === userId2 ? f.userId2.toString() : f.userId1.toString()
    );

    // Find mutual friends
    const mutualFriendIds = user1FriendIds.filter(id => user2FriendIds.includes(id));

    const mutualFriends = await User.find({ _id: { $in: mutualFriendIds } })
      .select('firstName lastName handle avatarUrl profileImage isOnline lastSeen')
      .sort({ firstName: 1 })
      .lean();

    return {
      friends: mutualFriends,
      total: mutualFriends.length
    };
  }

  // Get friend suggestions based on mutual friends and other factors
  async getFriendSuggestions(userId: string, limit = 10): Promise<{
    suggestions: (IUser & { mutualFriendsCount: number; reason: string })[];
  }> {
    // Get user's current friends
    const userFriendships = await Friendship.find({
      $or: [{ userId1: userId }, { userId2: userId }]
    }).lean();

    const userFriendIds = userFriendships.map(f => 
      f.userId1.toString() === userId ? f.userId2.toString() : f.userId1.toString()
    );

    // Get friends of friends (potential suggestions)
    const friendsOfFriends = await Friendship.find({
      $or: [
        { userId1: { $in: userFriendIds } },
        { userId2: { $in: userFriendIds } }
      ]
    }).lean();

    const suggestionCounts: Record<string, number> = {};
    
    friendsOfFriends.forEach(friendship => {
      const potentialFriend = friendship.userId1.toString() === userId || userFriendIds.includes(friendship.userId1.toString())
        ? friendship.userId2.toString()
        : friendship.userId1.toString();

      if (potentialFriend !== userId && !userFriendIds.includes(potentialFriend)) {
        suggestionCounts[potentialFriend] = (suggestionCounts[potentialFriend] || 0) + 1;
      }
    });

    // Get top suggestions
    const topSuggestionIds = Object.entries(suggestionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([id]) => id);

    const suggestions = await User.find({ _id: { $in: topSuggestionIds } })
      .select('firstName lastName handle avatarUrl profileImage isOnline')
      .lean();

    return {
      suggestions: suggestions.map(user => ({
        ...user,
        mutualFriendsCount: suggestionCounts[user._id.toString()],
        reason: `${suggestionCounts[user._id.toString()]} mutual friends`
      }))
    };
  }

  // Block a user
  async blockUser(userId: string, userToBlock: string): Promise<void> {
    if (userId === userToBlock) {
      throw new Error('Cannot block yourself');
    }

    // Check if user exists
    const userExists = await User.findById(userToBlock);
    if (!userExists) {
      throw new Error('User not found');
    }

    // Remove existing friendship if any
    await Friendship.deleteOne({
      $or: [
        { userId1: userId, userId2: userToBlock },
        { userId1: userToBlock, userId2: userId }
      ]
    });

    // Cancel any pending friend requests
    await FriendRequest.updateMany({
      $or: [
        { senderId: userId, receiverId: userToBlock, status: 'pending' },
        { senderId: userToBlock, receiverId: userId, status: 'pending' }
      ]
    }, { status: 'cancelled' });

    // Add to blocked list (we'll add this to User model)
    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: userToBlock }
    });
  }

  // Unblock a user
  async unblockUser(userId: string, userToUnblock: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: userToUnblock }
    });
  }

  // Get blocked users
  async getBlockedUsers(userId: string, page = 1, limit = 20): Promise<{
    users: IUser[];
    total: number;
    hasMore: boolean;
  }> {
    const user = await User.findById(userId).select('blockedUsers');
    if (!user || !user.blockedUsers) {
      return { users: [], total: 0, hasMore: false };
    }

    const skip = (page - 1) * limit;
    const blockedUserIds = user.blockedUsers.slice(skip, skip + limit);

    const blockedUsers = await User.find({ _id: { $in: blockedUserIds } })
      .select('firstName lastName handle avatarUrl profileImage')
      .lean();

    return {
      users: blockedUsers,
      total: user.blockedUsers.length,
      hasMore: skip + blockedUsers.length < user.blockedUsers.length
    };
  }
}