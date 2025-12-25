'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { MessageCircle, Repeat2, Heart, Share, Trash2, MoreHorizontal, Bookmark, Eye, MapPin } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useUser } from '@clerk/nextjs';
import { tweetAPI, userAPI, commentAPI, bookmarkAPI } from '@/lib/api';
import { CommentModal } from './comment-modal';

interface Tweet {
  id: number;
  content: string;
  authorId: number;
  author?: {
    id: number;
    name: string;
    username: string;
    email: string;
    avatar?: string;
  };
  media?: Array<{
    id: number;
    mediaUrl: string;
    mediaType: string;
  }>;
  likeCount: number;
  retweetCount: number;
  viewCount: number;
  commentCount?: number;
  commentsEnabled: boolean;
  location?: string;
  createdAt: string;
}

interface FeedProps {
  tab: 'for-you' | 'following';
  onTabChange: (tab: 'for-you' | 'following') => void;
}

export function Feed({ tab, onTabChange }: FeedProps) {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [retweeted, setRetweeted] = useState<Set<number>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<number>>(new Set());
  const [backendUserId, setBackendUserId] = useState<number | undefined>();
  
  // Comment modal state
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);

  // Get or create backend user
  useEffect(() => {
    const getOrCreateUser = async () => {
      if (!clerkUser) return;
      
      const username = clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${clerkUser.id.slice(0, 8)}`;
      const email = clerkUser.primaryEmailAddress?.emailAddress || `${username}@example.com`;
      const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || username;
      
      try {
        const existingUser = await userAPI.getUserByUsername(username);
        if (existingUser?.id) {
          setBackendUserId(existingUser.id);
          return;
        }
        
        // User not found, create one
        const newUser = await userAPI.createUser({ name, email, username });
        if (newUser?.id) {
          setBackendUserId(newUser.id);
        }
      } catch (error) {
        console.error('Error in getOrCreateUser:', error);
      }
    };

    getOrCreateUser();
  }, [clerkUser]);

  // Load bookmarked tweet IDs
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!backendUserId) return;
      try {
        const bookmarkedIds = await bookmarkAPI.getBookmarkedTweetIds(backendUserId);
        setBookmarked(new Set(bookmarkedIds));
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      }
    };

    loadBookmarks();
  }, [backendUserId]);

  // Load liked tweet IDs
  useEffect(() => {
    const loadLikes = async () => {
      if (!backendUserId) return;
      try {
        const likedIds = await tweetAPI.getLikedTweetIds(backendUserId);
        setLiked(new Set(likedIds));
      } catch (error) {
        console.error('Error loading likes:', error);
      }
    };

    loadLikes();
  }, [backendUserId]);

  // Track views when tweets are displayed
  useEffect(() => {
    const trackViews = async () => {
      if (tweets.length === 0) return;
      const tweetIds = tweets.map(t => t.id);
      try {
        await tweetAPI.incrementViewsBatch(tweetIds);
        // Update local view counts
        setTweets(prev => prev.map(t => ({ ...t, viewCount: (t.viewCount || 0) + 1 })));
      } catch (error) {
        console.error('Error tracking views:', error);
      }
    };
    
    // Debounce view tracking
    const timer = setTimeout(trackViews, 500);
    return () => clearTimeout(timer);
  }, [tweets.length]); // Only run when number of tweets changes

  // Load initial tweets - depends on tab and backendUserId
  useEffect(() => {
    const loadTweets = async () => {
      try {
        setLoading(true);
        setTweets([]);
        setSkip(0);
        setHasMore(true);
        
        let data;
        if (tab === 'following' && backendUserId) {
          console.log('Loading following tweets for user:', backendUserId);
          data = await tweetAPI.getFollowingTweets(backendUserId, 0, 10);
        } else if (backendUserId) {
          console.log('Loading For You tweets (unfollowed accounts)...');
          // For "For You" tab, show posts from accounts NOT followed
          data = await tweetAPI.getForYouTweets(backendUserId, 0, 10);
        } else {
          console.log('Loading all tweets (no user)...');
          data = await tweetAPI.getAllTweets(0, 10);
        }
        console.log('Tweets data:', data);
        
        // The backend already includes author data
        if (Array.isArray(data)) {
          const enrichedTweets = data.map(tweet => ({
            ...tweet,
            commentCount: tweet.comments?.length || 0,
            commentsEnabled: tweet.commentsEnabled ?? true,
            viewCount: tweet.viewCount || 0,
          }));
          setTweets(enrichedTweets);
          if (data.length < 10) {
            setHasMore(false);
          }
        }
        setSkip(10);
      } catch (error) {
        console.error('Error loading tweets:', error);
      } finally {
        setLoading(false);
      }
    };

    // Only load following tweets if we have a userId
    if (tab === 'following' && !backendUserId) {
      setLoading(false);
      return;
    }
    
    loadTweets();
  }, [tab, backendUserId]);

  // Load more tweets on scroll
  const loadMoreTweets = useCallback(async () => {
    if (loading || !hasMore) return;
    
    try {
      setLoading(true);
      let data;
      if (tab === 'following' && backendUserId) {
        data = await tweetAPI.getFollowingTweets(backendUserId, skip, 10);
      } else if (backendUserId) {
        // For "For You" tab, show posts from accounts NOT followed
        data = await tweetAPI.getForYouTweets(backendUserId, skip, 10);
      } else {
        data = await tweetAPI.getAllTweets(skip, 10);
      }
      
      if (!Array.isArray(data) || data.length === 0) {
        setHasMore(false);
        return;
      }

      // The backend already includes author data
      const enrichedTweets = data.map(tweet => ({
        ...tweet,
        commentCount: tweet.comments?.length || 0,
        commentsEnabled: tweet.commentsEnabled ?? true,
      }));

      setTweets(prev => [...prev, ...enrichedTweets]);
      setSkip(prev => prev + 10);
    } catch (error) {
      console.error('Error loading more tweets:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [skip, loading, hasMore, tab, backendUserId]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && !loading && hasMore) {
          loadMoreTweets();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [loadMoreTweets, loading, hasMore]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'now';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleLike = async (tweetId: number) => {
    try {
      if (liked.has(tweetId)) {
        await tweetAPI.unlikeTweet(tweetId, backendUserId);
        setLiked(prev => {
          const newSet = new Set(prev);
          newSet.delete(tweetId);
          return newSet;
        });
      } else {
        await tweetAPI.likeTweet(tweetId, backendUserId);
        setLiked(prev => new Set([...prev, tweetId]));
      }
      
      // Update local state
      setTweets(prev =>
        prev.map(tweet =>
          tweet.id === tweetId
            ? { ...tweet, likeCount: liked.has(tweetId) ? tweet.likeCount - 1 : tweet.likeCount + 1 }
            : tweet
        )
      );
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleRetweet = async (tweetId: number) => {
    try {
      if (retweeted.has(tweetId)) {
        await tweetAPI.unretweetTweet(tweetId);
        setRetweeted(prev => {
          const newSet = new Set(prev);
          newSet.delete(tweetId);
          return newSet;
        });
      } else {
        await tweetAPI.retweetTweet(tweetId, backendUserId);
        setRetweeted(prev => new Set([...prev, tweetId]));
      }

      // Update local state
      setTweets(prev =>
        prev.map(tweet =>
          tweet.id === tweetId
            ? { ...tweet, retweetCount: retweeted.has(tweetId) ? tweet.retweetCount - 1 : tweet.retweetCount + 1 }
            : tweet
        )
      );
    } catch (error) {
      console.error('Error toggling retweet:', error);
    }
  };

  const handleOpenCommentModal = (tweet: Tweet) => {
    if (!tweet.commentsEnabled) {
      alert('Comments are disabled for this post');
      return;
    }
    setSelectedTweet(tweet);
    setIsCommentModalOpen(true);
  };

  const handleBookmark = async (tweetId: number) => {
    if (!backendUserId) return;

    try {
      if (bookmarked.has(tweetId)) {
        await bookmarkAPI.removeBookmark(backendUserId, tweetId);
        setBookmarked(prev => {
          const newSet = new Set(prev);
          newSet.delete(tweetId);
          return newSet;
        });
      } else {
        await bookmarkAPI.createBookmark(backendUserId, tweetId);
        setBookmarked(prev => new Set([...prev, tweetId]));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const handleCommentCreated = () => {
    // Update comment count for the selected tweet
    if (selectedTweet) {
      setTweets(prev =>
        prev.map(tweet =>
          tweet.id === selectedTweet.id
            ? { ...tweet, commentCount: (tweet.commentCount || 0) + 1 }
            : tweet
        )
      );
    }
  };

  const handleDeleteTweet = async (tweetId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await tweetAPI.deleteTweet(tweetId);
      setTweets(prev => prev.filter(t => t.id !== tweetId));
    } catch (error) {
      console.error('Error deleting tweet:', error);
    }
  };

  return (
    <>
      <main className={`flex-1 border-r max-w-2xl ${
        theme === 'dark' 
          ? 'border-gray-700 bg-black' 
          : 'border-gray-200 bg-white'
      }`}>
        {/* Tabs Only - No Header */}
        <div className={`sticky top-0 backdrop-blur z-10 border-b ${
          theme === 'dark' 
            ? 'border-gray-700 bg-black/90' 
            : 'border-gray-200 bg-white/90'
        }`}>
          <div className="flex">
            <button
              onClick={() => onTabChange('for-you')}
              className={`flex-1 py-4 font-bold text-center transition-colors ${
                tab === 'for-you'
                  ? `${theme === 'dark' ? 'text-white' : 'text-black'} border-b-4 border-blue-500`
                  : `${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} hover:${theme === 'dark' ? 'text-white' : 'text-black'}`
              }`}
            >
              For you
            </button>
            <button
              onClick={() => onTabChange('following')}
              className={`flex-1 py-4 font-bold text-center transition-colors ${
                tab === 'following'
                  ? `${theme === 'dark' ? 'text-white' : 'text-black'} border-b-4 border-blue-500`
                  : `${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} hover:${theme === 'dark' ? 'text-white' : 'text-black'}`
              }`}
            >
              Following
            </button>
          </div>
        </div>

        {/* Tweets Feed */}
        <div>
          {loading && tweets.length === 0 ? (
            <div className={`flex justify-center items-center py-12 ${
              theme === 'dark' ? 'bg-black' : 'bg-white'
            }`}>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Loading tweets...
              </p>
            </div>
          ) : tweets.length === 0 ? (
            <div className={`flex justify-center items-center py-12 ${
              theme === 'dark' ? 'bg-black' : 'bg-white'
            }`}>
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                No tweets yet. Click Post to create one!
              </p>
            </div>
          ) : (
            tweets.map((tweet) => (
              <div
                key={tweet.id}
                className={`border-b p-4 cursor-pointer transition-colors ${
                  theme === 'dark'
                    ? 'border-gray-700 hover:bg-gray-900 bg-black'
                    : 'border-gray-200 hover:bg-gray-50 bg-white'
                }`}
              >
                <div className="flex gap-4">
                  <Link 
                    href={`/pages/user/${tweet.author?.username || 'unknown'}`}
                    onClick={(e) => e.stopPropagation()}
                    className={`w-12 h-12 rounded-full flex-shrink-0 overflow-hidden ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                    }`}
                  >
                    {tweet.author?.avatar && (
                      <img src={tweet.author.avatar} alt="" className="w-full h-full object-cover" />
                    )}
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/pages/user/${tweet.author?.username || 'unknown'}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`font-bold hover:underline ${
                            theme === 'dark' ? 'text-white' : 'text-black'
                          }`}
                        >
                          {tweet.author?.name || 'Unknown User'}
                        </Link>
                        <Link 
                          href={`/pages/user/${tweet.author?.username || 'unknown'}`}
                          onClick={(e) => e.stopPropagation()}
                          className={`hover:underline ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}
                        >
                          @{tweet.author?.username || 'unknown'}
                        </Link>
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>·</span>
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          {formatDate(tweet.createdAt)}
                        </span>
                      </div>
                      {/* Delete button - only show for own tweets */}
                      {backendUserId === tweet.authorId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTweet(tweet.id);
                          }}
                          className={`p-2 rounded-full transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-500' 
                              : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    <p className={`mt-2 text-base ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}>
                      {tweet.content}
                    </p>
                    
                    {/* Location */}
                    {tweet.location && (
                      <div className={`flex items-center gap-1 mt-1 ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                        <MapPin size={14} />
                        <span className="text-sm">{tweet.location}</span>
                      </div>
                    )}
                    
                    {/* Tweet Media/Images */}
                    {tweet.media && tweet.media.length > 0 && (
                      <div className={`mt-3 rounded-2xl overflow-hidden ${
                        tweet.media.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'
                      }`}>
                        {tweet.media.map((media, index) => (
                          <img 
                            key={media.id || index}
                            src={media.mediaUrl} 
                            alt={`Tweet media ${index + 1}`}
                            className={`w-full object-cover ${
                              tweet.media!.length === 1 
                                ? 'max-h-96 rounded-2xl' 
                                : 'h-48'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                    
                    <div className={`flex justify-between mt-3 max-w-md text-sm ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCommentModal(tweet);
                        }}
                        className={`flex items-center gap-2 transition-colors ${
                          !tweet.commentsEnabled 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:text-blue-500'
                        }`}
                        title={tweet.commentsEnabled ? 'Comment' : 'Comments disabled'}
                      >
                        <MessageCircle size={16} /> {tweet.commentsEnabled ? (tweet.commentCount || 0) : 'Off'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetweet(tweet.id);
                        }}
                        className={`flex items-center gap-2 transition-colors ${
                          retweeted.has(tweet.id) ? 'text-green-500' : 'hover:text-green-500'
                        }`}
                      >
                        <Repeat2 size={16} /> {tweet.retweetCount}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(tweet.id);
                        }}
                        className={`flex items-center gap-2 transition-colors ${
                          liked.has(tweet.id) ? 'text-red-500' : 'hover:text-red-500'
                        }`}
                      >
                        <Heart size={16} fill={liked.has(tweet.id) ? 'currentColor' : 'none'} /> {tweet.likeCount}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBookmark(tweet.id);
                        }}
                        className={`flex items-center gap-2 transition-colors ${
                          bookmarked.has(tweet.id) ? 'text-blue-500' : 'hover:text-blue-500'
                        }`}
                        title={bookmarked.has(tweet.id) ? 'Remove bookmark' : 'Bookmark'}
                      >
                        <Bookmark size={16} fill={bookmarked.has(tweet.id) ? 'currentColor' : 'none'} />
                      </button>
                      <span className="flex items-center gap-1" title="Views">
                        <Eye size={16} /> {tweet.viewCount || 0}
                      </span>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                      >
                        <Share size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Infinite scroll trigger */}
        {hasMore && (
          <div
            ref={observerTarget}
            className={`flex justify-center items-center py-8 ${
              theme === 'dark' ? 'bg-black' : 'bg-white'
            }`}
          >
            {loading && <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading more...</p>}
          </div>
        )}
      </main>

      {/* Comment Modal */}
      {selectedTweet && (
        <CommentModal
          isOpen={isCommentModalOpen}
          onClose={() => {
            setIsCommentModalOpen(false);
            setSelectedTweet(null);
          }}
          tweetId={selectedTweet.id}
          tweetContent={selectedTweet.content}
          tweetAuthor={selectedTweet.author?.name || 'Unknown'}
          userId={backendUserId}
          onCommentCreated={handleCommentCreated}
        />
      )}
    </>
  );
}
