const API_BASE_URL = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const POSTS_API_BASE_URL = process.env.NEXT_PUBLIC_POSTS_SERVICE_URL || process.env.NEXT_PUBLIC_POSTS_API_URL || 'http://localhost:3002'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: string
  details?: unknown
}

export interface LoginRequest {
  email?: string
  username?: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  username: string
  handle?: string
}

export interface User {
  _id: string
  email: string
  firstName: string
  lastName: string
  handle: string
  username?: string
  role: string
  isVerified: boolean
  isActive: boolean
  profileImage?: string
  coverImage?: string
  bio?: string
  location?: string
  website?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface Post {
  _id: string
  id: string
  author: {
    _id: string
    firstName: string
    lastName: string
    username?: string
    handle: string
    profileImage?: string
    isVerified: boolean
  }
  content: string
  images?: string[]
  videos?: string[]
  hashtags?: string[]
  mentions?: string[]
  likesCount: number
  commentsCount: number
  sharesCount: number
  bookmarksCount: number
  isLiked?: boolean
  isBookmarked?: boolean
  isPublic: boolean
  location?: {
    name: string
    coordinates: [number, number]
  }
  timeAgo?: string
  createdAt: string
  updatedAt: string
}

export interface Comment {
  _id: string
  id: string
  post: string
  author: {
    _id: string
    firstName: string
    lastName: string
    username?: string
    handle: string
    profileImage?: string
  }
  content: string
  parentComment?: string
  likesCount: number
  createdAt: string
  updatedAt: string
}

export interface CreatePostRequest {
  content: string
  images?: string[]
  videos?: string[]
  location?: {
    name: string
    coordinates: [number, number]
  }
  isPublic?: boolean
}

export interface FeedResponse {
  posts: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface CommentsResponse {
  comments: Comment[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export interface TrendingHashtag {
  hashtag: string
  count: number
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('accessToken')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('accessToken', token)
      } else {
        localStorage.removeItem('accessToken')
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // Auth endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/api/auth/logout', {
      method: 'POST',
    })
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/api/auth/profile')
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string }>> {
    return this.request<{ accessToken: string }>('/api/auth/refresh', {
      method: 'POST',
    })
  }

  // User endpoints
  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request<User>('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getUserByHandle(handle: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/api/users/handle/${handle}`)
  }

  async searchUsers(query: string): Promise<ApiResponse<User[]>> {
    return this.request<User[]>(`/api/users/search?q=${encodeURIComponent(query)}`)
  }

  // Health check
  async healthCheck(): Promise<ApiResponse> {
    return this.request('/health')
  }

  // Posts endpoints
  private async postsRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${POSTS_API_BASE_URL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error('Posts API request failed:', error)
      throw error
    }
  }

  async getFeed(page: number = 1, limit: number = 20): Promise<ApiResponse<FeedResponse>> {
    return this.postsRequest<FeedResponse>(`/api/posts/feed?page=${page}&limit=${limit}`)
  }

  async createPost(postData: CreatePostRequest): Promise<ApiResponse<{ post: Post }>> {
    return this.postsRequest<{ post: Post }>('/api/posts', {
      method: 'POST',
      body: JSON.stringify(postData),
    })
  }

  async getPost(postId: string): Promise<ApiResponse<{ post: Post }>> {
    return this.postsRequest<{ post: Post }>(`/api/posts/${postId}`)
  }

  async deletePost(postId: string): Promise<ApiResponse> {
    return this.postsRequest(`/api/posts/${postId}`, {
      method: 'DELETE',
    })
  }

  async toggleLike(postId: string): Promise<ApiResponse<{ liked: boolean }>> {
    return this.postsRequest<{ liked: boolean }>(`/api/posts/${postId}/like`, {
      method: 'POST',
    })
  }

  async toggleBookmark(postId: string): Promise<ApiResponse<{ bookmarked: boolean }>> {
    return this.postsRequest<{ bookmarked: boolean }>(`/api/posts/${postId}/bookmark`, {
      method: 'POST',
    })
  }

  async getComments(postId: string, page: number = 1, limit: number = 20): Promise<ApiResponse<CommentsResponse>> {
    return this.postsRequest<CommentsResponse>(`/api/posts/${postId}/comments?page=${page}&limit=${limit}`)
  }

  async addComment(postId: string, content: string, parentCommentId?: string): Promise<ApiResponse<{ comment: Comment }>> {
    return this.postsRequest<{ comment: Comment }>(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parentCommentId }),
    })
  }

  async getTrendingHashtags(limit: number = 10): Promise<ApiResponse<{ hashtags: TrendingHashtag[] }>> {
    return this.postsRequest<{ hashtags: TrendingHashtag[] }>(`/api/posts/trending/hashtags?limit=${limit}`)
  }
}

export const apiClient = new ApiClient()
export default apiClient