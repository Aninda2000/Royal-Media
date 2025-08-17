"use client"

import { useState } from "react"
import { useRequireAuth } from "@/hooks/use-auth"
import { usePosts, useTrendingHashtags } from "@/hooks/use-posts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Post } from "@/components/Post"
import { CreatePost } from "@/components/CreatePost"
import { MainLayout } from "@/components/MainLayout"
import { 
  Home,
  RefreshCw,
  Loader2,
  TrendingUp
} from "lucide-react"

// Force dynamic rendering to avoid build-time issues with user authentication
export const dynamic = 'force-dynamic'

const suggestedUsers = [
  {
    name: "David Wilson",
    username: "david_w",
    avatar: "/avatars/david.jpg",
    followers: "1.2K",
    mutual: 5
  },
  {
    name: "Emma Brown",
    username: "emma_b",
    avatar: "/avatars/emma.jpg",
    followers: "890",
    mutual: 3
  },
  {
    name: "Frank Miller",
    username: "frank_m",
    avatar: "/avatars/frank.jpg",
    followers: "2.1K",
    mutual: 8
  }
]

export default function FeedPage() {
  const { user, isLoading: authLoading } = useRequireAuth()
  const { 
    posts, 
    loading: postsLoading, 
    error: postsError, 
    hasMore, 
    refreshFeed, 
    loadMore, 
    createPost, 
    toggleLike, 
    toggleBookmark 
  } = usePosts()
  const { hashtags: trendingHashtags } = useTrendingHashtags()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshFeed()
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleCreatePost = async (content: string, images?: string[]) => {
    return await createPost(content, images)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your feed...</p>
        </div>
      </div>
    )
  }

  // useRequireAuth will handle redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // Create fallback user data if profile is incomplete due to API issues
  const currentUser = user || {
    firstName: "User",
    lastName: "",
    username: "user", 
    handle: "user",
    profileImage: undefined
  }

  return (
    <MainLayout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Feed Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header with refresh button */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Home</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
          </div>

          {/* Create Post */}
          <CreatePost user={currentUser} onPost={handleCreatePost} />

          {/* Posts Error */}
          {postsError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-red-600">⚠️</div>
                  <div>
                    <p className="text-red-800 font-medium">Failed to load posts</p>
                    <p className="text-red-600 text-sm">{postsError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      className="mt-2"
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts Loading */}
          {postsLoading && posts.length === 0 && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-gray-600">Loading your feed...</p>
              </div>
            </div>
          )}

          {/* Posts */}
          {posts.length > 0 ? (
            <>
              {posts.map((post) => (
                <Post
                  key={post._id || post.id}
                  post={post}
                  onLike={toggleLike}
                  onBookmark={toggleBookmark}
                />
              ))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={postsLoading}
                    className="flex items-center space-x-2"
                  >
                    {postsLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <span>Load More Posts</span>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : !postsLoading && !postsError && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Welcome to Royal Media!</h3>
                  <p className="text-sm">
                    Your feed is empty. Start following people or create your first post to see content here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Suggested for you</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suggestedUsers.map((suggestedUser, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                        {suggestedUser.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{suggestedUser.name}</p>
                        <p className="text-xs text-gray-500">@{suggestedUser.username}</p>
                        <p className="text-xs text-gray-500">{suggestedUser.mutual} mutual friends</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">Follow</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What&apos;s happening</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trendingHashtags && trendingHashtags.length > 0 ? (
                  trendingHashtags.map((topic, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-blue-600">#{topic.hashtag}</p>
                        <p className="text-sm text-gray-500">{topic.count} posts</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  ))
                ) : (
                  <>
                    <div>
                      <p className="font-semibold text-sm">Tech Conference 2024</p>
                      <p className="text-xs text-gray-500">Technology · Trending</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">New Social Features</p>
                      <p className="text-xs text-gray-500">Royal Media · 2,340 posts</p>
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Weekend Vibes</p>
                      <p className="text-xs text-gray-500">Trending · 1,890 posts</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}