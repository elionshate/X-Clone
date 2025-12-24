'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { userAPI, tweetAPI } from "@/lib/api";
import { useTheme } from "@/providers/theme-provider";
import { Trash2, MessageCircle, Repeat2, Heart } from 'lucide-react';
import { EditProfileModal } from "@/components/edit-profile-modal";

interface ProfileUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio?: string;
}

function ProfileContent() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadProfile = async () => {
    try {
      if (clerkUser?.username) {
        // Fetch user profile by username
        const userProfile = await userAPI.getUserByUsername(clerkUser.username);
        setProfile(userProfile);

        // Fetch user's tweets
        const userTweets = await tweetAPI.getTweetsByUserId(userProfile.id, 0, 10);
        setTweets(userTweets || []);

        // Fetch followers and following
        const followersList = await userAPI.getFollowers(userProfile.id);
        const followingList = await userAPI.getFollowing(userProfile.id);
        setFollowers(Array.isArray(followersList) ? followersList.length : 0);
        setFollowing(Array.isArray(followingList) ? followingList.length : 0);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [clerkUser?.username]);

  const handleDeleteTweet = async (tweetId: number) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await tweetAPI.deleteTweet(tweetId);
      setTweets(prev => prev.filter(t => t.id !== tweetId));
    } catch (error) {
      console.error('Error deleting tweet:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Profile Area */}
      <main className={`flex-1 border-r max-w-2xl ${
        theme === 'dark' 
          ? 'border-gray-700 bg-black' 
          : 'border-gray-200 bg-white'
      }`}>
        {/* Cover Photo */}
        <div className={`h-48 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}></div>

        {/* Profile Info */}
        <div className={`px-4 pb-4 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
          {/* Avatar */}
          <div className="flex justify-between items-start -mt-16 mb-4">
            <div className={`w-32 h-32 rounded-full border-4 ${
              theme === 'dark' 
                ? 'border-black bg-gray-700' 
                : 'border-white bg-gray-300'
            }`}></div>
            <button 
              onClick={() => setIsEditModalOpen(true)}
              className={`px-6 py-2 font-bold rounded-full border-2 transition-colors mt-20 ${
                theme === 'dark'
                  ? 'border-gray-600 text-white hover:bg-gray-900'
                  : 'border-gray-300 text-black hover:bg-gray-50'
              }`}
            >
              Edit Profile
            </button>
          </div>

          {/* User Details */}
          <div className="mb-4">
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {profile?.name || (clerkUser?.firstName + ' ' + clerkUser?.lastName) || 'User'}
            </h1>
            <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
              @{profile?.username || clerkUser?.username || 'username'}
            </p>
          </div>

          {/* Bio */}
          <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {profile?.bio || "Welcome to my profile. I'm enjoying using X Clone!"}
          </p>

          {/* Stats */}
          <div className={`flex gap-4 mb-4 py-4 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div>
              <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{following}</span>
              <span className={`ml-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Following</span>
            </div>
            <div>
              <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{followers}</span>
              <span className={`ml-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Followers</span>
            </div>
          </div>

          {/* Tabs */}
          <div className={`flex gap-8 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button className={`py-4 font-bold border-b-2 border-blue-500 text-blue-500`}>
              Posts
            </button>
            <button className={`py-4 font-semibold ${
              theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Likes
            </button>
          </div>

          {/* Posts */}
          <div className="flex flex-col">
            {loading ? (
              <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading posts...
              </p>
            ) : tweets.length === 0 ? (
              <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No posts yet
              </p>
            ) : (
              tweets.map((tweet) => (
                <div key={tweet.id} className={`w-full border-b p-4 ${
                  theme === 'dark' 
                    ? 'border-gray-700 bg-black hover:bg-gray-900' 
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}>
                  <div className="flex gap-3">
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                    }`}></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            {profile?.name}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            @{profile?.username}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>·</span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            {formatDate(tweet.createdAt)}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteTweet(tweet.id)}
                          className={`p-2 rounded-full transition-colors ${
                            theme === 'dark' 
                              ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-500' 
                              : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                        {tweet.content}
                      </p>
                      <div className={`flex gap-6 mt-3 text-sm ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                        <span className="flex items-center gap-1">
                          <MessageCircle size={14} /> {tweet.comments?.length || 0}
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
              ))
            )}
          </div>
        </div>
      </main>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userId={profile?.id}
        currentName={profile?.name || ''}
        currentUsername={profile?.username || clerkUser?.username || ''}
        currentBio={profile?.bio}
        onProfileUpdated={loadProfile}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <SignedIn>
        <ProfileContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
