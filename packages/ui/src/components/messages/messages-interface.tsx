"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MessageCircle, 
  Send, 
  Search, 
  Plus, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Archive,
  Trash2,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Mic
} from 'lucide-react'
import { useSocket } from '@/hooks/use-socket'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Message {
  _id: string
  conversationId: string
  senderId: string
  content: string
  type: 'text' | 'image' | 'file' | 'voice'
  readBy: Array<{
    userId: string
    readAt: Date
  }>
  editedAt?: Date
  createdAt: Date
  updatedAt: Date
}

interface Conversation {
  _id: string
  participants: Array<{
    userId: string
    username: string
    displayName: string
    avatar?: string
    joinedAt: Date
  }>
  type: 'direct' | 'group'
  name?: string
  description?: string
  avatar?: string
  lastMessage?: Message
  unreadCount: number
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  currentUserId: string
}

function ConversationItem({ conversation, isActive, onClick, currentUserId }: ConversationItemProps) {
  const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId)
  const displayName = conversation.type === 'group' 
    ? conversation.name 
    : otherParticipant?.displayName || otherParticipant?.username

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
        isActive && "bg-muted"
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={conversation.avatar || otherParticipant?.avatar} />
          <AvatarFallback>
            {displayName?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {conversation.unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
          </Badge>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm truncate">{displayName}</h3>
          {conversation.lastMessage && (
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
            </span>
          )}
        </div>
        {conversation.lastMessage && (
          <p className="text-sm text-muted-foreground truncate mt-1">
            {conversation.lastMessage.content}
          </p>
        )}
      </div>
    </div>
  )
}

interface MessageItemProps {
  message: Message
  isOwn: boolean
  showAvatar: boolean
  participant?: any
}

function MessageItem({ message, isOwn, showAvatar, participant }: MessageItemProps) {
  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {showAvatar && !isOwn && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={participant?.avatar} />
          <AvatarFallback>
            {participant?.displayName?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={cn(
        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
        isOwn 
          ? "bg-primary text-primary-foreground ml-auto" 
          : "bg-muted"
      )}>
        <p className="text-sm">{message.content}</p>
        <p className={cn(
          "text-xs mt-1",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}

export function MessagesInterface() {
  const { socket, conversations, messages, sendMessage, isConnected } = useSocket()
  const [activeConversation, setActiveConversation] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Mock current user ID - in real app this would come from auth
  const currentUserId = 'current-user-id'

  const filteredConversations = conversations.filter(conv => {
    const otherParticipant = conv.participants.find(p => p.userId !== currentUserId)
    const displayName = conv.type === 'group' 
      ? conv.name 
      : otherParticipant?.displayName || otherParticipant?.username
    return displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const activeConversationData = conversations.find(c => c._id === activeConversation)
  const conversationMessages = messages[activeConversation || ''] || []

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeConversation) return

    sendMessage({
      conversationId: activeConversation,
      content: newMessage.trim(),
      type: 'text'
    })
    
    setNewMessage('')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Start New Conversation</DialogTitle>
                  <DialogDescription>
                    Search for users to start a new conversation
                  </DialogDescription>
                </DialogHeader>
                {/* New conversation form would go here */}
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No conversations yet</p>
              <p className="text-sm text-muted-foreground">Start a new chat to get started</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation._id}
                  conversation={conversation}
                  isActive={activeConversation === conversation._id}
                  onClick={() => setActiveConversation(conversation._id)}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activeConversationData?.avatar} />
                  <AvatarFallback>
                    {activeConversationData?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {activeConversationData?.name || 'Conversation'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isConnected ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Info className="w-4 h-4 mr-2" />
                      Conversation Info
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {conversationMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div>
                  {conversationMessages.map((message, index) => {
                    const isOwn = message.senderId === currentUserId
                    const showAvatar = !isOwn && (
                      index === 0 || 
                      conversationMessages[index - 1].senderId !== message.senderId
                    )
                    const participant = activeConversationData?.participants.find(
                      p => p.userId === message.senderId
                    )
                    
                    return (
                      <MessageItem
                        key={message._id}
                        message={message}
                        isOwn={isOwn}
                        showAvatar={showAvatar}
                        participant={participant}
                      />
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ImageIcon className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pr-12"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2"
                  >
                    <Smile className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* No Conversation Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-muted-foreground">
                Choose a conversation from the sidebar to start messaging
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}