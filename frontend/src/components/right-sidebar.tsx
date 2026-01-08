'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, TrendingUp, Hash, User, MapPin, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/providers/theme-provider';
import { userAPI, newsAPI } from '@/lib/api';

interface SearchUser {
  id: number;
  username: string;
  name: string;
  avatar?: string;
  _count: {
    followers: number;
    following: number;
  };
}

interface Hashtag {
  hashtag: string;
  count: number;
}

interface NewsItem {
  title: string;
  description?: string | null;
  source: string;
  url: string;
  publishedAt: string;
  image?: string;
  score?: number;
}

interface LocationInfo {
  countryCode: string;
  countryName: string;
  city: string | null;
}

export function RightSidebar() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [hashtagResults, setHashtagResults] = useState<Hashtag[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [trendingHashtags, setTrendingHashtags] = useState<Hashtag[]>([]);
  const [globalNews, setGlobalNews] = useState<NewsItem[]>([]);
  const [localNews, setLocalNews] = useState<NewsItem[]>([]);
  const [userLocation, setUserLocation] = useState<LocationInfo | null>(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load trending hashtags on mount
  useEffect(() => {
    async function loadTrending() {
      try {
        const hashtags = await userAPI.getTrendingHashtags(5);
        if (Array.isArray(hashtags)) {
          setTrendingHashtags(hashtags);
        }
      } catch (error) {
        console.error('Error loading trending hashtags:', error);
      }
    }
    loadTrending();
  }, []);

  // Load news on mount
  useEffect(() => {
    async function loadNews() {
      setLoadingNews(true);
      try {
        // Get user's location first
        const location = await newsAPI.getUserCountry();
        setUserLocation(location);

        // Fetch global news (What's Happening)
        const global = await newsAPI.getGlobalNews(5);
        if (global) {
          setGlobalNews(global);
        }

        // Fetch local news (Today's News)
        const local = await newsAPI.getCountryNews(location.countryCode, 5);
        if (local) {
          setLocalNews(local);
        }
      } catch (error) {
        console.error('Error loading news:', error);
      } finally {
        setLoadingNews(false);
      }
    }
    loadNews();
  }, []);

  // Debounced search function
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHashtagResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    setShowDropdown(true);

    try {
      // Search both users and hashtags in parallel
      const [users, hashtags] = await Promise.all([
        userAPI.searchUsers(query, 5),
        userAPI.searchHashtags(query, 5),
      ]);

      setSearchResults(Array.isArray(users) ? users : []);
      setHashtagResults(Array.isArray(hashtags) ? hashtags : []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setHashtagResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce the search
    debounceRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHashtagResults([]);
    setShowDropdown(false);
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Format follower count
  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  // Fallback trending items (tech-related)
  const fallbackTrending = [
    { category: 'Technology', topic: '#ReactJS', posts: '245K Posts' },
    { category: 'Trending Worldwide', topic: '#WebDevelopment', posts: '1.5M Posts' },
    { category: 'Programming', topic: '#TypeScript', posts: '892K Posts' },
    { category: 'Trending Worldwide', topic: '#AI', posts: '2.3M Posts' },
    { category: 'Technology', topic: '#NextJS', posts: '432K Posts' },
  ];

  // Fallback news items
  const fallbackNews = [
    { title: 'New AI Models Released', source: 'Tech Daily', time: '2h ago' },
    { title: 'Web Development Trends 2026', source: 'Dev Blog', time: '4h ago' },
    { title: 'Cloud Computing Updates', source: 'Tech News', time: '6h ago' },
  ];

  return (
    <aside className={`w-80 p-4 sticky top-0 h-screen hidden xl:flex flex-col ${
      theme === 'dark' ? 'bg-black' : 'bg-white'
    }`}>
      {/* Search Bar with Dropdown */}
      <div ref={searchRef} className="relative mb-4 flex-shrink-0">
        <div className={`relative p-0 rounded-full flex items-center gap-3 ${
          theme === 'dark'
            ? 'bg-gray-900 text-gray-500'
            : 'bg-gray-100 text-gray-600'
        } ${showDropdown ? 'ring-2 ring-blue-500' : ''}`}>
          <Search size={20} className="ml-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery && setShowDropdown(true)}
            placeholder="Search users or #hashtags"
            className={`flex-1 py-3 outline-none rounded-full ${
              theme === 'dark'
                ? 'bg-gray-900 text-white placeholder-gray-500'
                : 'bg-gray-100 text-black placeholder-gray-600'
            }`}
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className={`mr-3 p-1 rounded-full ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
              }`}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showDropdown && (
          <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto ${
            theme === 'dark' ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'
          }`}>
            {isSearching ? (
              <div className="p-4 text-center">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              <>
                {/* Hashtag Results */}
                {hashtagResults.length > 0 && (
                  <div className="p-2">
                    <p className={`text-xs font-semibold px-2 py-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>Hashtags</p>
                    {hashtagResults.map((tag) => (
                      <Link
                        key={tag.hashtag}
                        href={`/pages/search?q=${encodeURIComponent(tag.hashtag)}`}
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                          theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                        }`}>
                          <Hash size={18} className="text-blue-500" />
                        </div>
                        <div>
                          <p className={`font-semibold ${
                            theme === 'dark' ? 'text-white' : 'text-black'
                          }`}>{tag.hashtag}</p>
                          <p className={`text-xs ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          }`}>{formatCount(tag.count)} posts</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                {/* User Results */}
                {searchResults.length > 0 && (
                  <div className={`p-2 ${hashtagResults.length > 0 ? 'border-t' : ''} ${
                    theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
                  }`}>
                    <p className={`text-xs font-semibold px-2 py-1 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>Users</p>
                    {searchResults.map((user) => (
                      <Link
                        key={user.id}
                        href={`/pages/profile/${user.username}`}
                        onClick={() => setShowDropdown(false)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${
                          theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                        }`}
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'
                          }`}>
                            <User size={18} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold truncate ${
                            theme === 'dark' ? 'text-white' : 'text-black'
                          }`}>{user.name}</p>
                          <p className={`text-sm truncate ${
                            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                          }`}>@{user.username}</p>
                        </div>
                        <p className={`text-xs ${
                          theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                        }`}>{formatCount(user._count.followers)} followers</p>
                      </Link>
                    ))}
                  </div>
                )}

                {/* No Results */}
                {searchQuery && searchResults.length === 0 && hashtagResults.length === 0 && !isSearching && (
                  <div className={`p-4 text-center ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    No results found for "{searchQuery}"
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Content container with overflow hidden */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 scrollbar-hide">
        {/* What's Happening Section - Global News */}
        <div className={`rounded-2xl p-4 flex-shrink-0 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
          <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            <TrendingUp size={20} className="text-blue-500" />
            What's Happening
          </h3>

          <div className="space-y-2">
            {loadingNews ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={`skeleton-global-${i}`} className="p-2">
                    <div className={`h-3 w-20 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 w-full rounded mt-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                  </div>
                ))}
              </div>
            ) : globalNews.length > 0 ? (
              globalNews.slice(0, 3).map((news, idx) => (
                <a
                  key={`global-news-${news.title.slice(0, 20)}-${idx}`}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-2 rounded-lg cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <p className={`text-xs flex items-center gap-1 ${
                    theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                  }`}>
                    {news.source} · {formatTimeAgo(news.publishedAt)}
                    <ExternalLink size={10} />
                  </p>
                  <p className={`font-bold text-sm line-clamp-2 ${
                    theme === 'dark' ? 'text-white' : 'text-black'
                  }`}>
                    {news.title}
                  </p>
                </a>
              ))
            ) : (
              // Fallback to trending hashtags or static content
              <>
                {trendingHashtags.length > 0 ? (
                  trendingHashtags.slice(0, 3).map((tag, idx) => (
                    <Link
                      key={`trending-tag-${tag.hashtag}-${idx}`}
                      href={`/pages/search?q=${encodeURIComponent(tag.hashtag)}`}
                      className={`block p-2 rounded-lg cursor-pointer transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                        Trending
                      </p>
                      <p className={`font-bold text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-black'
                      }`}>
                        {tag.hashtag}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                        {formatCount(tag.count)} posts
                      </p>
                    </Link>
                  ))
                ) : (
                  fallbackTrending.slice(0, 3).map((item, idx) => (
                    <div
                      key={`fallback-trend-${item.topic}-${idx}`}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                        {item.category}
                      </p>
                      <p className={`font-bold text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-black'
                      }`}>
                        {item.topic}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                        {item.posts}
                      </p>
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* Today's News Section - Location-based */}
        <div className={`rounded-2xl p-4 flex-shrink-0 ${
          theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
        }`}>
          <h3 className={`text-xl font-bold mb-1 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            News for You
          </h3>
          <p className={`text-xs mb-3 flex items-center gap-1 ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          }`}>
            <MapPin size={12} />
            {userLocation 
              ? `${userLocation.city ? `${userLocation.city}, ` : ''}${userLocation.countryName}`
              : 'Detecting location...'
            }
          </p>

          <div className="space-y-2">
            {loadingNews ? (
              <div className="animate-pulse space-y-3">
                {[1, 2].map((i) => (
                  <div key={`skeleton-local-${i}`} className="p-2">
                    <div className={`h-3 w-24 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                    <div className={`h-4 w-full rounded mt-2 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-300'}`}></div>
                  </div>
                ))}
              </div>
            ) : localNews.length > 0 ? (
              localNews.slice(0, 3).map((news, idx) => (
                <a
                  key={`local-news-${news.title.slice(0, 20)}-${idx}`}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`block p-2 rounded-lg cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <p className={`text-xs font-semibold flex items-center gap-1 ${
                    theme === 'dark' ? 'text-blue-500' : 'text-blue-600'
                  }`}>
                    {news.source} · {formatTimeAgo(news.publishedAt)}
                    <ExternalLink size={10} />
                  </p>
                  <p className={`font-bold text-sm mt-1 line-clamp-2 ${
                    theme === 'dark' ? 'text-white' : 'text-black'
                  }`}>
                    {news.title}
                  </p>
                </a>
              ))
            ) : (
              // Fallback content
              fallbackNews.slice(0, 2).map((news, idx) => (
                <div
                  key={`fallback-news-${news.title.slice(0, 15)}-${idx}`}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <p className={`text-xs font-semibold ${
                    theme === 'dark' ? 'text-blue-500' : 'text-blue-600'
                  }`}>
                    {news.source} · {news.time}
                  </p>
                  <p className={`font-bold text-sm mt-1 ${
                    theme === 'dark' ? 'text-white' : 'text-black'
                  }`}>
                    {news.title}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Trending Hashtags Section */}
        {trendingHashtags.length > 0 && (
          <div className={`rounded-2xl p-4 flex-shrink-0 ${
            theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
          }`}>
            <h3 className={`text-xl font-bold mb-3 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              <Hash size={20} className="text-blue-500" />
              Trending Hashtags
            </h3>

            <div className="space-y-2">
              {trendingHashtags.slice(0, 5).map((tag, idx) => (
                <Link
                  key={`sidebar-hashtag-${tag.hashtag}-${idx}`}
                  href={`/pages/search?q=${encodeURIComponent(tag.hashtag)}`}
                  className={`block p-2 rounded-lg cursor-pointer transition-colors ${
                    theme === 'dark'
                      ? 'hover:bg-gray-800'
                      : 'hover:bg-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}>
                      {tag.hashtag}
                    </p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      {formatCount(tag.count)} posts
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
