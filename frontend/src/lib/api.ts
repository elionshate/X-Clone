const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Helper to get Clerk auth token
async function getAuthToken() {
  try {
    const token = await (window as any).__clerk?.session?.getToken?.();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Helper function to make authenticated requests
async function authenticatedFetch(url: string, options: RequestInit = {}, allowNotFound = false) {
  const token = await getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Return null for 404 if allowNotFound is true (for user lookups)
  if (response.status === 404 && allowNotFound) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  // Handle empty responses
  const text = await response.text();
  if (!text) {
    return null;
  }
  
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

// User API endpoints
export const userAPI = {
  async createUser(userData: { name: string; email: string; username: string }) {
    return authenticatedFetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getAllUsers(skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/users?skip=${skip}&take=${take}`);
  },

  async getUserById(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${id}`);
  },

  async getUserByUsername(username: string) {
    return authenticatedFetch(`${API_BASE_URL}/users/username/${username}`, {}, true);
  },

  async updateUser(id: number, userData: Partial<{ name: string; email: string; username: string; bio: string; avatar: string }>) {
    return authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: number, clerkUserId?: string) {
    return authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ clerkUserId }),
    });
  },

  async followUser(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/follow/${targetUserId}`, {
      method: 'POST',
    });
  },

  async unfollowUser(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/follow/${targetUserId}`, {
      method: 'DELETE',
    });
  },

  async getFollowers(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/followers`);
  },

  async getFollowing(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/following`);
  },

  async isFollowing(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/is-following/${targetUserId}`);
  },

  // Block endpoints
  async blockUser(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/block/${targetUserId}`, {
      method: 'POST',
    });
  },

  async unblockUser(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/block/${targetUserId}`, {
      method: 'DELETE',
    });
  },

  async isBlocked(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/is-blocked/${targetUserId}`);
  },

  async getBlockedUsers(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/blocked`);
  },

  // Mute endpoints
  async muteUser(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/mute/${targetUserId}`, {
      method: 'POST',
    });
  },

  async unmuteUser(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/mute/${targetUserId}`, {
      method: 'DELETE',
    });
  },

  async isMuted(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/is-muted/${targetUserId}`);
  },

  async getMutedUsers(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/muted`);
  },

  // Report endpoint
  async reportUser(userId: number, targetUserId: number, reason: string) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/report/${targetUserId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Relationship status
  async getRelationshipStatus(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/relationship/${targetUserId}`);
  },
};

// Tweet API endpoints
export const tweetAPI = {
  async createTweet(tweetData: { content: string; authorId: number; commentsEnabled?: boolean; mediaUrls?: string[]; location?: string; latitude?: number; longitude?: number }) {
    return authenticatedFetch(`${API_BASE_URL}/tweets`, {
      method: 'POST',
      body: JSON.stringify(tweetData),
    });
  },

  async getAllTweets(skip = 0, take = 10, excludeUserId?: number) {
    const params = new URLSearchParams({
      skip: skip.toString(),
      take: take.toString(),
    });
    if (excludeUserId) {
      params.append('excludeUserId', excludeUserId.toString());
    }
    return authenticatedFetch(`${API_BASE_URL}/tweets?${params.toString()}`);
  },

  async getTweetById(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}`);
  },

  async getTweetsByUserId(userId: number, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/user/${userId}?skip=${skip}&take=${take}`);
  },

  async getFollowingTweets(userId: number, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/following/${userId}?skip=${skip}&take=${take}`);
  },

  async getForYouTweets(userId: number, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/for-you/${userId}?skip=${skip}&take=${take}`);
  },

  async searchTweets(query: string, userId?: number, skip = 0, take = 10) {
    const userParam = userId ? `&userId=${userId}` : '';
    return authenticatedFetch(`${API_BASE_URL}/tweets/search?q=${encodeURIComponent(query)}${userParam}&skip=${skip}&take=${take}`);
  },

  async deleteTweet(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}`, {
      method: 'DELETE',
    });
  },

  async likeTweet(id: number, actorId?: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/like`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    });
  },

  async unlikeTweet(id: number, actorId?: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/unlike`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    });
  },

  async getLikesByUserId(userId: number, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/likes/user/${userId}?skip=${skip}&take=${take}`);
  },

  async hasUserLiked(tweetId: number, userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${tweetId}/hasLiked/${userId}`);
  },

  async getLikedTweetIds(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/likes/ids/${userId}`);
  },

  async retweetTweet(id: number, actorId?: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/retweet`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    });
  },

  async unretweetTweet(id: number, actorId?: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/unRetweet`, {
      method: 'POST',
      body: JSON.stringify({ actorId }),
    });
  },

  async getRetweetsByUserId(userId: number, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/retweets/user/${userId}?skip=${skip}&take=${take}`);
  },

  async hasUserRetweeted(tweetId: number, userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${tweetId}/hasRetweeted/${userId}`);
  },

  async updateTweetContent(id: number, content: string) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  async updateTweet(
    id: number,
    data: {
      content?: string;
      mediaUrls?: string[];
      mediaIdsToRemove?: number[];
      location?: string;
      latitude?: number;
      longitude?: number;
      commentsEnabled?: boolean;
    },
  ) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async incrementViews(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/view`, {
      method: 'POST',
    });
  },

  async incrementViewsBatch(ids: number[]) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/views/batch`, {
      method: 'POST',
      body: JSON.stringify({ ids }),
    });
  },
};

// Comment API endpoints
export const commentAPI = {
  async createComment(commentData: { content: string; tweetId: number; authorId: number }) {
    return authenticatedFetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  },

  async getCommentsByTweet(tweetId: number, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/comments/tweet/${tweetId}?skip=${skip}&take=${take}`);
  },

  async getCommentsByTweetId(tweetId: number, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/comments/tweet/${tweetId}?skip=${skip}&take=${take}`);
  },

  async deleteComment(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'DELETE',
    });
  },

  async updateComment(id: number, content: string) {
    return authenticatedFetch(`${API_BASE_URL}/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    });
  },

  async likeComment(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/comments/${id}/like`, {
      method: 'POST',
    });
  },

  async unlikeComment(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/comments/${id}/unlike`, {
      method: 'POST',
    });
  },
};

// Bookmark API endpoints
export const bookmarkAPI = {
  async createBookmark(userId: number, tweetId: number) {
    return authenticatedFetch(`${API_BASE_URL}/bookmarks`, {
      method: 'POST',
      body: JSON.stringify({ userId, tweetId }),
    });
  },

  async removeBookmark(userId: number, tweetId: number) {
    return authenticatedFetch(`${API_BASE_URL}/bookmarks/${userId}/${tweetId}`, {
      method: 'DELETE',
    });
  },

  async getBookmarksByUserId(userId: number, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/bookmarks/user/${userId}?skip=${skip}&take=${take}`);
  },

  async isBookmarked(userId: number, tweetId: number) {
    return authenticatedFetch(`${API_BASE_URL}/bookmarks/check/${userId}/${tweetId}`);
  },

  async getBookmarkedTweetIds(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/bookmarks/ids/${userId}`);
  },
};

// Chat API endpoints
export const chatAPI = {
  async createChat(memberIds: number[], name?: string, isGroup?: boolean) {
    return authenticatedFetch(`${API_BASE_URL}/chats`, {
      method: 'POST',
      body: JSON.stringify({ memberIds, name, isGroup }),
    });
  },

  async getChatById(chatId: number) {
    return authenticatedFetch(`${API_BASE_URL}/chats/${chatId}`);
  },

  async getChatsByUserId(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/chats/user/${userId}`);
  },

  async sendMessage(chatId: number, senderId: number, content: string, mediaUrls?: string[]) {
    return authenticatedFetch(`${API_BASE_URL}/chats/messages`, {
      method: 'POST',
      body: JSON.stringify({ chatId, senderId, content, mediaUrls }),
    });
  },

  async getMessages(chatId: number, skip = 0, take = 50) {
    return authenticatedFetch(`${API_BASE_URL}/chats/${chatId}/messages?skip=${skip}&take=${take}`);
  },

  async addMember(chatId: number, userId: number, isAdmin = false) {
    return authenticatedFetch(`${API_BASE_URL}/chats/members`, {
      method: 'POST',
      body: JSON.stringify({ chatId, userId, isAdmin }),
    });
  },

  async removeMember(chatId: number, userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/chats/${chatId}/members/${userId}`, {
      method: 'DELETE',
    });
  },

  async updateChatName(chatId: number, name: string) {
    return authenticatedFetch(`${API_BASE_URL}/chats/${chatId}/name`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },

  async deleteChat(chatId: number) {
    return authenticatedFetch(`${API_BASE_URL}/chats/${chatId}`, {
      method: 'DELETE',
    });
  },

  async findOrCreateDirectChat(userId1: number, userId2: number) {
    return authenticatedFetch(`${API_BASE_URL}/chats/direct/${userId1}/${userId2}`, {
      method: 'POST',
    });
  },
};

// Notification API endpoints
export const notificationAPI = {
  async getNotifications(userId: number, skip = 0, take = 20) {
    return authenticatedFetch(`${API_BASE_URL}/notifications/user/${userId}?skip=${skip}&take=${take}`);
  },

  async getUnreadCount(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/notifications/user/${userId}/unread-count`);
  },

  async markAsRead(notificationId: number) {
    return authenticatedFetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'POST',
    });
  },

  async markAllAsRead(userId: number) {
    return authenticatedFetch(`${API_BASE_URL}/notifications/user/${userId}/read-all`, {
      method: 'POST',
    });
  },

  async deleteNotification(notificationId: number) {
    return authenticatedFetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};
