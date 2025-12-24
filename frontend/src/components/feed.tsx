'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Repeat2, Heart, Share, Trash2, MoreHorizontal } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { useUser } from '@clerk/nextjs';
import { tweetAPI, userAPI, commentAPI } from '@/lib/api';
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
  };
  likeCount: number;
  retweetCount: number;
  commentCount?: number;
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
        try {
          const newUser = await userAPI.createUser({ name, email, username });
          if (newUser?.id) {
            setBackendUserId(newUser.id);
          }
        } catch (createError) {
          console.error('Error creating user:', createError);
        }
      }
    };

    getOrCreateUser();
  }, [clerkUser]);

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
        } else {
          console.log('Loading all tweets...');
          data = await tweetAPI.getAllTweets(0, 10);
        }
        console.log('Tweets data:', data);
        
        // The backend already includes author data
        if (Array.isArray(data)) {
          const enrichedTweets = data.map(tweet => ({
            ...tweet,
            commentCount: tweet.comments?.length || 0
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
        commentCount: tweet.comments?.length || 0
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
        await tweetAPI.unlikeTweet(tweetId);
        setLiked(prev => {
          const newSet = new Set(prev);
          newSet.delete(tweetId);
          return newSet;
        });
      } else {
        await tweetAPI.likeTweet(tweetId);
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
        await tweetAPI.retweetTweet(tweetId);
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
    setSelectedTweet(tweet);
    setIsCommentModalOpen(true);
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
                  <div className={`w-12 h-12 rounded-full flex-shrink-0 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                  }`}></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${
                          theme === 'dark' ? 'text-white' : 'text-black'
                        }`}>
                          {tweet.author?.name || 'Unknown User'}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          @{tweet.author?.username || 'unknown'}
                        </span>
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
                    <div className={`flex justify-between mt-3 max-w-xs text-sm ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCommentModal(tweet);
                        }}
                        className="flex items-center gap-2 hover:text-blue-500 transition-colors"
                      >
                        <MessageCircle size={16} /> {tweet.commentCount || 0}
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
