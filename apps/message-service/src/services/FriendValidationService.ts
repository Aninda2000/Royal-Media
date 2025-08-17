import axios from 'axios';

export class FriendValidationService {
  private authServiceUrl: string;

  constructor() {
    this.authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  }

  async areFriends(userId1: string, userId2: string, token: string): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.authServiceUrl}/api/friends/status/${userId2}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data.success && response.data.data.status === 'friends';
    } catch (error) {
      console.error('Error checking friendship status:', error);
      return false;
    }
  }

  async validateFriendshipForMessaging(userId: string, otherUserId: string, token: string): Promise<{
    canMessage: boolean;
    reason?: string;
  }> {
    try {
      // Check if users are friends
      const areFriends = await this.areFriends(userId, otherUserId, token);
      
      if (!areFriends) {
        return {
          canMessage: false,
          reason: 'You can only message your friends'
        };
      }

      return { canMessage: true };
    } catch (error) {
      return {
        canMessage: false,
        reason: 'Unable to verify friendship status'
      };
    }
  }
}