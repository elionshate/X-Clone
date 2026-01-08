'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Repeat2, Bookmark, Share, Send, Eye, ChevronLeft, ChevronRight, MoreHorizontal, Trash2 } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { commentAPI, tweetAPI } from '@/lib/api';
import Link from 'next/link';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  likeCount: number;
  viewCount: number;
  retweetCount: number;
  author: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
  isRetweeted?: boolean;
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

interface Tweet {
  id: number;
  content: string;
  createdAt: string;
  likeCount: number;
  retweetCount: number;
  viewCount: number;
  commentsEnabled: boolean;
  location?: string;
  authorId?: number;
  author?: {
    id: number;
    name: string;
    username: string;
    email?: string;
    avatar?: string;
  };
  media?: {
    id: number;
    mediaUrl: string;
    mediaType: string;
  }[];
  comments?: Comment[];
}

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweet: Tweet | null;
  currentUserId: number | null;
  onLikeTweet?: (tweetId: number) => void;
  onRetweetTweet?: (tweetId: number) => void;
  onBookmarkTweet?: (tweetId: number) => void;
  isLiked?: boolean;
  isRetweeted?: boolean;
  isBookmarked?: boolean;
}

export function PostDetailModal({
  isOpen,
  onClose,
  tweet,
  currentUserId,
  onLikeTweet,
  onRetweetTweet,
  onBookmarkTweet,
  isLiked = false,
  isRetweeted = false,
  isBookmarked = false,
}: PostDetailModalProps) {
  const { theme } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && tweet && currentUserId) {
      loadComments();
    }
  }, [isOpen, tweet?.id, currentUserId]);

  useEffect(() => {
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const loadComments = async () => {
    if (!tweet || !currentUserId) return;
    setLoading(true);
    try {
      const data = await commentAPI.getCommentsWithInteractions(tweet.id, currentUserId);
      setComments(Array.isArray(data) ? data : []);
      
      // Increment view counts for visible comments
      if (Array.isArray(data) && data.length > 0) {
        const commentIds = data.map((c: Comment) => c.id);
        commentAPI.incrementViewCountBatch(commentIds).catch(console.error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !tweet || !currentUserId) return;
    
    try {
      await commentAPI.createComment({
        content: newComment,
        tweetId: tweet.id,
        authorId: currentUserId,
      });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleReply = async (parentComment: Comment) => {
    if (!replyContent.trim() || !tweet || !currentUserId) return;
    
    try {
      await commentAPI.createReply({
        content: replyContent,
        tweetId: tweet.id,
        authorId: currentUserId,
        parentId: parentComment.id,
      });
      setReplyContent('');
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleLikeComment = async (comment: Comment) => {
    if (!currentUserId) return;
    
    try {
      if (comment.isLiked) {
        await commentAPI.unlikeComment(comment.id, currentUserId);
      } else {
        await commentAPI.likeComment(comment.id, currentUserId);
      }
      setComments(prev => prev.map(c => 
        c.id === comment.id 
          ? { ...c, isLiked: !c.isLiked, likeCount: c.isLiked ? c.likeCount - 1 : c.likeCount + 1 }
          : c
      ));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleBookmarkComment = async (comment: Comment) => {
    if (!currentUserId) return;
    
    try {
      if (comment.isBookmarked) {
        await commentAPI.unbookmarkComment(comment.id, currentUserId);
      } else {
        await commentAPI.bookmarkComment(comment.id, currentUserId);
      }
      setComments(prev => prev.map(c => 
        c.id === comment.id 
          ? { ...c, isBookmarked: !c.isBookmarked }
          : c
      ));
    } catch (error) {
      console.error('Error bookmarking comment:', error);
    }
  };

  const handleRetweetComment = async (comment: Comment) => {
    if (!currentUserId) return;
    
    try {
      if (comment.isRetweeted) {
        await commentAPI.unretweetComment(comment.id, currentUserId);
      } else {
        await commentAPI.retweetComment(comment.id, currentUserId);
      }
      setComments(prev => prev.map(c => 
        c.id === comment.id 
          ? { ...c, isRetweeted: !c.isRetweeted, retweetCount: c.isRetweeted ? c.retweetCount - 1 : c.retweetCount + 1 }
          : c
      ));
    } catch (error) {
      console.error('Error retweeting comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await commentAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (!isOpen || !tweet) return null;

  const hasMedia = tweet.media && tweet.media.length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`relative z-10 flex w-full max-w-6xl h-[90vh] mx-4 rounded-xl overflow-hidden ${
          theme === 'dark' ? 'bg-black' : 'bg-white'
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-4 left-4 z-20 p-2 rounded-full ${
            theme === 'dark' 
              ? 'bg-gray-800/80 hover:bg-gray-700 text-white' 
              : 'bg-white/80 hover:bg-gray-100 text-black'
          }`}
        >
          <X size={20} />
        </button>

        {/* Left side - Image(s)/Video(s) */}
        {hasMedia && (
          <div className="flex-1 relative bg-black flex items-center justify-center">
            {tweet.media![currentImageIndex].mediaType === 'video' ? (
              <video
                src={tweet.media![currentImageIndex].mediaUrl}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <img
                src={tweet.media![currentImageIndex].mediaUrl}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            )}
            
            {/* Image navigation */}
            {tweet.media!.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentImageIndex === 0}
                  className={`absolute left-4 p-2 rounded-full bg-black/50 text-white ${
                    currentImageIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/70'
                  }`}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex(prev => Math.min(tweet.media!.length - 1, prev + 1))}
                  disabled={currentImageIndex === tweet.media!.length - 1}
                  className={`absolute right-4 p-2 rounded-full bg-black/50 text-white ${
                    currentImageIndex === tweet.media!.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-black/70'
                  }`}
                >
                  <ChevronRight size={24} />
                </button>
                
                {/* Dots indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {tweet.media!.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`w-2 h-2 rounded-full ${
                        idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Right side - Post details and comments */}
        <div className={`${hasMedia ? 'w-[400px]' : 'flex-1'} flex flex-col border-l ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          {/* Post author info */}
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <Link href={`/pages/user/${tweet.author?.username || ''}`}>
                <div className={`w-10 h-10 rounded-full overflow-hidden ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                }`}>
                  {tweet.author?.avatar && (
                    <img src={tweet.author.avatar} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
              </Link>
              <div className="flex-1">
                <Link href={`/pages/user/${tweet.author?.username || ''}`} className="hover:underline">
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {tweet.author?.name || 'Unknown'}
                  </span>
                </Link>
                <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                  @{tweet.author?.username || 'unknown'}
                </p>
              </div>
            </div>
            
            {/* Post content */}
            <p className={`mt-3 text-lg ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {tweet.content}
            </p>
            
            <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              {formatDate(tweet.createdAt)}
            </p>

            {/* Post stats */}
            <div className={`flex gap-4 mt-3 py-3 border-t border-b text-sm ${
              theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
            }`}>
              <span><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>{formatNumber(tweet.retweetCount)}</strong> Reposts</span>
              <span><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>{formatNumber(tweet.likeCount)}</strong> Likes</span>
              <span><strong className={theme === 'dark' ? 'text-white' : 'text-black'}>{formatNumber(tweet.viewCount)}</strong> Views</span>
            </div>

            {/* Post actions */}
            <div className={`flex justify-around py-2 border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button className={`p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}>
                <MessageCircle size={20} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} />
              </button>
              <button 
                onClick={() => onRetweetTweet?.(tweet.id)}
                className={`p-2 rounded-full transition-colors ${
                  isRetweeted 
                    ? 'text-green-500' 
                    : theme === 'dark' ? 'text-gray-500 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Repeat2 size={20} />
              </button>
              <button 
                onClick={() => onLikeTweet?.(tweet.id)}
                className={`p-2 rounded-full transition-colors ${
                  isLiked 
                    ? 'text-red-500' 
                    : theme === 'dark' ? 'text-gray-500 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              <button 
                onClick={() => onBookmarkTweet?.(tweet.id)}
                className={`p-2 rounded-full transition-colors ${
                  isBookmarked 
                    ? 'text-blue-500' 
                    : theme === 'dark' ? 'text-gray-500 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
              </button>
              <button className={`p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-600'
              }`}>
                <Share size={20} />
              </button>
            </div>
          </div>

          {/* Comments section */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading comments...
              </div>
            ) : comments.length === 0 ? (
              <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No comments yet. Be the first to comment!
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className={`p-4 border-b ${
                  theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                }`}>
                  <div className="flex gap-3">
                    <Link href={`/pages/user/${comment.author.username}`}>
                      <div className={`w-8 h-8 rounded-full flex-shrink-0 overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        {comment.author.avatar && (
                          <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link href={`/pages/user/${comment.author.username}`} className="hover:underline">
                            <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                              {comment.author.name}
                            </span>
                          </Link>
                          <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                            @{comment.author.username}
                          </span>
                        </div>
                        {comment.author.id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className={`p-1 rounded-full ${
                              theme === 'dark' ? 'hover:bg-gray-800 text-gray-500' : 'hover:bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      
                      <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {comment.content}
                      </p>
                      
                      {/* Comment actions */}
                      <div className={`flex items-center gap-4 mt-2 text-xs ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                        <button 
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          className="flex items-center gap-1 hover:text-blue-500"
                        >
                          <MessageCircle size={14} />
                          {comment._count?.replies || 0}
                        </button>
                        <button 
                          onClick={() => handleRetweetComment(comment)}
                          className={`flex items-center gap-1 ${comment.isRetweeted ? 'text-green-500' : 'hover:text-green-500'}`}
                        >
                          <Repeat2 size={14} />
                          {comment.retweetCount || 0}
                        </button>
                        <button 
                          onClick={() => handleLikeComment(comment)}
                          className={`flex items-center gap-1 ${comment.isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
                        >
                          <Heart size={14} fill={comment.isLiked ? 'currentColor' : 'none'} />
                          {comment.likeCount || 0}
                        </button>
                        <span className="flex items-center gap-1">
                          <Eye size={14} />
                          {formatNumber(comment.viewCount || 0)}
                        </span>
                        <button 
                          onClick={() => handleBookmarkComment(comment)}
                          className={`flex items-center gap-1 ${comment.isBookmarked ? 'text-blue-500' : 'hover:text-blue-500'}`}
                        >
                          <Bookmark size={14} fill={comment.isBookmarked ? 'currentColor' : 'none'} />
                        </button>
                      </div>

                      {/* Reply input */}
                      {replyingTo === comment.id && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className={`flex-1 px-3 py-1.5 rounded-full text-sm ${
                              theme === 'dark' 
                                ? 'bg-gray-800 text-white placeholder-gray-500 border-gray-700' 
                                : 'bg-gray-100 text-black placeholder-gray-500 border-gray-300'
                            } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && replyContent.trim()) {
                                handleReply(comment);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleReply(comment)}
                            disabled={!replyContent.trim()}
                            className={`p-1.5 rounded-full ${
                              replyContent.trim()
                                ? 'bg-blue-500 text-white hover:bg-blue-600'
                                : theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                            }`}
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      )}

                      {/* Replies preview */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className={`mt-2 pl-4 border-l-2 ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="mt-2">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-xs ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                                  {reply.author.name}
                                </span>
                                <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                                  @{reply.author.username}
                                </span>
                              </div>
                              <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                {reply.content}
                              </p>
                            </div>
                          ))}
                          {comment._count && comment._count.replies > 3 && (
                            <button className="text-xs text-blue-500 mt-1 hover:underline">
                              View {comment._count.replies - 3} more replies
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment input */}
          {tweet.commentsEnabled && (
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post your reply"
                  className={`flex-1 px-4 py-2 rounded-full ${
                    theme === 'dark' 
                      ? 'bg-gray-800 text-white placeholder-gray-500 border-gray-700' 
                      : 'bg-gray-100 text-black placeholder-gray-500 border-gray-300'
                  } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newComment.trim()) {
                      handleSubmitComment();
                    }
                  }}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim()}
                  className={`px-4 py-2 rounded-full font-bold ${
                    newComment.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
