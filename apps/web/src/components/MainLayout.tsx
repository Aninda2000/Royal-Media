'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useRequireAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Home,
  Bell,
  Mail,
  Settings,
  User,
  Search,
  Bookmark,
  Users,
  Crown
} from 'lucide-react';
import Image from 'next/image';

interface MainLayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  {
    name: 'Home',
    href: '/feed',
    icon: Home,
  },
  {
    name: 'Friends',
    href: '/friends',
    icon: Users,
  },
  {
    name: 'Explore',
    href: '/explore',
    icon: Search,
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    name: 'Messages',
    href: '/messages',
    icon: Mail,
  },
  {
    name: 'Bookmarks',
    href: '/bookmarks',
    icon: Bookmark,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useRequireAuth();

  // Create fallback user data if profile is incomplete due to API issues
  const currentUser = user || {
    firstName: "User",
    lastName: "",
    username: "user", 
    handle: "user",
    profileImage: undefined
  };

  const isActive = (href: string) => {
    if (href === '/feed') {
      return pathname === '/feed' || pathname === '/';
    }
    return pathname === href;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Image
                src="/logo.svg"
                alt="Royal Media"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </div>
            
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Royal Media..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Top Navigation Icons */}
            <div className="flex items-center space-x-2">
              {navigationItems.slice(0, 5).map((item) => (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  size="sm"
                  onClick={() => router.push(item.href)}
                  title={item.name}
                >
                  <item.icon className="h-5 w-5" />
                </Button>
              ))}
              
              <Separator orientation="vertical" className="h-6 mx-2" />
              
              <Avatar className="h-8 w-8 cursor-pointer" onClick={() => router.push('/profile')}>
                <AvatarImage src={currentUser?.profileImage} />
                <AvatarFallback>
                  {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4">
                    <AvatarImage src={currentUser?.profileImage} />
                    <AvatarFallback className="text-xl">
                      {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </h3>
                  <p className="text-gray-600">@{currentUser?.username || currentUser?.handle}</p>
                  <div className="flex items-center justify-center mt-2">
                    <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-gray-600">Royal Member</span>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Following</span>
                    <span className="font-semibold">128</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Followers</span>
                    <span className="font-semibold">456</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Posts</span>
                    <span className="font-semibold">89</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.name}
                  variant={isActive(item.href) ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                </Button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © Design and Developed by Aninda Sundar Roy
          </p>
        </div>
      </footer>
    </div>
  );
}