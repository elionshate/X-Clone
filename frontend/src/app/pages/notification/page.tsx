'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { Bell, Heart, Repeat2, MessageCircle, UserPlus, Check } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { notificationAPI, userAPI } from "@/lib/api";
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  userId: number;
  actorId: number;
  tweetId?: number;
  commentId?: number;
  read: boolean;
  createdAt: string;
  actor: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  tweet?: {
    id: number;
    content: string;
    authorId: number;
  };
}

function NotificationContent() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [backendUserId, setBackendUserId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');

  // Get or create backend user ID
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

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      if (!backendUserId) return;
      
      try {
        setLoading(true);
        const data = await notificationAPI.getNotifications(backendUserId, 0, 50);
        setNotifications(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();
  }, [backendUserId]);

  const handleMarkAllAsRead = async () => {
    if (!backendUserId) return;
    
    try {
      await notificationAPI.markAllAsRead(backendUserId);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="text-pink-500" size={20} fill="currentColor" />;
      case 'retweet':
        return <Repeat2 className="text-green-500" size={20} />;
      case 'comment':
        return <MessageCircle className="text-blue-500" size={20} />;
      case 'follow':
        return <UserPlus className="text-blue-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like':
        return 'liked your post';
      case 'retweet':
        return 'reposted your post';
      case 'comment':
        return 'commented on your post';
      case 'follow':
        return 'followed you';
      default:
        return 'interacted with you';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-center max-w-[1400px] mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Notification Area */}
        <main className={`flex-1 border-r max-w-2xl ${
          theme === 'dark'
            ? 'border-gray-700 bg-black'
            : 'border-gray-200 bg-white'
        }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 backdrop-blur border-b ${
          theme === 'dark' ? 'bg-black/80 border-gray-700' : 'bg-white/80 border-gray-200'
        }`}>
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className={`text-sm flex items-center gap-1 ${
                  theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'
                }`}
              >
                <Check size={16} />
                Mark all read
              </button>
            )}
          </div>

          {/* Tabs */}
          <div className="flex">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-4 font-bold text-center transition-colors ${
                activeTab === 'all'
                  ? `${theme === 'dark' ? 'text-white' : 'text-black'} border-b-4 border-blue-500`
                  : `${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('mentions')}
              className={`flex-1 py-4 font-semibold text-center ${
                activeTab === 'mentions'
                  ? `${theme === 'dark' ? 'text-white' : 'text-black'} border-b-4 border-blue-500`
                  : `${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`
              }`}
            >
              Mentions
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <Bell size={64} className={`mb-4 ${
                theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
              }`} />
              <h3 className={`text-2xl font-bold mb-2 text-center ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>No notifications yet</h3>
              <p className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                When someone likes, reposts, or comments on your posts, you'll see it here
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                className={`flex gap-3 p-4 border-b cursor-pointer transition-colors ${
                  theme === 'dark' 
                    ? `border-gray-700 hover:bg-gray-900 ${!notification.read ? 'bg-blue-900/10' : ''}`
                    : `border-gray-200 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`
                }`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 w-8">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Actor Info */}
                  <div className="flex items-start gap-2">
                    <Link 
                      href={`/pages/user/${notification.actor.username}`}
                      onClick={(e) => e.stopPropagation()}
                      className={`w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    >
                      {notification.actor.avatar && (
                        <img 
                          src={notification.actor.avatar} 
                          alt="" 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <p className={theme === 'dark' ? 'text-white' : 'text-black'}>
                        <Link 
                          href={`/pages/user/${notification.actor.username}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-bold hover:underline"
                        >
                          {notification.actor.name}
                        </Link>
                        {' '}
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          {getNotificationText(notification)}
                        </span>
                      </p>
                      
                      {/* Tweet Preview */}
                      {notification.tweet && (
                        <p className={`mt-1 text-sm line-clamp-2 ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                        }`}>
                          {notification.tweet.content}
                        </p>
                      )}

                      {/* Timestamp */}
                      <p className={`mt-1 text-sm ${
                        theme === 'dark' ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {formatTimestamp(notification.createdAt)}
                      </p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      </div>
    </div>
  );
}

export default function NotificationPage() {
  return (
    <>
      <SignedIn>
        <NotificationContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
