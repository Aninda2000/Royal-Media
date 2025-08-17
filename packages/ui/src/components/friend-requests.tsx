'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckIcon, XIcon, UserPlusIcon, MessageCircleIcon } from 'lucide-react';

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

export interface FriendRequestCardProps {
  request: FriendRequest;
  type: 'received' | 'sent';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  className?: string;
}

export const FriendRequestCard: React.FC<FriendRequestCardProps> = ({
  request,
  type,
  onAccept,
  onReject,
  onCancel,
  className = ''
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const user = type === 'received' ? request.sender : request.receiver;

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (request.status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'accepted':
        return <Badge variant="default">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return null;
    }
  };

  if (!user) return null;

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage 
              src={user.avatarUrl || user.profileImage} 
              alt={`${user.firstName} ${user.lastName}`} 
            />
            <AvatarFallback>
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">
                {user.firstName} {user.lastName}
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">@{user.handle}</p>
            {request.message && (
              <p className="text-sm text-gray-600 italic">"{request.message}"</p>
            )}
            <p className="text-xs text-muted-foreground">
              {new Date(request.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex space-x-2">
            {type === 'received' && request.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleAction(() => onAccept?.(request.id))}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <CheckIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAction(() => onReject?.(request.id))}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {type === 'sent' && request.status === 'pending' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction(() => onCancel?.(request.id))}
                disabled={isLoading}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export interface FriendRequestListProps {
  requests: FriendRequest[];
  type: 'received' | 'sent';
  onAccept?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const FriendRequestList: React.FC<FriendRequestListProps> = ({
  requests,
  type,
  onAccept,
  onReject,
  onCancel,
  isLoading = false,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="w-full">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-8 text-center">
          <UserPlusIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No {type} friend requests
          </h3>
          <p className="text-gray-500">
            {type === 'received' 
              ? "You don't have any pending friend requests." 
              : "You haven't sent any friend requests."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {requests.map((request) => (
        <FriendRequestCard
          key={request.id}
          request={request}
          type={type}
          onAccept={onAccept}
          onReject={onReject}
          onCancel={onCancel}
        />
      ))}
    </div>
  );
};