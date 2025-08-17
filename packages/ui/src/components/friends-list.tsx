'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { MessageCircleIcon, UserMinusIcon, MoreHorizontalIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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

export interface FriendCardProps {
  friend: Friend;
  onMessage?: (friendId: string) => void;
  onRemove?: (friendId: string) => void;
  onViewProfile?: (friendId: string) => void;
  className?: string;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  onMessage,
  onRemove,
  onViewProfile,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const getOnlineStatus = () => {
    if (friend.isOnline) {
      return <Badge variant="default" className="text-xs">Online</Badge>;
    } else if (friend.lastSeen) {
      const lastSeen = new Date(friend.lastSeen);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return <Badge variant="secondary" className="text-xs">Active {diffInMinutes}m ago</Badge>;
      } else if (diffInMinutes < 1440) {
        const hours = Math.floor(diffInMinutes / 60);
        return <Badge variant="secondary" className="text-xs">Active {hours}h ago</Badge>;
      } else {
        const days = Math.floor(diffInMinutes / 1440);
        return <Badge variant="secondary" className="text-xs">Active {days}d ago</Badge>;
      }
    }
    return null;
  };

  return (
    <Card className={`w-full hover:shadow-md transition-shadow ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={friend.avatarUrl || friend.profileImage} 
                alt={`${friend.firstName} ${friend.lastName}`} 
              />
              <AvatarFallback>
                {friend.firstName.charAt(0)}{friend.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {friend.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium cursor-pointer hover:text-blue-600"
                  onClick={() => onViewProfile?.(friend.id)}>
                {friend.firstName} {friend.lastName}
              </h3>
              {getOnlineStatus()}
            </div>
            <p className="text-sm text-muted-foreground">@{friend.handle}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={() => handleAction(() => onMessage?.(friend.id))}
              disabled={isLoading}
              className="h-8 w-8 p-0"
            >
              <MessageCircleIcon className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onViewProfile?.(friend.id)}>
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleAction(() => onRemove?.(friend.id))}
                  className="text-red-600"
                >
                  <UserMinusIcon className="h-4 w-4 mr-2" />
                  Remove Friend
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export interface FriendsListProps {
  friends: Friend[];
  onMessage?: (friendId: string) => void;
  onRemove?: (friendId: string) => void;
  onViewProfile?: (friendId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const FriendsList: React.FC<FriendsListProps> = ({
  friends,
  onMessage,
  onRemove,
  onViewProfile,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                </div>
                <div className="flex space-x-2">
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-8 text-center">
          <MessageCircleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No friends yet
          </h3>
          <p className="text-gray-500">
            Start connecting with people to build your network!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {friends.map((friend) => (
        <FriendCard
          key={friend.id}
          friend={friend}
          onMessage={onMessage}
          onRemove={onRemove}
          onViewProfile={onViewProfile}
        />
      ))}
    </div>
  );
};