'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { Bookmark, MessageCircle, Repeat2, Heart, Trash2, ArrowLeft } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { bookmarkAPI, userAPI } from "@/lib/api";

interface BookmarkedTweet {
  id: number;
  content: string;
  authorId: number;
  author?: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  likeCount: number;
  retweetCount: number;
  commentsEnabled: boolean;
  comments?: any[];
  createdAt: string;
  bookmarkedAt?: string;
}

function BookmarksContent() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [bookmarkedTweets, setBookmarkedTweets] = useState<BookmarkedTweet[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendUserId, setBackendUserId] = useState<number | null>(null);

  // Get backend user
  useEffect(() => {
    const getBackendUser = async () => {
      if (!clerkUser?.username) return;
      
      try {
        const user = await userAPI.getUserByUsername(clerkUser.username);
        if (user?.id) {
          setBackendUserId(user.id);
        }
      } catch (error) {
        console.error('Error getting user:', error);
      }
    };

    getBackendUser();
  }, [clerkUser?.username]);

  // Load bookmarks
  useEffect(() => {
    const loadBookmarks = async () => {
      if (!backendUserId) return;
      
      try {
        setLoading(true);
        const bookmarks = await bookmarkAPI.getBookmarksByUserId(backendUserId);
        setBookmarkedTweets(bookmarks || []);
      } catch (error) {
        console.error('Error loading bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [backendUserId]);

  const handleRemoveBookmark = async (tweetId: number) => {
    if (!backendUserId) return;
    
    try {
      await bookmarkAPI.removeBookmark(backendUserId, tweetId);
      setBookmarkedTweets(prev => prev.filter(t => t.id !== tweetId));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

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

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-center max-w-[1400px] mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

      {/* Main Bookmarks Area */}
      <main className={`flex-1 border-r max-w-2xl ${
        theme === 'dark'
          ? 'border-gray-700 bg-black'
          : 'border-gray-200 bg-white'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 backdrop-blur border-b ${
          theme === 'dark' 
            ? 'bg-black/80 border-gray-700' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <div className="flex items-center gap-6 px-4 py-3">
            <button className={`p-2 rounded-full ${
              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}>
              <ArrowLeft size={20} className={theme === 'dark' ? 'text-white' : 'text-black'} />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                Bookmarks
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                @{clerkUser?.username}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading bookmarks...
            </div>
          </div>
        ) : bookmarkedTweets.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 px-8">
            <Bookmark size={64} className={`mb-4 ${
              theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
            }`} />
            <h3 className={`text-2xl font-bold mb-2 ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>Save posts for later</h3>
            <p className={`text-center max-w-sm ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Bookmark posts to easily find them again in the future.
            </p>
          </div>
        ) : (
          /* Bookmarked Posts */
          <div className="flex flex-col">
            {bookmarkedTweets.map((tweet) => (
              <div key={tweet.id} className={`border-b p-4 ${
                theme === 'dark' 
                  ? 'border-gray-700 hover:bg-gray-900/50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                  }`}>
                    {tweet.author?.avatar && (
                      <img src={tweet.author.avatar} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {tweet.author?.name || 'Unknown'}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          @{tweet.author?.username || 'unknown'}
                        </span>
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>·</span>
                        <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                          {formatDate(tweet.createdAt)}
                        </span>
                      </div>
                      <button 
                        onClick={() => handleRemoveBookmark(tweet.id)}
                        className={`p-2 rounded-full transition-colors ${
                          theme === 'dark' 
                            ? 'hover:bg-blue-900/30 text-blue-500' 
                            : 'hover:bg-blue-100 text-blue-500'
                        }`}
                        title="Remove bookmark"
                      >
                        <Bookmark size={16} fill="currentColor" />
                      </button>
                    </div>
                    <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                      {tweet.content}
                    </p>
                    <div className={`flex gap-6 mt-3 text-sm ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      <span className={`flex items-center gap-1 ${!tweet.commentsEnabled ? 'opacity-50' : ''}`}>
                        <MessageCircle size={14} /> 
                        {tweet.commentsEnabled ? (tweet.comments?.length || 0) : 'Off'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Repeat2 size={14} /> {tweet.retweetCount || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart size={14} /> {tweet.likeCount || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      </div>
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <>
      <SignedIn>
        <BookmarksContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
