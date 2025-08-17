'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    handle: string;
    avatarUrl?: string;
    profileImage?: string;
  };
  receiver?: {
    id: string;
    firstName: string;
    lastName: string;
    handle: string;
    avatarUrl?: string;
    profileImage?: string;
  };
}

export interface Friend {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl?: string;
  profileImage?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface SearchUser {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl?: string;
  profileImage?: string;
  isOnline?: boolean;
  friendshipStatus: {
    status: 'friends' | 'request_sent' | 'request_received' | 'none';
    requestId?: string;
  };
}

export const useFriends = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authServiceUrl = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001';

  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }, []);

  const makeRequest = useCallback(async (endpoint: string, options: RequestInit = {}) => {
    const token = getToken();
    if (!token) throw new Error('No authentication token');

    const response = await fetch(`${authServiceUrl}/api/friends${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }, [authServiceUrl, getToken]);

  // Send friend request
  const sendFriendRequest = useCallback(async (receiverId: string, message?: string) => {
    try {
      setError(null);
      const data = await makeRequest('', {
        method: 'POST',
        body: JSON.stringify({ receiverId, message }),
      });
      
      // Refresh search results to update the status
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [makeRequest]);

  // Accept friend request
  const acceptFriendRequest = useCallback(async (requestId: string) => {
    try {
      setError(null);
      const data = await makeRequest(`/requests/${requestId}/accept`, {
        method: 'PATCH',
      });
      
      // Remove from received requests and add to friends
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      await fetchFriends();
      
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [makeRequest]);

  // Reject friend request
  const rejectFriendRequest = useCallback(async (requestId: string) => {
    try {
      setError(null);
      const data = await makeRequest(`/requests/${requestId}/reject`, {
        method: 'PATCH',
      });
      
      // Remove from received requests
      setReceivedRequests(prev => prev.filter(req => req.id !== requestId));
      
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [makeRequest]);

  // Cancel friend request
  const cancelFriendRequest = useCallback(async (requestId: string) => {
    try {
      setError(null);
      const data = await makeRequest(`/requests/${requestId}/cancel`, {
        method: 'PATCH',
      });
      
      // Remove from sent requests
      setSentRequests(prev => prev.filter(req => req.id !== requestId));
      
      return data;
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [makeRequest]);

  // Remove friend
  const removeFriend = useCallback(async (friendId: string) => {
    try {
      setError(null);
      await makeRequest(`/friends/${friendId}`, {
        method: 'DELETE',
      });
      
      // Remove from friends list
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [makeRequest]);

  // Search users
  const searchUsers = useCallback(async (query: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await makeRequest(`/search?q=${encodeURIComponent(query)}`);
      setSearchResults(data.data.users);
    } catch (error: any) {
      setError(error.message);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest]);

  // Fetch friends
  const fetchFriends = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await makeRequest('/friends');
      setFriends(data.data.friends);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest]);

  // Fetch received requests
  const fetchReceivedRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await makeRequest('/requests/received');
      setReceivedRequests(data.data.requests);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest]);

  // Fetch sent requests
  const fetchSentRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await makeRequest('/requests/sent');
      setSentRequests(data.data.requests);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [makeRequest]);

  // Get friendship status
  const getFriendshipStatus = useCallback(async (userId: string) => {
    try {
      const data = await makeRequest(`/status/${userId}`);
      return data.data;
    } catch (error: any) {
      setError(error.message);
      return { status: 'none' };
    }
  }, [makeRequest]);

  // Initial data fetch
  useEffect(() => {
    const token = getToken();
    if (user && token) {
      fetchFriends();
      fetchReceivedRequests();
      fetchSentRequests();
    }
  }, [user, getToken, fetchFriends, fetchReceivedRequests, fetchSentRequests]);

  return {
    // State
    friends,
    receivedRequests,
    sentRequests,
    searchResults,
    isLoading,
    error,
    
    // Actions
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    searchUsers,
    getFriendshipStatus,
    
    // Refresh functions
    fetchFriends,
    fetchReceivedRequests,
    fetchSentRequests,
    
    // Computed values
    friendsCount: friends.length,
    pendingReceivedCount: receivedRequests.length,
    pendingSentCount: sentRequests.length,
  };
};