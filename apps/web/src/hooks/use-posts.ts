import { useState, useEffect, useCallback } from 'react'
import { apiClient, Post, TrendingHashtag } from '@/lib/api-client'

interface UsePostsOptions {
  page?: number
  limit?: number
  autoFetch?: boolean
}

interface UsePostsReturn {
  posts: Post[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalPosts: number
  currentPage: number
  refreshFeed: () => Promise<void>
  loadMore: () => Promise<void>
  createPost: (content: string, images?: string[]) => Promise<boolean>
  toggleLike: (postId: string) => Promise<void>
  toggleBookmark: (postId: string) => Promise<void>
}

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const { page = 1, limit = 20, autoFetch = true } = options
  
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalPosts, setTotalPosts] = useState(0)
  const [currentPage, setCurrentPage] = useState(page)

  const fetchFeed = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getFeed(pageNum, limit)
      
      if (response.success && response.data) {
        const feedData = response.data
        
        if (append) {
          setPosts(prev => [...prev, ...feedData.posts])
        } else {
          setPosts(feedData.posts)
        }
        
        setHasMore(feedData.pagination.hasMore)
        setTotalPosts(feedData.pagination.total)
        setCurrentPage(pageNum)
      } else {
        throw new Error(response.message || 'Failed to fetch feed')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch posts'
      setError(errorMessage)
      console.error('Error fetching feed:', err)
    } finally {
      setLoading(false)
    }
  }, [limit])

  const refreshFeed = useCallback(async () => {
    await fetchFeed(1, false)
  }, [fetchFeed])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    await fetchFeed(currentPage + 1, true)
  }, [hasMore, loading, currentPage, fetchFeed])

  const createPost = useCallback(async (content: string, images?: string[]): Promise<boolean> => {
    try {
      setError(null)
      
      const response = await apiClient.createPost({
        content,
        images,
        isPublic: true
      })
      
      if (response.success && response.data) {
        // Add the new post to the beginning of the feed
        setPosts(prev => [response.data!.post, ...prev])
        setTotalPosts(prev => prev + 1)
        return true
      } else {
        throw new Error(response.message || 'Failed to create post')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post'
      setError(errorMessage)
      console.error('Error creating post:', err)
      return false
    }
  }, [])

  const toggleLike = useCallback(async (postId: string) => {
    try {
      const response = await apiClient.toggleLike(postId)
      
      if (response.success && response.data) {
        setPosts(prev => prev.map(post => {
          if (post._id === postId || post.id === postId) {
            return {
              ...post,
              isLiked: response.data!.liked,
              likesCount: response.data!.liked 
                ? post.likesCount + 1 
                : Math.max(0, post.likesCount - 1)
            }
          }
          return post
        }))
      }
    } catch (err) {
      console.error('Error toggling like:', err)
      setError('Failed to update like')
    }
  }, [])

  const toggleBookmark = useCallback(async (postId: string) => {
    try {
      const response = await apiClient.toggleBookmark(postId)
      
      if (response.success && response.data) {
        setPosts(prev => prev.map(post => {
          if (post._id === postId || post.id === postId) {
            return {
              ...post,
              isBookmarked: response.data!.bookmarked,
              bookmarksCount: response.data!.bookmarked 
                ? post.bookmarksCount + 1 
                : Math.max(0, post.bookmarksCount - 1)
            }
          }
          return post
        }))
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err)
      setError('Failed to update bookmark')
    }
  }, [])

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchFeed(page)
    }
  }, [autoFetch, page, fetchFeed])

  return {
    posts,
    loading,
    error,
    hasMore,
    totalPosts,
    currentPage,
    refreshFeed,
    loadMore,
    createPost,
    toggleLike,
    toggleBookmark
  }
}

// Hook for trending hashtags
export function useTrendingHashtags() {
  const [hashtags, setHashtags] = useState<TrendingHashtag[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTrendingHashtags = useCallback(async (limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await apiClient.getTrendingHashtags(limit)
      
      if (response.success && response.data) {
        setHashtags(response.data.hashtags)
      } else {
        throw new Error(response.message || 'Failed to fetch trending hashtags')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trending hashtags'
      setError(errorMessage)
      console.error('Error fetching trending hashtags:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTrendingHashtags()
  }, [fetchTrendingHashtags])

  return {
    hashtags,
    loading,
    error,
    refetch: fetchTrendingHashtags
  }
}