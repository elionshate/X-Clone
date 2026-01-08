'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, MessageCircle, Repeat2, Bookmark, Share, Send, Eye, Trash2, MapPin } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { commentAPI } from '@/lib/api';
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
}

interface ExpandedPostProps {
  tweet: Tweet;
  currentUserId: number | null;
  onClose: () => void;
  onLikeTweet?: () => void;
  onRetweetTweet?: () => void;
  onBookmarkTweet?: () => void;
  isLiked?: boolean;
  isRetweeted?: boolean;
  isBookmarked?: boolean;
}

export function ExpandedPost({
  tweet,
  currentUserId,
  onClose,
  onLikeTweet,
  onRetweetTweet,
  onBookmarkTweet,
  isLiked = false,
  isRetweeted = false,
  isBookmarked = false,
}: ExpandedPostProps) {
  const { theme } = useTheme();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    if (currentUserId) {
      loadComments();
    }
  }, [tweet.id, currentUserId]);

  const loadComments = async () => {
    if (!currentUserId) return;
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
    if (!newComment.trim() || !currentUserId) return;
    
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
    if (!replyContent.trim() || !currentUserId) return;
    
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header with back button */}
      <div className={`sticky top-0 z-10 p-4 flex items-center gap-4 backdrop-blur ${
        theme === 'dark' ? 'bg-black/80' : 'bg-white/80'
      }`}>
        <button
          onClick={onClose}
          className={`p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
          }`}
        >
          <ArrowLeft size={20} className={theme === 'dark' ? 'text-white' : 'text-black'} />
        </button>
        <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          Post
        </h2>
      </div>

      {/* Post content */}
      <div className="p-4">
        {/* Author info */}
        <div className="flex items-start gap-3">
          <Link href={`/pages/user/${tweet.author?.username || ''}`}>
            <div className={`w-12 h-12 rounded-full overflow-hidden ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            }`}>
              {tweet.author?.avatar && (
                <img src={tweet.author.avatar} alt="" className="w-full h-full object-cover" />
              )}
            </div>
          </Link>
          <div>
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

        {/* Post text */}
        <p className={`mt-4 text-xl ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
          {tweet.content}
        </p>

        {/* Location */}
        {tweet.location && (
          <div className={`mt-2 flex items-center gap-1 text-sm ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          }`}>
            <MapPin size={14} />
            <span>{tweet.location}</span>
          </div>
        )}

        {/* Timestamp */}
        <p className={`mt-4 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          {formatDate(tweet.createdAt)}
        </p>

        {/* Stats */}
        <div className={`flex gap-4 mt-4 py-4 border-t border-b text-sm ${
          theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-600'
        }`}>
          <span>
            <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>
              {formatNumber(tweet.retweetCount)}
            </strong> Reposts
          </span>
          <span>
            <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>
              {formatNumber(tweet.likeCount)}
            </strong> Likes
          </span>
          <span>
            <strong className={theme === 'dark' ? 'text-white' : 'text-black'}>
              {formatNumber(tweet.viewCount)}
            </strong> Views
          </span>
        </div>

        {/* Actions */}
        <div className={`flex justify-around py-2 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button className={`p-3 rounded-full transition-colors ${
            theme === 'dark' ? 'hover:bg-blue-900/30 text-gray-500' : 'hover:bg-blue-100 text-gray-600'
          }`}>
            <MessageCircle size={22} />
          </button>
          <button 
            onClick={onRetweetTweet}
            className={`p-3 rounded-full transition-colors ${
              isRetweeted 
                ? 'text-green-500' 
                : theme === 'dark' ? 'hover:bg-green-900/30 text-gray-500' : 'hover:bg-green-100 text-gray-600'
            }`}
          >
            <Repeat2 size={22} />
          </button>
          <button 
            onClick={onLikeTweet}
            className={`p-3 rounded-full transition-colors ${
              isLiked 
                ? 'text-red-500' 
                : theme === 'dark' ? 'hover:bg-red-900/30 text-gray-500' : 'hover:bg-red-100 text-gray-600'
            }`}
          >
            <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={onBookmarkTweet}
            className={`p-3 rounded-full transition-colors ${
              isBookmarked 
                ? 'text-blue-500' 
                : theme === 'dark' ? 'hover:bg-blue-900/30 text-gray-500' : 'hover:bg-blue-100 text-gray-600'
            }`}
          >
            <Bookmark size={22} fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
          <button className={`p-3 rounded-full transition-colors ${
            theme === 'dark' ? 'hover:bg-blue-900/30 text-gray-500' : 'hover:bg-blue-100 text-gray-600'
          }`}>
            <Share size={22} />
          </button>
        </div>

        {/* Comment input */}
        {tweet.commentsEnabled && (
          <div className={`py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex gap-3">
              <div className={`w-10 h-10 rounded-full ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              }`} />
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post your reply"
                  rows={2}
                  className={`w-full p-2 resize-none ${
                    theme === 'dark' 
                      ? 'bg-transparent text-white placeholder-gray-500' 
                      : 'bg-transparent text-black placeholder-gray-500'
                  } focus:outline-none text-lg`}
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitComment}
                    disabled={!newComment.trim()}
                    className={`px-4 py-2 rounded-full font-bold ${
                      newComment.trim()
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : theme === 'dark' ? 'bg-blue-500/50 text-gray-400' : 'bg-blue-200 text-gray-400'
                    }`}
                  >
                    Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments section */}
      <div>
        {loading ? (
          <div className={`p-4 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            No comments yet. Be the first to reply!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={`p-4 border-b ${
              theme === 'dark' ? 'border-gray-700 hover:bg-gray-900/30' : 'border-gray-200 hover:bg-gray-50'
            }`}>
              <div className="flex gap-3">
                <Link href={`/pages/user/${comment.author.username}`}>
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                  }`}>
                    {comment.author.avatar && (
                      <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/pages/user/${comment.author.username}`} className="hover:underline">
                        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {comment.author.name}
                        </span>
                      </Link>
                      <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                        @{comment.author.username}
                      </span>
                    </div>
                    {comment.author.id === currentUserId && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className={`p-1.5 rounded-full ${
                          theme === 'dark' ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-500' : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  
                  <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {comment.content}
                  </p>
                  
                  {/* Comment actions */}
                  <div className={`flex items-center gap-6 mt-3 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    <button 
                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                      className={`flex items-center gap-1.5 hover:text-blue-500 transition-colors ${
                        replyingTo === comment.id ? 'text-blue-500' : ''
                      }`}
                    >
                      <MessageCircle size={16} />
                      <span className="text-sm">{comment._count?.replies || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleRetweetComment(comment)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        comment.isRetweeted ? 'text-green-500' : 'hover:text-green-500'
                      }`}
                    >
                      <Repeat2 size={16} />
                      <span className="text-sm">{comment.retweetCount || 0}</span>
                    </button>
                    <button 
                      onClick={() => handleLikeComment(comment)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        comment.isLiked ? 'text-red-500' : 'hover:text-red-500'
                      }`}
                    >
                      <Heart size={16} fill={comment.isLiked ? 'currentColor' : 'none'} />
                      <span className="text-sm">{comment.likeCount || 0}</span>
                    </button>
                    <span className="flex items-center gap-1.5">
                      <Eye size={16} />
                      <span className="text-sm">{formatNumber(comment.viewCount || 0)}</span>
                    </span>
                    <button 
                      onClick={() => handleBookmarkComment(comment)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        comment.isBookmarked ? 'text-blue-500' : 'hover:text-blue-500'
                      }`}
                    >
                      <Bookmark size={16} fill={comment.isBookmarked ? 'currentColor' : 'none'} />
                    </button>
                  </div>

                  {/* Reply input */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to @${comment.author.username}...`}
                        className={`flex-1 px-4 py-2 rounded-full text-sm ${
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
                        className={`px-4 py-2 rounded-full font-bold text-sm ${
                          replyContent.trim()
                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                            : theme === 'dark' ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        Reply
                      </button>
                    </div>
                  )}

                  {/* Replies preview */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className={`mt-3 pl-4 border-l-2 ${
                      theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="py-2">
                          <div className="flex items-center gap-2">
                            <Link href={`/pages/user/${reply.author.username}`}>
                              <div className={`w-6 h-6 rounded-full overflow-hidden ${
                                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                              }`}>
                                {reply.author.avatar && (
                                  <img src={reply.author.avatar} alt="" className="w-full h-full object-cover" />
                                )}
                              </div>
                            </Link>
                            <span className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                              {reply.author.name}
                            </span>
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                              @{reply.author.username}
                            </span>
                          </div>
                          <p className={`text-sm mt-1 ml-8 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                            {reply.content}
                          </p>
                        </div>
                      ))}
                      {comment._count && comment._count.replies > 3 && (
                        <button className="text-sm text-blue-500 ml-8 hover:underline">
                          Show {comment._count.replies - 3} more replies
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
    </div>
  );
}
