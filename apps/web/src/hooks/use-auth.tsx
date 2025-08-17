"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import apiClient, { type User, type LoginRequest, type RegisterRequest } from "@/lib/api-client"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (credentials: LoginRequest) => Promise<void>
  register: (userData: RegisterRequest) => Promise<void>
  logout: () => void
  refetchUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const router = useRouter()
  const queryClient = useQueryClient()

  // Get user profile
  const {
    data: user,
    isLoading,
    refetch: refetchUser,
    error: userError,
  } = useQuery({
    queryKey: ["auth", "profile"],
    queryFn: async () => {
      const response = await apiClient.getProfile()
      return response.data || null
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Check if user is authenticated on mount
  useEffect(() => {
    console.log("AuthProvider: Checking for existing token")
    const token = localStorage.getItem("accessToken")
    console.log("AuthProvider: Found token:", !!token)
    
    if (token) {
      // Check if token is expired
      try {
        const payload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        
        if (payload.exp && payload.exp < currentTime) {
          console.log("AuthProvider: Token is expired, clearing auth state")
          localStorage.removeItem("accessToken")
          localStorage.removeItem("refreshToken")
          setInitializing(false)
          return
        }
      } catch (err) {
        console.log("AuthProvider: Invalid token format, clearing auth state", err)
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        setInitializing(false)
        return
      }
      
      console.log("AuthProvider: Setting authenticated to true")
      setIsAuthenticated(true)
      apiClient.setToken(token)
      // Don't automatically fetch user profile on mount to avoid blocking the UI
      // The profile will be fetched when needed by the useQuery
    } else {
      console.log("AuthProvider: No token found, user not authenticated")
    }
    
    console.log("AuthProvider: Setting initializing to false")
    setInitializing(false)
  }, [])

  // Handle profile API errors
  useEffect(() => {
    if (userError && isAuthenticated) {
      console.log("AuthProvider: Profile API error:", userError)
      
      // Check if it's an authentication error (401/403) or token invalid
      const errorMessage = userError.message?.toLowerCase() || ''
      const errorString = JSON.stringify(userError).toLowerCase()
      
      const isAuthError = errorMessage.includes('401') || 
                         errorMessage.includes('403') || 
                         errorMessage.includes('unauthorized') ||
                         errorMessage.includes('invalid token') ||
                         errorMessage.includes('token') ||
                         errorString.includes('401') ||
                         errorString.includes('invalid_token') ||
                         errorString.includes('unauthorized')
      
      if (isAuthError) {
        console.log("AuthProvider: Authentication error detected, attempting token refresh")
        
        // Try to refresh token first
        const refreshToken = localStorage.getItem("refreshToken")
        if (refreshToken) {
          console.log("AuthProvider: Attempting to refresh token")
          // Try refresh token (implement this later if needed)
          // For now, just clear auth state
        }
        
        console.log("AuthProvider: Clearing auth state")
        setIsAuthenticated(false)
        apiClient.setToken(null)
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        queryClient.clear()
      } else {
        console.log("AuthProvider: Non-auth error, keeping user logged in")
      }
    }
  }, [userError, isAuthenticated, queryClient])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.login(credentials)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Login failed")
      }
      return response.data
    },
    onSuccess: (data) => {
      apiClient.setToken(data.accessToken)
      setIsAuthenticated(true)
      localStorage.setItem("refreshToken", data.refreshToken)
      
      // Set user data in query cache
      queryClient.setQueryData(["auth", "profile"], data.user)
      
      toast.success("Welcome back!")
      router.push("/feed")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Login failed")
    },
  })

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterRequest) => {
      const response = await apiClient.register(userData)
      if (!response.success || !response.data) {
        throw new Error(response.error || "Registration failed")
      }
      return response.data
    },
    onSuccess: (data) => {
      apiClient.setToken(data.accessToken)
      setIsAuthenticated(true)
      localStorage.setItem("refreshToken", data.refreshToken)
      
      // Set user data in query cache
      queryClient.setQueryData(["auth", "profile"], data.user)
      
      toast.success("Welcome to Royal Media!")
      router.push("/feed")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Registration failed")
    },
  })

  // Logout function
  const logout = async () => {
    try {
      await apiClient.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear auth state
      apiClient.setToken(null)
      setIsAuthenticated(false)
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      
      // Clear all queries
      queryClient.clear()
      
      toast.success("Logged out successfully")
      router.push("/")
    }
  }

  const value: AuthContextType = {
    user: user || null,
    isLoading: initializing || isLoading || loginMutation.isPending || registerMutation.isPending,
    isAuthenticated,
    login: async (credentials: LoginRequest) => {
      await loginMutation.mutateAsync(credentials)
    },
    register: async (userData: RegisterRequest) => {
      await registerMutation.mutateAsync(userData)
    },
    logout,
    refetchUser: () => refetchUser(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// Custom hook for protected routes
export function useRequireAuth() {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log("useRequireAuth effect:", { isLoading, isAuthenticated, user: !!user })
    
    // If we're done loading and user is not authenticated, redirect immediately
    if (!isLoading && !isAuthenticated) {
      console.log("Redirecting to login - user not authenticated")
      window.location.replace("/login")
      return
    }
    
    // If we have authentication but no user data due to API issues, 
    // still allow access (graceful degradation)
    if (!isLoading && isAuthenticated && !user) {
      console.log("User authenticated but profile unavailable - allowing access")
    }
  }, [isAuthenticated, isLoading, user, router])

  // If not loading and not authenticated, show loading while redirecting
  if (!isLoading && !isAuthenticated) {
    return { 
      user: null, 
      isAuthenticated: false, 
      isLoading: true // Keep showing loading during redirect
    }
  }

  return { user, isAuthenticated, isLoading }
}