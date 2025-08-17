import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Image as ImageIcon,
  Video,
  Smile,
  MapPin,
  X
} from "lucide-react"
import { User } from "@/lib/api-client"

interface CreatePostProps {
  user: User | null
  onPost: (content: string, images?: string[]) => Promise<boolean>
}

export function CreatePost({ user, onPost }: CreatePostProps) {
  const [content, setContent] = useState("")
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Don't render if user is not available
  if (!user) {
    return null
  }

  const handleSubmit = async () => {
    if (!content.trim() || isPosting) return

    setIsPosting(true)
    setError(null)

    try {
      const success = await onPost(content.trim())
      if (success) {
        setContent("")
      } else {
        setError("Failed to create post. Please try again.")
      }
    } catch {
      setError("Failed to create post. Please try again.")
    } finally {
      setIsPosting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const remainingChars = 280 - content.length
  const isOverLimit = remainingChars < 0
  const canPost = content.trim().length > 0 && !isOverLimit && !isPosting

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={user?.profileImage} />
            <AvatarFallback>
              {user?.firstName?.[0] ?? ''}{user?.lastName?.[0] ?? ''}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What's happening?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg placeholder-gray-500"
              rows={3}
              maxLength={500}
            />
            
            {error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-600">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setError(null)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-3">
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  disabled={isPosting}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  disabled={isPosting}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Video
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  disabled={isPosting}
                >
                  <Smile className="h-4 w-4 mr-2" />
                  Emoji
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  disabled={isPosting}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Location
                </Button>
              </div>
              
              <div className="flex items-center space-x-3">
                {content.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <div className={`text-sm ${isOverLimit ? 'text-red-500' : remainingChars <= 20 ? 'text-yellow-500' : 'text-gray-500'}`}>
                      {remainingChars}
                    </div>
                    <div className="w-8 h-8 relative">
                      <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          className="text-gray-200"
                        />
                        <circle
                          cx="16"
                          cy="16"
                          r="14"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 14}`}
                          strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min(content.length / 280, 1))}`}
                          className={isOverLimit ? 'text-red-500' : remainingChars <= 20 ? 'text-yellow-500' : 'text-blue-500'}
                        />
                      </svg>
                    </div>
                  </div>
                )}
                
                <Button
                  onClick={handleSubmit}
                  disabled={!canPost}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6"
                >
                  {isPosting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Posting...</span>
                    </div>
                  ) : (
                    "Post"
                  )}
                </Button>
              </div>
            </div>
            
            {content.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Press Cmd/Ctrl + Enter to post
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}