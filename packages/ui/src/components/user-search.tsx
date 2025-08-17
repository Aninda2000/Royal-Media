'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { SearchIcon, UserPlusIcon, CheckIcon, XIcon, MessageCircleIcon } from 'lucide-react';
import { useDebounce } from '../hooks/use-debounce';

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

export interface UserSearchCardProps {
  user: SearchUser;
  onSendRequest?: (userId: string, message?: string) => void;
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onCancelRequest?: (requestId: string) => void;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  className?: string;
}

export const UserSearchCard: React.FC<UserSearchCardProps> = ({
  user,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onMessage,
  onViewProfile,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showMessageInput, setShowMessageInput] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendRequest = async () => {
    if (showMessageInput) {
      await handleAction(() => onSendRequest?.(user.id, requestMessage.trim() || undefined));
      setShowMessageInput(false);
      setRequestMessage('');
    } else {
      setShowMessageInput(true);
    }
  };

  const getFriendshipButton = () => {
    const { status, requestId } = user.friendshipStatus;

    switch (status) {
      case 'friends':
        return (
          <Button
            size="sm"
            onClick={() => onMessage?.(user.id)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <MessageCircleIcon className="h-4 w-4 mr-1" />
            Message
          </Button>
        );
      
      case 'request_sent':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleAction(() => onCancelRequest?.(requestId!))}
            disabled={isLoading}
          >
            Cancel Request
          </Button>
        );
      
      case 'request_received':
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              onClick={() => handleAction(() => onAcceptRequest?.(requestId!))}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <CheckIcon className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction(() => onRejectRequest?.(requestId!))}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        );
      
      default:
        return (
          <Button
            size="sm"
            onClick={handleSendRequest}
            disabled={isLoading}
          >
            <UserPlusIcon className="h-4 w-4 mr-1" />
            Add Friend
          </Button>
        );
    }
  };

  const getStatusBadge = () => {
    const { status } = user.friendshipStatus;
    
    switch (status) {
      case 'friends':
        return <Badge variant="default" className="text-xs">Friends</Badge>;
      case 'request_sent':
        return <Badge variant="secondary" className="text-xs">Request Sent</Badge>;
      case 'request_received':
        return <Badge variant="outline" className="text-xs">Request Received</Badge>;
      default:
        return user.isOnline ? <Badge variant="default" className="text-xs">Online</Badge> : null;
    }
  };

  return (
    <Card className={`w-full hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={user.avatarUrl || user.profileImage} 
                alt={`${user.firstName} ${user.lastName}`} 
              />
              <AvatarFallback>
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {user.isOnline && user.friendshipStatus.status !== 'friends' && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium cursor-pointer hover:text-blue-600"
                  onClick={() => onViewProfile?.(user.id)}>
                {user.firstName} {user.lastName}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">@{user.handle}</p>
          </div>
          
          <div className="flex items-center">
            {getFriendshipButton()}
          </div>
        </div>
        
        {showMessageInput && (
          <div className="mt-4 space-y-2">
            <Input
              placeholder="Add a message (optional)"
              value={requestMessage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRequestMessage(e.target.value)}
              maxLength={200}
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSendRequest} disabled={isLoading}>
                Send Request
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setShowMessageInput(false);
                  setRequestMessage('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export interface UserSearchProps {
  onSearch: (query: string) => void;
  searchResults: SearchUser[];
  isLoading?: boolean;
  onSendRequest?: (userId: string, message?: string) => void;
  onAcceptRequest?: (requestId: string) => void;
  onRejectRequest?: (requestId: string) => void;
  onCancelRequest?: (requestId: string) => void;
  onMessage?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  className?: string;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  onSearch,
  searchResults,
  isLoading = false,
  onSendRequest,
  onAcceptRequest,
  onRejectRequest,
  onCancelRequest,
  onMessage,
  onViewProfile,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedQuery.trim()) {
      onSearch(debouncedQuery.trim());
    }
  }, [debouncedQuery, onSearch]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search for friends..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="w-full">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && searchQuery && searchResults.length === 0 && (
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <SearchIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No users found
            </h3>
            <p className="text-gray-500">
              Try searching with a different name or handle.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((user) => (
            <UserSearchCard
              key={user.id}
              user={user}
              onSendRequest={onSendRequest}
              onAcceptRequest={onAcceptRequest}
              onRejectRequest={onRejectRequest}
              onCancelRequest={onCancelRequest}
              onMessage={onMessage}
              onViewProfile={onViewProfile}
            />
          ))}
        </div>
      )}

      {!searchQuery && (
        <Card className="w-full">
          <CardContent className="p-8 text-center">
            <SearchIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Find Friends
            </h3>
            <p className="text-gray-500">
              Search for people by name or handle to connect with them.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};