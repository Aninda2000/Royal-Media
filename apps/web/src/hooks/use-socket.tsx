"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './use-auth'
import { toast } from 'sonner'

interface Message {
  _id: string
  conversationId: string
  senderId: string
  text?: string
  mediaUrls?: string[]
  messageType: 'text' | 'image' | 'video' | 'audio' | 'file' | 'system'
  replyToId?: string
  readBy: Array<{
    userId: string
    readAt: Date
  }>
  editedAt?: Date
  deletedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface Conversation {
  _id: string
  participantIds: string[]
  type: 'direct' | 'group'
  name?: string
  avatarUrl?: string
  lastMessageAt: Date
  lastMessage?: {
    text: string
    senderId: string
    createdAt: Date
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

interface TypingUser {
  userId: string
  conversationId: string
  isTyping: boolean
}

// Socket response interfaces
interface SocketResponse {
  success: boolean;
  error?: string;
}

interface SendMessageResponse extends SocketResponse {
  message?: Message;
}

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  messages: Record<string, Message[]> // conversationId -> messages
  conversations: Conversation[]
  typingUsers: TypingUser[]
  onlineUsers: string[]
  sendMessage: (conversationId: string, data: { text?: string; mediaUrls?: string[]; messageType?: string }) => Promise<void>
  joinConversation: (conversationId: string) => Promise<void>
  leaveConversation: (conversationId: string) => Promise<void>
  markAsRead: (conversationId: string, messageId?: string) => Promise<void>
  setTyping: (conversationId: string, isTyping: boolean) => void
  loadMessages: (conversationId: string, before?: string) => Promise<void>
  loadConversations: () => Promise<void>
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    const token = localStorage.getItem('accessToken')
    if (!token) return

    const newSocket = io(process.env.NEXT_PUBLIC_MESSAGE_SERVICE_URL || 'http://localhost:3003', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      toast.error('Failed to connect to messaging service')
    })

    // Message events
    newSocket.on('message_received', (data: { message: Message; conversationId: string }) => {
      const { message, conversationId } = data
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), message]
      }))
      
      // Update conversation last message
      setConversations(prev => prev.map(conv => 
        conv._id === conversationId 
          ? {
              ...conv,
              lastMessage: {
                text: message.text || '[Media]',
                senderId: message.senderId,
                createdAt: message.createdAt,
              },
              lastMessageAt: message.createdAt,
            }
          : conv
      ))

      // Show toast for new messages (if not from current user)
      if (message.senderId !== user._id) {
        toast.info('New message received')
      }
    })

    // Typing events
    newSocket.on('user_typing', (data: { conversationId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(t => !(t.conversationId === data.conversationId && t.userId === data.userId))
        if (data.isTyping) {
          return [...filtered, data]
        }
        return filtered
      })
    })

    // Read receipts
    newSocket.on('messages_read', (data: { conversationId: string; userId: string; messageId?: string; readAt: Date }) => {
      setMessages(prev => ({
        ...prev,
        [data.conversationId]: prev[data.conversationId]?.map(message => ({
          ...message,
          readBy: message.readBy.some(r => r.userId === data.userId) 
            ? message.readBy
            : [...message.readBy, { userId: data.userId, readAt: data.readAt }]
        })) || []
      }))
    })

    // User status events
    newSocket.on('user_status_changed', (data: { userId: string; status: 'online' | 'offline' }) => {
      setOnlineUsers(prev => {
        if (data.status === 'online') {
          return prev.includes(data.userId) ? prev : [...prev, data.userId]
        } else {
          return prev.filter(id => id !== data.userId)
        }
      })
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
    }
  }, [isAuthenticated, user])

  const sendMessage = async (conversationId: string, data: { text?: string; mediaUrls?: string[]; messageType?: string }) => {
    if (!socket) throw new Error('Socket not connected')

    return new Promise<void>((resolve, reject) => {
      socket.emit('send_message', { conversationId, ...data }, (response: SendMessageResponse) => {
        if (response.success && response.message) {
          // Add message to local state
          setMessages(prev => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), response.message!]
          }))
          resolve()
        } else {
          reject(new Error(response.error || 'Failed to send message'))
        }
      })
    })
  }

  const joinConversation = async (conversationId: string) => {
    if (!socket) throw new Error('Socket not connected')

    return new Promise<void>((resolve, reject) => {
      socket.emit('join_conversation', { conversationId }, (response: SocketResponse) => {
        if (response.success) {
          resolve()
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  const leaveConversation = async (conversationId: string) => {
    if (!socket) throw new Error('Socket not connected')

    return new Promise<void>((resolve, reject) => {
      socket.emit('leave_conversation', { conversationId }, (response: SocketResponse) => {
        if (response.success) {
          resolve()
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  const markAsRead = async (conversationId: string, messageId?: string) => {
    if (!socket) throw new Error('Socket not connected')

    return new Promise<void>((resolve, reject) => {
      socket.emit('mark_as_read', { conversationId, messageId }, (response: SocketResponse) => {
        if (response.success) {
          resolve()
        } else {
          reject(new Error(response.error))
        }
      })
    })
  }

  const setTyping = (conversationId: string, isTyping: boolean) => {
    if (!socket) return
    socket.emit('typing', { conversationId, isTyping })
  }

  const loadMessages = async (conversationId: string, before?: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const params = new URLSearchParams()
      if (before) params.append('before', before)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MESSAGE_SERVICE_URL || 'http://localhost:3003'}/api/messages/${conversationId}?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to load messages')

      const data = await response.json()
      if (data.success) {
        setMessages(prev => ({
          ...prev,
          [conversationId]: before 
            ? [...data.data.messages, ...(prev[conversationId] || [])]
            : data.data.messages
        }))
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MESSAGE_SERVICE_URL || 'http://localhost:3003'}/api/conversations`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to load conversations')

      const data = await response.json()
      if (data.success) {
        setConversations(data.data.conversations)
      }
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversations')
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    messages,
    conversations,
    typingUsers,
    onlineUsers,
    sendMessage,
    joinConversation,
    leaveConversation,
    markAsRead,
    setTyping,
    loadMessages,
    loadConversations,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}