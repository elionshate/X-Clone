'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { userAPI, tweetAPI, commentAPI } from "@/lib/api";
import { useTheme } from "@/providers/theme-provider";
import { Trash2, MessageCircle, Repeat2, Heart, Edit2, MapPin, Reply, Send } from 'lucide-react';
import { EditProfileModal } from "@/components/edit-profile-modal";
import { EditPostModal } from "@/components/edit-post-modal";

interface ProfileUser {
  id: number;
  name: string;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  likeCount: number;
  author: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
  tweet: {
    id: number;
    content: string;
    author: {
      id: number;
      name: string;
      username: string;
    };
    media?: any[];
  };
  parent?: {
    id: number;
    author: {
      name: string;
      username: string;
    };
  };
  likes?: any[];
  _count?: {
    replies: number;
  };
}

type ProfileTab = 'posts' | 'reposts' | 'likes' | 'comments';

function ProfileContent() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [tweets, setTweets] = useState<any[]>([]);
  const [retweets, setRetweets] = useState<any[]>([]);
  const [likedTweets, setLikedTweets] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditPostModalOpen, setIsEditPostModalOpen] = useState(false);
  const [selectedTweet, setSelectedTweet] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>('posts');

  const loadProfile = async () => {
    try {
      if (clerkUser?.username) {
        // Fetch user profile by username
        const userProfile = await userAPI.getUserByUsername(clerkUser.username);
        setProfile(userProfile);

        // Fetch user's tweets
        const userTweets = await tweetAPI.getTweetsByUserId(userProfile.id, 0, 10);
        setTweets(userTweets || []);

        // Fetch user's retweets
        const userRetweets = await tweetAPI.getRetweetsByUserId(userProfile.id, 0, 10);
        setRetweets(userRetweets || []);

        // Fetch user's liked tweets
        const userLikes = await tweetAPI.getLikesByUserId(userProfile.id, 0, 10);
        setLikedTweets(userLikes || []);

        // Fetch comments on user's posts
        const userPostComments = await commentAPI.getCommentsOnUserPosts(userProfile.id, 0, 20);
        setComments(userPostComments || []);

        // Check which comments the user has liked
        if (userPostComments && userPostComments.length > 0) {
          const likedSet = new Set<number>();
          for (const comment of userPostComments) {
            if (comment.likes?.some((like: any) => like.userId === userProfile.id)) {
              likedSet.add(comment.id);
            }
          }
          setLikedComments(likedSet);
        }

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

  // Comment handlers
  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await commentAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!profile) return;
    
    try {
      if (likedComments.has(commentId)) {
        await commentAPI.unlikeComment(commentId, profile.id);
        setLikedComments(prev => {
          const newSet = new Set(prev);
          newSet.delete(commentId);
          return newSet;
        });
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, likeCount: c.likeCount - 1 } : c
        ));
      } else {
        await commentAPI.likeComment(commentId, profile.id);
        setLikedComments(prev => new Set(prev).add(commentId));
        setComments(prev => prev.map(c => 
          c.id === commentId ? { ...c, likeCount: c.likeCount + 1 } : c
        ));
      }
    } catch (error) {
      console.error('Error liking/unliking comment:', error);
    }
  };

  const handleReplyToComment = async (comment: Comment) => {
    if (!profile || !replyContent.trim()) return;
    
    try {
      await commentAPI.createReply({
        content: replyContent,
        tweetId: comment.tweet.id,
        authorId: profile.id,
        parentId: comment.id,
      });
      setReplyContent('');
      setReplyingTo(null);
      // Reload comments to show the new reply
      const userPostComments = await commentAPI.getCommentsOnUserPosts(profile.id, 0, 20);
      setComments(userPostComments || []);
    } catch (error) {
      console.error('Error replying to comment:', error);
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

  const handleRemoveRepost = async (tweetId: number) => {
    if (!confirm('Are you sure you want to remove this repost?')) return;
    
    try {
      await tweetAPI.unretweetTweet(tweetId, profile?.id);
      setRetweets(prev => prev.filter(t => t.id !== tweetId));
    } catch (error) {
      console.error('Error removing repost:', error);
    }
  };

  const handleRemoveLike = async (tweetId: number) => {
    if (!confirm('Are you sure you want to unlike this post?')) return;
    
    try {
      await tweetAPI.unlikeTweet(tweetId, profile?.id);
      setLikedTweets(prev => prev.filter(t => t.id !== tweetId));
    } catch (error) {
      console.error('Error removing like:', error);
    }
  };

  const handleEditTweet = (tweet: any) => {
    setSelectedTweet(tweet);
    setIsEditPostModalOpen(true);
  };

  const handlePostUpdated = () => {
    loadProfile();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-center max-w-[1400px] mx-auto">
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
            <div className={`w-32 h-32 rounded-full border-4 overflow-hidden ${
              theme === 'dark' 
                ? 'border-black bg-gray-700' 
                : 'border-white bg-gray-300'
            }`}>
              {profile?.avatar && (
                <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              )}
            </div>
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
          <div className={`flex gap-6 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button 
              onClick={() => setActiveTab('posts')}
              className={`py-4 font-bold ${
                activeTab === 'posts' 
                  ? 'border-b-2 border-blue-500 text-blue-500' 
                  : theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              Posts
            </button>
            <button 
              onClick={() => setActiveTab('reposts')}
              className={`py-4 font-semibold ${
                activeTab === 'reposts' 
                  ? 'border-b-2 border-blue-500 text-blue-500' 
                  : theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              Reposts
            </button>
            <button 
              onClick={() => setActiveTab('likes')}
              className={`py-4 font-semibold ${
                activeTab === 'likes' 
                  ? 'border-b-2 border-blue-500 text-blue-500' 
                  : theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              Likes
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`py-4 font-semibold ${
                activeTab === 'comments' 
                  ? 'border-b-2 border-blue-500 text-blue-500' 
                  : theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              Comments
            </button>
          </div>

          {/* Posts */}
          <div className="flex flex-col">
            {loading ? (
              <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Loading...
              </p>
            ) : activeTab === 'posts' ? (
              tweets.length === 0 ? (
                <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No posts yet
                </p>
              ) : (
                tweets.map((tweet) => (
                  <div 
                    key={tweet.id} 
                    className={`w-full border-b p-4 cursor-pointer ${
                      theme === 'dark' 
                        ? 'border-gray-700 bg-black hover:bg-gray-900' 
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => handleEditTweet(tweet)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        {profile?.avatar && (
                          <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
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
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleEditTweet(tweet); }}
                              className={`p-2 rounded-full transition-colors ${
                                theme === 'dark' 
                                  ? 'hover:bg-blue-900/30 text-gray-500 hover:text-blue-500' 
                                  : 'hover:bg-blue-100 text-gray-400 hover:text-blue-500'
                              }`}
                              title="Edit post"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteTweet(tweet.id); }}
                              className={`p-2 rounded-full transition-colors ${
                                theme === 'dark' 
                                  ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-500' 
                                  : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                              }`}
                              title="Delete post"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {tweet.content}
                        </p>
                        
                        {/* Tweet Media Images */}
                        {tweet.media && tweet.media.length > 0 && (
                          <div className={`mt-3 grid gap-2 rounded-xl overflow-hidden ${
                            tweet.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                          }`}>
                            {tweet.media.map((media: any) => (
                              <img
                                key={media.id}
                                src={media.mediaUrl}
                                alt=""
                                className={`w-full object-cover rounded-lg ${
                                  tweet.media.length === 1 ? 'max-h-96' : 'h-40'
                                }`}
                                onClick={(e) => e.stopPropagation()}
                              />
                            ))}
                          </div>
                        )}

                        {/* Location */}
                        {tweet.location && (
                          <div className={`mt-2 flex items-center gap-1 text-sm ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            <MapPin size={12} />
                            <span>{tweet.location}</span>
                          </div>
                        )}

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
              )
            ) : activeTab === 'reposts' ? (
              retweets.length === 0 ? (
                <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No reposts yet
                </p>
              ) : (
                retweets.map((tweet) => (
                  <div key={`retweet-${tweet.id}`} className={`w-full border-b p-4 ${
                    theme === 'dark' 
                      ? 'border-gray-700 bg-black hover:bg-gray-900' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    {/* Repost indicator */}
                    <div className={`flex items-center justify-between mb-2 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      <div className="flex items-center gap-2 text-sm">
                        <Repeat2 size={14} />
                        <span>{profile?.name} reposted</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveRepost(tweet.id)}
                        className={`p-2 rounded-full transition-colors ${
                          theme === 'dark' 
                            ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-500' 
                            : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                        }`}
                        title="Remove repost"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        {tweet.author?.avatar && (
                          <img src={tweet.author.avatar} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            {tweet.author?.name}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            @{tweet.author?.username}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>·</span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            {formatDate(tweet.createdAt)}
                          </span>
                        </div>
                        <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {tweet.content}
                        </p>

                        {/* Repost Media Images */}
                        {tweet.media && tweet.media.length > 0 && (
                          <div className={`mt-3 grid gap-2 rounded-xl overflow-hidden ${
                            tweet.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                          }`}>
                            {tweet.media.map((media: any) => (
                              <img
                                key={media.id}
                                src={media.mediaUrl}
                                alt=""
                                className={`w-full object-cover rounded-lg ${
                                  tweet.media.length === 1 ? 'max-h-96' : 'h-40'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Location */}
                        {tweet.location && (
                          <div className={`mt-2 flex items-center gap-1 text-sm ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            <MapPin size={12} />
                            <span>{tweet.location}</span>
                          </div>
                        )}

                        <div className={`flex gap-6 mt-3 text-sm ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={14} /> {tweet.comments?.length || 0}
                          </span>
                          <span className="flex items-center gap-1 text-green-500">
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
              )
            ) : activeTab === 'likes' ? (
              likedTweets.length === 0 ? (
                <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No liked posts yet
                </p>
              ) : (
                likedTweets.map((tweet) => (
                  <div key={`like-${tweet.id}`} className={`w-full border-b p-4 ${
                    theme === 'dark' 
                      ? 'border-gray-700 bg-black hover:bg-gray-900' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    {/* Like indicator */}
                    <div className={`flex items-center justify-between mb-2 ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      <div className="flex items-center gap-2 text-sm">
                        <Heart size={14} className="text-red-500" />
                        <span>{profile?.name} liked</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveLike(tweet.id)}
                        className={`p-2 rounded-full transition-colors ${
                          theme === 'dark' 
                            ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-500' 
                            : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                        }`}
                        title="Unlike"
                      >
                        <Heart size={16} fill="currentColor" className="text-red-500" />
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        {tweet.author?.avatar && (
                          <img src={tweet.author.avatar} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                            {tweet.author?.name}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            @{tweet.author?.username}
                          </span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>·</span>
                          <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                            {formatDate(tweet.createdAt)}
                          </span>
                        </div>
                        <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {tweet.content}
                        </p>

                        {/* Liked Tweet Media Images */}
                        {tweet.media && tweet.media.length > 0 && (
                          <div className={`mt-3 grid gap-2 rounded-xl overflow-hidden ${
                            tweet.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                          }`}>
                            {tweet.media.map((media: any) => (
                              <img
                                key={media.id}
                                src={media.mediaUrl}
                                alt=""
                                className={`w-full object-cover rounded-lg ${
                                  tweet.media.length === 1 ? 'max-h-96' : 'h-40'
                                }`}
                              />
                            ))}
                          </div>
                        )}

                        {/* Location */}
                        {tweet.location && (
                          <div className={`mt-2 flex items-center gap-1 text-sm ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            <MapPin size={12} />
                            <span>{tweet.location}</span>
                          </div>
                        )}

                        <div className={`flex gap-6 mt-3 text-sm ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={14} /> {tweet.comments?.length || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Repeat2 size={14} /> {tweet.retweetCount || 0}
                          </span>
                          <span className="flex items-center gap-1 text-red-500">
                            <Heart size={14} fill="currentColor" /> {tweet.likeCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : activeTab === 'comments' ? (
              comments.length === 0 ? (
                <p className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No comments on your posts yet
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={`comment-${comment.id}`} className={`w-full border-b p-4 ${
                    theme === 'dark' 
                      ? 'border-gray-700 bg-black hover:bg-gray-900/50' 
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}>
                    {/* Original post reference */}
                    <div className={`mb-3 p-3 rounded-lg ${
                      theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100'
                    }`}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                          On your post:
                        </span>
                      </div>
                      <p className={`text-sm mt-1 line-clamp-2 ${
                        theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {comment.tweet.content}
                      </p>
                    </div>

                    {/* If it's a reply, show what it's replying to */}
                    {comment.parent && (
                      <div className={`mb-2 text-sm ${
                        theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                      }`}>
                        <Reply size={12} className="inline mr-1" />
                        Replying to @{comment.parent.author.username}
                      </div>
                    )}

                    {/* Comment content */}
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 overflow-hidden ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                      }`}>
                        {comment.author?.avatar && (
                          <img src={comment.author.avatar} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                              {comment.author?.name}
                            </span>
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              @{comment.author?.username}
                            </span>
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>·</span>
                            <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}>
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className={`p-2 rounded-full transition-colors ${
                              theme === 'dark' 
                                ? 'hover:bg-red-900/30 text-gray-500 hover:text-red-500' 
                                : 'hover:bg-red-100 text-gray-400 hover:text-red-500'
                            }`}
                            title="Delete comment"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className={`mt-1 ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                          {comment.content}
                        </p>

                        {/* Comment actions */}
                        <div className={`flex gap-6 mt-3 text-sm ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>
                          <button 
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            className={`flex items-center gap-1 hover:text-blue-500 transition-colors ${
                              replyingTo === comment.id ? 'text-blue-500' : ''
                            }`}
                          >
                            <Reply size={14} /> Reply {comment._count?.replies ? `(${comment._count.replies})` : ''}
                          </button>
                          <button 
                            onClick={() => handleLikeComment(comment.id)}
                            className={`flex items-center gap-1 transition-colors ${
                              likedComments.has(comment.id) 
                                ? 'text-red-500' 
                                : 'hover:text-red-500'
                            }`}
                          >
                            <Heart 
                              size={14} 
                              fill={likedComments.has(comment.id) ? 'currentColor' : 'none'}
                            /> 
                            {comment.likeCount || 0}
                          </button>
                        </div>

                        {/* Reply input */}
                        {replyingTo === comment.id && (
                          <div className={`mt-3 flex gap-2 ${
                            theme === 'dark' ? 'text-white' : 'text-black'
                          }`}>
                            <input
                              type="text"
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className={`flex-1 px-3 py-2 rounded-full text-sm ${
                                theme === 'dark' 
                                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                                  : 'bg-gray-100 border-gray-300 text-black placeholder-gray-500'
                              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && replyContent.trim()) {
                                  handleReplyToComment(comment);
                                }
                              }}
                            />
                            <button
                              onClick={() => handleReplyToComment(comment)}
                              disabled={!replyContent.trim()}
                              className={`p-2 rounded-full transition-colors ${
                                replyContent.trim()
                                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                                  : theme === 'dark' 
                                    ? 'bg-gray-700 text-gray-500' 
                                    : 'bg-gray-200 text-gray-400'
                              }`}
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : null}
          </div>
        </div>
      </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        userId={profile?.id}
        currentName={profile?.name || ''}
        currentUsername={profile?.username || clerkUser?.username || ''}
        currentBio={profile?.bio}
        currentAvatar={profile?.avatar}
        onProfileUpdated={loadProfile}
      />

      {/* Edit Post Modal */}
      <EditPostModal
        isOpen={isEditPostModalOpen}
        onClose={() => {
          setIsEditPostModalOpen(false);
          setSelectedTweet(null);
        }}
        tweet={selectedTweet}
        onPostUpdated={handlePostUpdated}
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
