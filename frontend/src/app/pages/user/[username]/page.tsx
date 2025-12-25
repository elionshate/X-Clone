'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { userAPI, tweetAPI, chatAPI } from "@/lib/api";
import { useTheme } from "@/providers/theme-provider";
import { 
  ArrowLeft, 
  MoreHorizontal, 
  Mail, 
  Calendar,
  MessageCircle,
  Repeat2,
  Heart,
  Link as LinkIcon,
  Share,
  Ban,
  VolumeX,
  Flag,
  Info,
  X,
  Check
} from 'lucide-react';

interface ProfileUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
}

interface Tweet {
  id: number;
  content: string;
  authorId: number;
  likeCount: number;
  retweetCount: number;
  commentsEnabled: boolean;
  comments?: any[];
  createdAt: string;
}

function UserProfileContent() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [backendUserId, setBackendUserId] = useState<number | null>(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  
  // Relationship states
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isBlockedBy, setIsBlockedBy] = useState(false);
  
  // UI states
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  
  const optionsRef = useRef<HTMLDivElement>(null);

  // Get current user's backend ID
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

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      
      try {
        setLoading(true);
        const userProfile = await userAPI.getUserByUsername(username);
        
        if (!userProfile) {
          router.push('/pages/home');
          return;
        }
        
        setProfile(userProfile);
        setIsOwnProfile(clerkUser?.username === username);
        
        // Fetch user's tweets
        const userTweets = await tweetAPI.getTweetsByUserId(userProfile.id, 0, 20);
        setTweets(userTweets || []);
        
        // Fetch followers and following
        const followersList = await userAPI.getFollowers(userProfile.id);
        const followingList = await userAPI.getFollowing(userProfile.id);
        setFollowers(Array.isArray(followersList) ? followersList.length : 0);
        setFollowing(Array.isArray(followingList) ? followingList.length : 0);
        
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username, clerkUser?.username, router]);

  // Load relationship status
  useEffect(() => {
    const loadRelationship = async () => {
      if (!backendUserId || !profile?.id || isOwnProfile) return;
      
      try {
        const status = await userAPI.getRelationshipStatus(backendUserId, profile.id);
        setIsFollowing(status.isFollowing);
        setIsBlocked(status.isBlocked);
        setIsMuted(status.isMuted);
        setIsBlockedBy(status.isBlockedBy);
      } catch (error) {
        console.error('Error loading relationship:', error);
      }
    };

    loadRelationship();
  }, [backendUserId, profile?.id, isOwnProfile]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showMessage = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(''), 3000);
  };

  const handleFollow = async () => {
    if (!backendUserId || !profile?.id) return;
    
    try {
      if (isFollowing) {
        await userAPI.unfollowUser(backendUserId, profile.id);
        setIsFollowing(false);
        setFollowers(prev => prev - 1);
        showMessage('Unfollowed successfully');
      } else {
        await userAPI.followUser(backendUserId, profile.id);
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
        showMessage('Following!');
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleBlock = async () => {
    if (!backendUserId || !profile?.id) return;
    
    try {
      if (isBlocked) {
        await userAPI.unblockUser(backendUserId, profile.id);
        setIsBlocked(false);
        showMessage(`Unblocked @${profile.username}`);
      } else {
        await userAPI.blockUser(backendUserId, profile.id);
        setIsBlocked(true);
        setIsFollowing(false);
        showMessage(`Blocked @${profile.username}`);
      }
      setShowOptionsMenu(false);
    } catch (error) {
      console.error('Error toggling block:', error);
    }
  };

  const handleMute = async () => {
    if (!backendUserId || !profile?.id) return;
    
    try {
      if (isMuted) {
        await userAPI.unmuteUser(backendUserId, profile.id);
        setIsMuted(false);
        showMessage(`Unmuted @${profile.username}`);
      } else {
        await userAPI.muteUser(backendUserId, profile.id);
        setIsMuted(true);
        showMessage(`Muted @${profile.username}`);
      }
      setShowOptionsMenu(false);
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  };

  const handleReport = async () => {
    if (!backendUserId || !profile?.id || !reportReason.trim()) return;
    
    try {
      await userAPI.reportUser(backendUserId, profile.id, reportReason);
      setShowReportModal(false);
      setReportReason('');
      showMessage('Report submitted. Thank you for keeping our community safe.');
    } catch (error) {
      console.error('Error reporting user:', error);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/pages/user/${profile?.username}`;
    navigator.clipboard.writeText(url);
    showMessage('Link copied to clipboard!');
    setShowOptionsMenu(false);
  };

  const handleShareVia = (platform: string) => {
    const url = `${window.location.origin}/pages/user/${profile?.username}`;
    const text = `Check out @${profile?.username} on X Clone!`;
    
    // Mock share - in production these would open actual share dialogs
    showMessage(`Shared via ${platform}! (Mock)`);
    setShowShareMenu(false);
    setShowOptionsMenu(false);
  };

  const handleSendMessage = async () => {
    if (!backendUserId || !profile?.id) return;
    
    try {
      // Create or find direct chat
      const chat = await chatAPI.findOrCreateDirectChat(backendUserId, profile.id);
      router.push('/pages/chat');
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <div className="flex justify-center max-w-[1400px] mx-auto">
          <Sidebar />
          <main className={`flex-1 border-r max-w-2xl ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-center h-full">
              <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Loading profile...</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (isBlockedBy) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        <div className="flex justify-center max-w-[1400px] mx-auto">
          <Sidebar />
          <main className={`flex-1 border-r max-w-2xl ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex flex-col items-center justify-center h-full p-8">
              <Ban size={64} className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} />
              <h2 className={`text-2xl font-bold mt-4 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                You're blocked
              </h2>
              <p className={`text-center mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                You can't view or interact with @{username}'s profile.
              </p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-center max-w-[1400px] mx-auto">
        <Sidebar />

        <main className={`flex-1 border-r max-w-2xl ${
          theme === 'dark' ? 'border-gray-700 bg-black' : 'border-gray-200 bg-white'
        }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 backdrop-blur border-b ${
          theme === 'dark' ? 'bg-black/80 border-gray-700' : 'bg-white/80 border-gray-200'
        }`}>
          <div className="flex items-center gap-6 px-4 py-2">
            <button 
              onClick={() => router.back()}
              className={`p-2 rounded-full ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <ArrowLeft size={20} className={theme === 'dark' ? 'text-white' : 'text-black'} />
            </button>
            <div>
              <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {profile?.name}
              </h1>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                {tweets.length} posts
              </p>
            </div>
          </div>
        </div>

        {/* Cover Photo */}
        <div className={`h-48 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}></div>

        {/* Profile Info */}
        <div className={`px-4 pb-4 ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
          <div className="flex justify-between items-start -mt-16 mb-4">
            <div className={`w-32 h-32 rounded-full border-4 overflow-hidden ${
              theme === 'dark' ? 'border-black bg-gray-700' : 'border-white bg-gray-300'
            }`}>
              {profile?.avatar && (
                <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            
            {/* Action Buttons */}
            {!isOwnProfile && (
              <div className="flex items-center gap-2 mt-20">
                {/* Options Menu */}
                <div className="relative" ref={optionsRef}>
                  <button
                    onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                    className={`p-2 rounded-full border ${
                      theme === 'dark'
                        ? 'border-gray-600 text-white hover:bg-gray-800'
                        : 'border-gray-300 text-black hover:bg-gray-100'
                    }`}
                  >
                    <MoreHorizontal size={20} />
                  </button>

                  {/* Options Dropdown */}
                  {showOptionsMenu && (
                    <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-lg z-50 overflow-hidden ${
                      theme === 'dark' ? 'bg-black border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                      <button
                        onClick={() => {
                          setShowOptionsMenu(false);
                          // Show about modal or info
                          showMessage(`Account created: ${formatJoinDate(profile?.createdAt || '')}`);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 ${
                          theme === 'dark' ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                        }`}
                      >
                        <Info size={18} />
                        <span>About this account</span>
                      </button>
                      
                      <button
                        onClick={handleCopyLink}
                        className={`w-full flex items-center gap-3 px-4 py-3 ${
                          theme === 'dark' ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                        }`}
                      >
                        <LinkIcon size={18} />
                        <span>Copy link to profile</span>
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setShowShareMenu(!showShareMenu)}
                          className={`w-full flex items-center gap-3 px-4 py-3 ${
                            theme === 'dark' ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                          }`}
                        >
                          <Share size={18} />
                          <span>Share profile via...</span>
                        </button>

                        {showShareMenu && (
                          <div className={`absolute left-full top-0 ml-2 w-48 rounded-xl shadow-lg z-50 ${
                            theme === 'dark' ? 'bg-black border border-gray-700' : 'bg-white border border-gray-200'
                          }`}>
                            {['WhatsApp', 'Telegram', 'Email', 'SMS'].map((platform) => (
                              <button
                                key={platform}
                                onClick={() => handleShareVia(platform)}
                                className={`w-full text-left px-4 py-3 ${
                                  theme === 'dark' ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                                }`}
                              >
                                {platform}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />

                      <button
                        onClick={handleMute}
                        className={`w-full flex items-center gap-3 px-4 py-3 ${
                          theme === 'dark' ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                        }`}
                      >
                        <VolumeX size={18} />
                        <span>{isMuted ? 'Unmute' : 'Mute'} @{profile?.username}</span>
                      </button>

                      <button
                        onClick={handleBlock}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-red-500 ${
                          theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Ban size={18} />
                        <span>{isBlocked ? 'Unblock' : 'Block'} @{profile?.username}</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowOptionsMenu(false);
                          setShowReportModal(true);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-red-500 ${
                          theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-50'
                        }`}
                      >
                        <Flag size={18} />
                        <span>Report @{profile?.username}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Message Button */}
                <button
                  onClick={handleSendMessage}
                  className={`p-2 rounded-full border ${
                    theme === 'dark'
                      ? 'border-gray-600 text-white hover:bg-gray-800'
                      : 'border-gray-300 text-black hover:bg-gray-100'
                  }`}
                  title="Message"
                >
                  <Mail size={20} />
                </button>

                {/* Follow Button */}
                <button
                  onClick={handleFollow}
                  disabled={isBlocked}
                  className={`px-5 py-2 font-bold rounded-full transition-colors ${
                    isBlocked
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : isFollowing
                        ? theme === 'dark'
                          ? 'bg-transparent border border-gray-600 text-white hover:border-red-600 hover:text-red-600 hover:bg-red-900/20'
                          : 'bg-transparent border border-gray-300 text-black hover:border-red-500 hover:text-red-500 hover:bg-red-50'
                        : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {isBlocked ? 'Blocked' : isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            )}

            {isOwnProfile && (
              <button
                onClick={() => router.push('/pages/profile')}
                className={`px-5 py-2 font-bold rounded-full border mt-20 ${
                  theme === 'dark'
                    ? 'border-gray-600 text-white hover:bg-gray-800'
                    : 'border-gray-300 text-black hover:bg-gray-100'
                }`}
              >
                Edit profile
              </button>
            )}
          </div>

          {/* User Details */}
          <div className="mb-3">
            <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {profile?.name}
            </h1>
            <p className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
              @{profile?.username}
            </p>
          </div>

          {/* Bio */}
          {profile?.bio && (
            <p className={`mb-3 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {profile.bio}
            </p>
          )}

          {/* Join Date */}
          <div className={`flex items-center gap-1 mb-3 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          }`}>
            <Calendar size={16} />
            <span>Joined {formatJoinDate(profile?.createdAt || '')}</span>
          </div>

          {/* Stats */}
          <div className="flex gap-4">
            <span>
              <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{following}</span>
              <span className={`ml-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Following</span>
            </span>
            <span>
              <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>{followers}</span>
              <span className={`ml-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>Followers</span>
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <button className={`flex-1 py-4 font-bold border-b-2 border-blue-500 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Posts
          </button>
          <button className={`flex-1 py-4 font-semibold ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          }`}>
            Replies
          </button>
          <button className={`flex-1 py-4 font-semibold ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          }`}>
            Likes
          </button>
        </div>

        {/* Posts */}
        <div>
          {tweets.length === 0 ? (
            <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              No posts yet
            </p>
          ) : (
            tweets.map((tweet) => (
              <div key={tweet.id} className={`border-b p-4 ${
                theme === 'dark' ? 'border-gray-700 hover:bg-gray-900/50' : 'border-gray-200 hover:bg-gray-50'
              }`}>
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                  }`}>
                    {profile?.avatar && (
                      <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1">
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
            ))
          )}
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowReportModal(false)} />
          <div className={`relative w-full max-w-md mx-4 rounded-2xl shadow-xl p-6 ${
            theme === 'dark' ? 'bg-black border border-gray-700' : 'bg-white'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                Report @{profile?.username}
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className={`p-2 rounded-full ${
                  theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
              >
                <X size={20} className={theme === 'dark' ? 'text-white' : 'text-black'} />
              </button>
            </div>
            
            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Help us understand what's happening with this account.
            </p>
            
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              className={`w-full p-3 rounded-lg border mb-4 resize-none ${
                theme === 'dark'
                  ? 'bg-black border-gray-700 text-white placeholder-gray-500'
                  : 'bg-white border-gray-300 text-black placeholder-gray-400'
              }`}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className={`flex-1 py-2 rounded-full font-bold border ${
                  theme === 'dark'
                    ? 'border-gray-600 text-white hover:bg-gray-800'
                    : 'border-gray-300 text-black hover:bg-gray-100'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                className={`flex-1 py-2 rounded-full font-bold ${
                  reportReason.trim()
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Message Toast */}
      {actionMessage && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg shadow-lg">
            <Check size={18} />
            <span>{actionMessage}</span>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <>
      <SignedIn>
        <UserProfileContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
