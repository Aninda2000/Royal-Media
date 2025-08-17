import { useState } from "react"
import { Post as PostType } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  MoreHorizontal,
  Image as ImageIcon
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PostProps {
  post: PostType
  onLike?: (postId: string) => void
  onBookmark?: (postId: string) => void
  onComment?: (postId: string) => void
  onShare?: (postId: string) => void
}

export function Post({ post, onLike, onBookmark, onComment, onShare }: PostProps) {
  const [isLiking, setIsLiking] = useState(false)
  const [isBookmarking, setIsBookmarking] = useState(false)

  const handleLike = async () => {
    if (isLiking || !onLike) return
    setIsLiking(true)
    try {
      await onLike(post._id || post.id)
    } finally {
      setIsLiking(false)
    }
  }

  const handleBookmark = async () => {
    if (isBookmarking || !onBookmark) return
    setIsBookmarking(true)
    try {
      await onBookmark(post._id || post.id)
    } finally {
      setIsBookmarking(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return post.timeAgo || 'some time ago'
    }
  }

  const renderHashtags = (content: string) => {
    return content.replace(/#(\w+)/g, '<span class="text-blue-600 hover:text-blue-700 cursor-pointer">#$1</span>')
  }

  const renderMentions = (content: string) => {
    return content.replace(/@(\w+)/g, '<span class="text-blue-600 hover:text-blue-700 cursor-pointer">@$1</span>')
  }

  const processContent = (content: string) => {
    let processed = renderHashtags(content)
    processed = renderMentions(processed)
    return processed
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
      <div className="flex space-x-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={post.author?.profileImage} />
          <AvatarFallback>
            {post.author?.firstName?.[0] ?? ''}{post.author?.lastName?.[0] ?? ''}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-semibold text-gray-900 truncate">
              {post.author?.firstName} {post.author?.lastName}
            </h4>
            {post.author?.isVerified && (
              <Badge variant="secondary" className="text-xs">
                ✓ Verified
              </Badge>
            )}
            <span className="text-gray-500 text-sm truncate">
              @{post.author?.handle || post.author?.username}
            </span>
            <span className="text-gray-500 text-sm">·</span>
            <span className="text-gray-500 text-sm whitespace-nowrap">
              {formatTimeAgo(post.createdAt)}
            </span>
            <div className="ml-auto">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="mb-3">
            <p 
              className="text-gray-900 whitespace-pre-wrap break-words"
              dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
            />
          </div>
          
          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mb-3">
              {post.images.length === 1 ? (
                <div className="rounded-lg overflow-hidden">
                  <div className="relative w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                    <span className="absolute bottom-2 right-2 text-xs text-gray-500 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
                      Image
                    </span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
                  {post.images.slice(0, 4).map((image, index) => (
                    <div key={index} className="relative aspect-square bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                      {index === 3 && post.images!.length > 4 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">
                            +{post.images!.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Location */}
          {post.location && (
            <div className="mb-3 text-sm text-gray-600">
              📍 {post.location.name}
            </div>
          )}
          
          {/* Action buttons */}
          <div className="flex items-center justify-between max-w-md">
            <Button
              variant="ghost"
              size="sm"
              className={`${post.isLiked ? "text-red-500" : "text-gray-500"} hover:text-red-500 hover:bg-red-50`}
              onClick={handleLike}
              disabled={isLiking}
            >
              <Heart className={`h-4 w-4 mr-2 ${post.isLiked ? "fill-current" : ""}`} />
              {post.likesCount || 0}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-blue-500 hover:bg-blue-50"
              onClick={() => onComment?.(post._id || post.id)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {post.commentsCount || 0}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-500 hover:text-green-500 hover:bg-green-50"
              onClick={() => onShare?.(post._id || post.id)}
            >
              <Share2 className="h-4 w-4 mr-2" />
              {post.sharesCount || 0}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className={`${post.isBookmarked ? "text-blue-500" : "text-gray-500"} hover:text-blue-500 hover:bg-blue-50`}
              onClick={handleBookmark}
              disabled={isBookmarking}
            >
              <Bookmark className={`h-4 w-4 ${post.isBookmarked ? "fill-current" : ""}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}