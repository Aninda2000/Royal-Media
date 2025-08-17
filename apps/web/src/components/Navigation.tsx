'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  HomeIcon, 
  UsersIcon, 
  MessageCircleIcon, 
  BellIcon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFriends } from '@/hooks/use-friends';

const navigationItems = [
  {
    name: 'Home',
    href: '/feed',
    icon: HomeIcon,
  },
  {
    name: 'Friends',
    href: '/friends',
    icon: UsersIcon,
    showBadge: true,
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: MessageCircleIcon,
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: BellIcon,
  },
];

export const Navigation: React.FC = () => {
  const pathname = usePathname();
  const { pendingReceivedCount } = useFriends();
  // Initialize WebSocket connection only on client side
  useEffect(() => {
    // Only initialize if we're on the client side
    if (typeof window !== 'undefined') {
      try {
        // This will be handled by individual components that need notifications
        // No need to initialize here during SSR
      } catch (err) {
        // Silently handle any context errors during SSR
        console.warn('Notifications not available during SSR', err);
      }
    }
  }, []);
  const [friendRequestCount, setFriendRequestCount] = useState(pendingReceivedCount);

  // Listen for real-time friend request updates
  useEffect(() => {
    const handleNewNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'friend_request' && notification.data?.type === 'friend_request_received') {
        setFriendRequestCount(prev => prev + 1);
      }
    };

    const handleFriendRequestUpdate = () => {
      // Refresh the count when friend requests are accepted/rejected
      setFriendRequestCount(pendingReceivedCount);
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    window.addEventListener('friendRequestUpdate', handleFriendRequestUpdate);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
      window.removeEventListener('friendRequestUpdate', handleFriendRequestUpdate);
    };
  }, [pendingReceivedCount]);

  // Update count when pendingReceivedCount changes
  useEffect(() => {
    setFriendRequestCount(pendingReceivedCount);
  }, [pendingReceivedCount]);

  return (
    <nav className="flex items-center space-x-6">
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || 
          (item.href === '/feed' && (pathname === '/' || pathname === '/dashboard'));
        
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <item.icon className="h-4 w-4" />
            <span className="hidden md:inline">{item.name}</span>
            {item.showBadge && friendRequestCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {friendRequestCount > 99 ? '99+' : friendRequestCount}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );
};