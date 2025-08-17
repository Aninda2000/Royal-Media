'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainLayout } from '@/components/MainLayout';
import { 
  UsersIcon, 
  MessageCircleIcon, 
  BellIcon,
  PlusIcon,
  UserPlusIcon 
} from 'lucide-react';
import { useFriends } from '@/hooks/use-friends';

export default function DashboardPage() {
  const { 
    friendsCount, 
    pendingReceivedCount, 
    // pendingSentCount, - unused variable
    receivedRequests 
  } = useFriends();

  const quickStats = [
    {
      title: 'Friends',
      value: friendsCount,
      description: 'Connected friends',
      icon: UsersIcon,
      href: '/friends',
      color: 'bg-blue-500',
    },
    {
      title: 'Friend Requests',
      value: pendingReceivedCount,
      description: 'Pending requests',
      icon: UserPlusIcon,
      href: '/friends?tab=requests',
      color: 'bg-green-500',
      badge: pendingReceivedCount > 0,
    },
    {
      title: 'Messages',
      value: '0', // This would come from message service
      description: 'Unread messages',
      icon: MessageCircleIcon,
      href: '/messages',
      color: 'bg-purple-500',
    },
    {
      title: 'Notifications',
      value: '0', // This would come from notification service
      description: 'New notifications',
      icon: BellIcon,
      href: '/notifications',
      color: 'bg-orange-500',
    },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto py-6 px-4 max-w-6xl">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="text-center py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Royal Media
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Connect with friends, share your thoughts, and stay updated with your social network.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat) => (
              <Link key={stat.title} href={stat.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div className="relative">
                      <div className={`p-2 rounded-full ${stat.color} text-white`}>
                        <stat.icon className="h-4 w-4" />
                      </div>
                      {stat.badge && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                          {stat.value}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Recent Friend Requests */}
          {pendingReceivedCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Friend Requests
                  <Link href="/friends?tab=requests">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </CardTitle>
                <CardDescription>
                  You have {pendingReceivedCount} pending friend request{pendingReceivedCount !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {receivedRequests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          {request.sender?.firstName?.charAt(0)}{request.sender?.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {request.sender?.firstName} {request.sender?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{request.sender?.handle}
                          </p>
                        </div>
                      </div>
                      <Link href="/friends?tab=requests">
                        <Button size="sm">View</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Find Friends</CardTitle>
                <CardDescription>
                  Discover and connect with new people
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/friends?tab=search">
                  <Button className="w-full">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Search for Friends
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Start Messaging</CardTitle>
                <CardDescription>
                  Send messages to your friends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/messages">
                  <Button variant="outline" className="w-full">
                    <MessageCircleIcon className="h-4 w-4 mr-2" />
                    Open Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}