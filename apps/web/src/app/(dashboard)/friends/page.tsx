'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/MainLayout';
import { 
  FriendRequestList, 
  FriendsList, 
  UserSearch 
} from '@repo/ui/components';
import { useFriends } from '@/hooks/use-friends';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function FriendsPage() {
  const router = useRouter();
  const {
    friends,
    receivedRequests,
    sentRequests,
    searchResults,
    isLoading,
    error,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    searchUsers,
    friendsCount,
    pendingReceivedCount,
    pendingSentCount,
  } = useFriends();

  const [activeTab, setActiveTab] = useState('friends');

  const handleSendFriendRequest = async (userId: string, message?: string) => {
    try {
      await sendFriendRequest(userId, message);
      toast.success('Friend request sent successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send friend request';
      toast.error(errorMessage);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      toast.success('Friend request accepted!');
      // Trigger navigation update
      window.dispatchEvent(new CustomEvent('friendRequestUpdate'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to accept friend request';
      toast.error(errorMessage);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await rejectFriendRequest(requestId);
      toast.success('Friend request rejected');
      // Trigger navigation update
      window.dispatchEvent(new CustomEvent('friendRequestUpdate'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reject friend request';
      toast.error(errorMessage);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await cancelFriendRequest(requestId);
      toast.success('Friend request cancelled');
      // Trigger navigation update
      window.dispatchEvent(new CustomEvent('friendRequestUpdate'));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel friend request';
      toast.error(errorMessage);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (confirm('Are you sure you want to remove this friend?')) {
      try {
        await removeFriend(friendId);
        toast.success('Friend removed successfully');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to remove friend';
        toast.error(errorMessage);
      }
    }
  };

  const handleMessage = (userId: string) => {
    router.push(`/messages?user=${userId}`);
  };

  const handleViewProfile = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Friends</h1>
          <p className="text-gray-600">Manage your friendships and connect with new people</p>
        </div>

      {error && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-800">{error}</p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="friends" className="relative">
            Friends
            {friendsCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {friendsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="relative">
            Requests
            {pendingReceivedCount > 0 && (
              <Badge variant="default" className="ml-2 text-xs">
                {pendingReceivedCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent" className="relative">
            Sent
            {pendingSentCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pendingSentCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="search">Find Friends</TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Friends ({friendsCount})</CardTitle>
              <CardDescription>
                People you&apos;re connected with on Royal Media
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FriendsList
                friends={friends}
                onMessage={handleMessage}
                onRemove={handleRemoveFriend}
                onViewProfile={handleViewProfile}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Friend Requests ({pendingReceivedCount})</CardTitle>
              <CardDescription>
                People who want to connect with you
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FriendRequestList
                requests={receivedRequests}
                type="received"
                onAccept={handleAcceptRequest}
                onReject={handleRejectRequest}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Sent Requests ({pendingSentCount})</CardTitle>
              <CardDescription>
                Friend requests you&apos;ve sent that are pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FriendRequestList
                requests={sentRequests}
                type="sent"
                onCancel={handleCancelRequest}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Find Friends</CardTitle>
              <CardDescription>
                Search for people to connect with
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserSearch
                onSearch={searchUsers}
                searchResults={searchResults}
                isLoading={isLoading}
                onSendRequest={handleSendFriendRequest}
                onAcceptRequest={handleAcceptRequest}
                onRejectRequest={handleRejectRequest}
                onCancelRequest={handleCancelRequest}
                onMessage={handleMessage}
                onViewProfile={handleViewProfile}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </MainLayout>
  );
}