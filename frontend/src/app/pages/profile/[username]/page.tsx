'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Sidebar } from "@/components/sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { userAPI, tweetAPI } from "@/lib/api";
import { useTheme } from "@/providers/theme-provider";
import { useTestAuth, ProtectedRoute } from "@/providers/test-auth-provider";
import { ArrowLeft, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import Image from 'next/image';

interface ProfileUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  createdAt?: string;
  _count?: {
    tweets: number;
    followers: number;
    following: number;
  };
}

interface Tweet {
  id: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  media?: { url: string; type: string }[];
  _count?: {
    comments: number;
    likes: number;
    retweets: number;
  };
}

type ProfileTab = 'posts' | 'replies' | 'likes';

function UserProfileContent() {
  const { theme } = useTheme();
  const params = useParams();
  const router = useRouter();
  const { user: currentUser, isLocalUser } = useTestAuth();
  const username = params.username as string;

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const isDark = theme === 'dark';
  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch user profile by username
        const userProfile = await userAPI.getUserByUsername(username);
        
        if (!userProfile || !userProfile.id) {
          setError('User not found');
          setLoading(false);
          return;
        }
        
        setProfile(userProfile);

        // Fetch user's tweets
        const userTweets = await tweetAPI.getTweetsByUserId(userProfile.id, 0, 20);
        setTweets(userTweets || []);

        // Fetch followers and following
        const followersList = await userAPI.getFollowers(userProfile.id);
        const followingList = await userAPI.getFollowing(userProfile.id);
        setFollowers(Array.isArray(followersList) ? followersList.length : 0);
        setFollowing(Array.isArray(followingList) ? followingList.length : 0);

        // Check if current user follows this profile
        if (currentUser && currentUser.id !== userProfile.id) {
          const isFollowingUser = Array.isArray(followersList) && 
            followersList.some((f: any) => f.id === currentUser.id || f.followerId === currentUser.id);
          setIsFollowing(isFollowingUser);
        }
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;

    try {
      if (isFollowing) {
        await userAPI.unfollowUser(currentUser.id as number, profile.id);
        setIsFollowing(false);
        setFollowers(prev => prev - 1);
      } else {
        await userAPI.followUser(currentUser.id as number, profile.id);
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error following/unfollowing:', err);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const formatTweetDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="flex justify-center max-w-[1400px] mx-auto">
          <Sidebar />
          <main className={`flex-1 border-x ${isDark ? 'border-gray-800' : 'border-gray-200'} min-h-screen max-w-[600px]`}>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
        <div className="flex justify-center max-w-[1400px] mx-auto">
          <Sidebar />
          <main className={`flex-1 border-x ${isDark ? 'border-gray-800' : 'border-gray-200'} min-h-screen max-w-[600px]`}>
            <div className={`sticky top-0 z-10 backdrop-blur-md ${isDark ? 'bg-black/80' : 'bg-white/80'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
              <div className="flex items-center gap-6 px-4 py-3">
                <button
                  onClick={() => router.back()}
                  className={`p-2 rounded-full hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'} transition-colors`}
                >
                  <ArrowLeft size={20} className={isDark ? 'text-white' : 'text-black'} />
                </button>
                <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Profile</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center h-64 px-4">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                This account doesn't exist
              </p>
              <p className={`mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                Try searching for another.
              </p>
            </div>
          </main>
          <RightSidebar />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-center max-w-[1400px] mx-auto">
        <Sidebar />
        
        <main className={`flex-1 border-x ${isDark ? 'border-gray-800' : 'border-gray-200'} min-h-screen max-w-[600px]`}>
          {/* Header */}
          <div className={`sticky top-0 z-10 backdrop-blur-md ${isDark ? 'bg-black/80' : 'bg-white/80'} border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-6 px-4 py-3">
              <button
                onClick={() => router.back()}
                className={`p-2 rounded-full hover:${isDark ? 'bg-gray-800' : 'bg-gray-100'} transition-colors`}
              >
                <ArrowLeft size={20} className={isDark ? 'text-white' : 'text-black'} />
              </button>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {profile.name}
                </h1>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  {tweets.length} posts
                </p>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className={`h-48 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>

          {/* Profile Info */}
          <div className="px-4 pb-4">
            {/* Avatar and Follow Button */}
            <div className="flex justify-between items-start">
              <div className="relative -mt-16">
                <div className={`w-32 h-32 rounded-full border-4 ${isDark ? 'border-black bg-gray-700' : 'border-white bg-gray-300'} overflow-hidden`}>
                  {profile.avatar ? (
                    <Image
                      src={profile.avatar}
                      alt={profile.name}
                      width={128}
                      height={128}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {profile.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              
              {!isOwnProfile && (
                <button
                  onClick={handleFollow}
                  className={`mt-4 px-4 py-2 rounded-full font-bold transition-colors ${
                    isFollowing
                      ? isDark 
                        ? 'bg-transparent border border-gray-600 text-white hover:border-red-600 hover:text-red-600'
                        : 'bg-transparent border border-gray-300 text-black hover:border-red-600 hover:text-red-600'
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              
              {isOwnProfile && (
                <button
                  onClick={() => router.push('/pages/profile')}
                  className={`mt-4 px-4 py-2 rounded-full font-bold border transition-colors ${
                    isDark 
                      ? 'border-gray-600 text-white hover:bg-gray-800'
                      : 'border-gray-300 text-black hover:bg-gray-100'
                  }`}
                >
                  Edit profile
                </button>
              )}
            </div>

            {/* Name and Username */}
            <div className="mt-4">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {profile.name}
              </h2>
              <p className={`${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                @{profile.username}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className={`mt-3 ${isDark ? 'text-white' : 'text-black'}`}>
                {profile.bio}
              </p>
            )}

            {/* Join Date */}
            <div className={`flex items-center gap-1 mt-3 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              <Calendar size={16} />
              <span>Joined {formatDate(profile.createdAt)}</span>
            </div>

            {/* Following/Followers */}
            <div className="flex gap-4 mt-3">
              <span className={isDark ? 'text-white' : 'text-black'}>
                <strong>{following}</strong>
                <span className={`ml-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Following</span>
              </span>
              <span className={isDark ? 'text-white' : 'text-black'}>
                <strong>{followers}</strong>
                <span className={`ml-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>Followers</span>
              </span>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            {(['posts', 'replies', 'likes'] as ProfileTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-4 text-center font-medium transition-colors relative ${
                  activeTab === tab
                    ? isDark ? 'text-white' : 'text-black'
                    : isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>

          {/* Tweets */}
          <div>
            {tweets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                  {isOwnProfile ? "You haven't posted yet" : `@${username} hasn't posted yet`}
                </p>
                <p className={`mt-2 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                  When {isOwnProfile ? 'you post' : 'they post'}, it'll show up here.
                </p>
              </div>
            ) : (
              tweets.map((tweet) => (
                <div
                  key={tweet.id}
                  className={`p-4 border-b ${isDark ? 'border-gray-800 hover:bg-gray-900/50' : 'border-gray-200 hover:bg-gray-50'} transition-colors cursor-pointer`}
                >
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-300'} overflow-hidden flex-shrink-0`}>
                      {tweet.author?.avatar ? (
                        <Image
                          src={tweet.author.avatar}
                          alt={tweet.author.name}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">
                          {tweet.author?.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                          {tweet.author?.name}
                        </span>
                        <span className={`${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          @{tweet.author?.username}
                        </span>
                        <span className={`${isDark ? 'text-gray-500' : 'text-gray-600'}`}>·</span>
                        <span className={`${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          {formatTweetDate(tweet.createdAt)}
                        </span>
                      </div>
                      <p className={`mt-1 ${isDark ? 'text-white' : 'text-black'}`}>
                        {tweet.content}
                      </p>
                      {tweet.media && tweet.media.length > 0 && (
                        <div className="mt-3 rounded-2xl overflow-hidden">
                          <Image
                            src={tweet.media[0].url}
                            alt="Tweet media"
                            width={500}
                            height={300}
                            className="w-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`flex justify-between mt-3 max-w-md ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        <span>{tweet._count?.comments || 0} replies</span>
                        <span>{tweet._count?.retweets || 0} reposts</span>
                        <span>{tweet._count?.likes || 0} likes</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        <RightSidebar />
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <ProtectedRoute>
      <UserProfileContent />
    </ProtectedRoute>
  );
}
