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
async function authenticatedFetch(url: string, options: RequestInit = {}) {
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

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
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
    return authenticatedFetch(`${API_BASE_URL}/users/username/${username}`);
  },

  async updateUser(id: number, userData: Partial<{ name: string; email: string; username: string; bio: string }>) {
    return authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
  },

  async followUser(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/follow/${targetUserId}`, {
      method: 'POST',
    });
  },

  async unfollowUser(userId: number, targetUserId: number) {
    return authenticatedFetch(`${API_BASE_URL}/users/${userId}/unfollow/${targetUserId}`, {
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
};

// Tweet API endpoints
export const tweetAPI = {
  async createTweet(tweetData: { content: string; authorId: number }) {
    return authenticatedFetch(`${API_BASE_URL}/tweets`, {
      method: 'POST',
      body: JSON.stringify(tweetData),
    });
  },

  async getAllTweets(skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/tweets?skip=${skip}&take=${take}`);
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

  async searchTweets(query: string, skip = 0, take = 10) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/search?q=${encodeURIComponent(query)}&skip=${skip}&take=${take}`);
  },

  async deleteTweet(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}`, {
      method: 'DELETE',
    });
  },

  async likeTweet(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/like`, {
      method: 'POST',
    });
  },

  async unlikeTweet(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/unlike`, {
      method: 'POST',
    });
  },

  async retweetTweet(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/retweet`, {
      method: 'POST',
    });
  },

  async unretweetTweet(id: number) {
    return authenticatedFetch(`${API_BASE_URL}/tweets/${id}/unRetweet`, {
      method: 'POST',
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
