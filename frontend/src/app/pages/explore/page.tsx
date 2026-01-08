'use client';

import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { Search, UserPlus, Check, TrendingUp, Newspaper, Trophy, Film, Sparkles, ExternalLink } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { useEffect, useState } from "react";
import { userAPI } from "@/lib/api";
import Link from "next/link";

interface SuggestedUser {
  id: number;
  username: string;
  name: string;
  bio: string;
  avatar: string | null;
  _count: {
    followers: number;
    following: number;
    tweets: number;
  };
}

interface TrendingHashtag {
  hashtag: string;
  count: number;
}

interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  score?: number;
  time?: string;
}

interface SportsEvent {
  id: string;
  event: string;
  league: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  venue?: string;
}

interface EntertainmentItem {
  id: string;
  name: string;
  artist?: string;
  image?: string;
  url: string;
  type: string;
}

type TabType = 'for-you' | 'trending' | 'news' | 'sports' | 'entertainment';

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'for-you', label: 'For you', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'sports', label: 'Sports', icon: Trophy },
  { id: 'entertainment', label: 'Entertainment', icon: Film },
];

function ExploreContent() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('for-you');
  
  // For You tab state
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<number>>(new Set());
  
  // Content state for each tab
  const [trendingNews, setTrendingNews] = useState<NewsItem[]>([]);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [sportsEvents, setSportsEvents] = useState<SportsEvent[]>([]);
  const [entertainment, setEntertainment] = useState<EntertainmentItem[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SuggestedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load current user
  useEffect(() => {
    async function loadCurrentUser() {
      if (!clerkUser?.username) return;
      try {
        const user = await userAPI.getUserByUsername(clerkUser.username);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error loading current user:', error);
      }
    }
    loadCurrentUser();
  }, [clerkUser?.username]);

  // Load For You data
  useEffect(() => {
    async function loadForYouData() {
      if (!currentUser?.id) return;
      setLoading(true);
      try {
        const [suggestions, hashtags] = await Promise.all([
          userAPI.getSuggestedUsers(currentUser.id, 5),
          userAPI.getTrendingHashtags(6),
        ]);
        setSuggestedUsers(suggestions || []);
        setTrendingHashtags(hashtags || []);
      } catch (error) {
        console.error('Error loading for you data:', error);
      } finally {
        setLoading(false);
      }
    }
    if (activeTab === 'for-you') {
      loadForYouData();
    }
  }, [currentUser?.id, activeTab]);

  // Load Trending data (Hacker News top stories)
  useEffect(() => {
    async function loadTrendingData() {
      setLoading(true);
      try {
        const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
        const storyIds = await res.json();
        const stories = await Promise.all(
          storyIds.slice(0, 15).map(async (id: number) => {
            const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return storyRes.json();
          })
        );
        setTrendingNews(stories.filter(s => s?.title).map((s: any) => ({
          id: s.id.toString(),
          title: s.title,
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          source: s.by || 'Hacker News',
          score: s.score,
          time: new Date(s.time * 1000).toLocaleDateString(),
        })));
      } catch (error) {
        console.error('Error loading trending:', error);
      } finally {
        setLoading(false);
      }
    }
    if (activeTab === 'trending') {
      loadTrendingData();
    }
  }, [activeTab]);

  // Load News data (Hacker News best stories)
  useEffect(() => {
    async function loadNewsData() {
      setLoading(true);
      try {
        const res = await fetch('https://hacker-news.firebaseio.com/v0/newstories.json');
        const storyIds = await res.json();
        const stories = await Promise.all(
          storyIds.slice(0, 15).map(async (id: number) => {
            const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            return storyRes.json();
          })
        );
        setLatestNews(stories.filter(s => s?.title).map((s: any) => ({
          id: s.id.toString(),
          title: s.title,
          url: s.url || `https://news.ycombinator.com/item?id=${s.id}`,
          source: s.by || 'Hacker News',
          score: s.score,
          time: new Date(s.time * 1000).toLocaleDateString(),
        })));
      } catch (error) {
        console.error('Error loading news:', error);
      } finally {
        setLoading(false);
      }
    }
    if (activeTab === 'news') {
      loadNewsData();
    }
  }, [activeTab]);

  // Load Sports data (TheSportsDB - free API)
  useEffect(() => {
    async function loadSportsData() {
      setLoading(true);
      try {
        // Fetch multiple leagues for variety
        const leagues = [
          { id: '4328', name: 'English Premier League' },
          { id: '4387', name: 'NBA' },
          { id: '4391', name: 'NFL' },
          { id: '4380', name: 'NHL' },
        ];
        
        const allEvents: SportsEvent[] = [];
        
        for (const league of leagues) {
          try {
            const res = await fetch(`https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=${league.id}`);
            const data = await res.json();
            if (data.events) {
              allEvents.push(...data.events.slice(0, 3).map((e: any) => ({
                id: e.idEvent,
                event: e.strEvent,
                league: e.strLeague,
                date: e.dateEvent,
                homeTeam: e.strHomeTeam,
                awayTeam: e.strAwayTeam,
                venue: e.strVenue,
              })));
            }
          } catch (e) {
            console.error(`Error fetching ${league.name}:`, e);
          }
        }
        
        setSportsEvents(allEvents);
      } catch (error) {
        console.error('Error loading sports:', error);
      } finally {
        setLoading(false);
      }
    }
    if (activeTab === 'sports') {
      loadSportsData();
    }
  }, [activeTab]);

  // Load Entertainment data (iTunes RSS feeds - free, CORS-friendly)
  useEffect(() => {
    async function loadEntertainmentData() {
      setLoading(true);
      try {
        const [podcastsRes, albumsRes, moviesRes] = await Promise.all([
          fetch('https://itunes.apple.com/us/rss/toppodcasts/limit=5/json'),
          fetch('https://itunes.apple.com/us/rss/topalbums/limit=5/json'),
          fetch('https://itunes.apple.com/us/rss/topmovies/limit=5/json'),
        ]);
        
        const [podcastsData, albumsData, moviesData] = await Promise.all([
          podcastsRes.json(),
          albumsRes.json(),
          moviesRes.json(),
        ]);
        
        const items: EntertainmentItem[] = [];
        
        // Add podcasts
        podcastsData.feed?.entry?.forEach((p: any) => {
          items.push({
            id: p.id?.attributes?.['im:id'] || Math.random().toString(),
            name: p['im:name']?.label || 'Unknown',
            artist: p['im:artist']?.label,
            image: p['im:image']?.[2]?.label,
            url: p.link?.attributes?.href || '#',
            type: 'Podcast',
          });
        });
        
        // Add albums
        albumsData.feed?.entry?.forEach((a: any) => {
          items.push({
            id: a.id?.attributes?.['im:id'] || Math.random().toString(),
            name: a['im:name']?.label || 'Unknown',
            artist: a['im:artist']?.label,
            image: a['im:image']?.[2]?.label,
            url: a.link?.attributes?.href || '#',
            type: 'Album',
          });
        });
        
        // Add movies
        moviesData.feed?.entry?.forEach((m: any) => {
          items.push({
            id: m.id?.attributes?.['im:id'] || Math.random().toString(),
            name: m['im:name']?.label || 'Unknown',
            artist: m['im:artist']?.label,
            image: m['im:image']?.[2]?.label,
            url: m.link?.attributes?.href || '#',
            type: 'Movie',
          });
        });
        
        setEntertainment(items);
      } catch (error) {
        console.error('Error loading entertainment:', error);
      } finally {
        setLoading(false);
      }
    }
    if (activeTab === 'entertainment') {
      loadEntertainmentData();
    }
  }, [activeTab]);

  // Search users
  useEffect(() => {
    async function searchUsers() {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await userAPI.searchUsers(searchQuery, 10);
        setSearchResults(results || []);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setIsSearching(false);
      }
    }
    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleFollow = async (targetUserId: number) => {
    if (!currentUser?.id) return;
    try {
      await userAPI.followUser(currentUser.id, targetUserId);
      setFollowingIds(prev => new Set([...prev, targetUserId]));
      setSuggestedUsers(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const renderForYouTab = () => {
    const displayUsers = searchQuery.trim() ? searchResults : suggestedUsers;
    
    return (
      <>
        {/* User Suggestions Section */}
        <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`p-4 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
            {searchQuery.trim() ? 'Search Results' : 'Who to follow'}
          </h2>
          
          {loading && !searchQuery ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              Loading suggestions...
            </div>
          ) : isSearching ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              Searching...
            </div>
          ) : displayUsers.length === 0 ? (
            <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              {searchQuery.trim() ? 'No users found' : 'No suggestions available'}
            </div>
          ) : (
            displayUsers.map((user) => (
              <div
                key={user.id}
                className={`p-4 flex items-center gap-3 transition-colors border-b ${
                  theme === 'dark' ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <Link href={`/pages/profile/${user.username}`} className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                </Link>
                
                <Link href={`/pages/profile/${user.username}`} className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                    {user.name}
                  </p>
                  <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                    @{user.username}
                  </p>
                </Link>

                {currentUser?.id !== user.id && (
                  followingIds.has(user.id) ? (
                    <button
                      className={`px-4 py-1.5 rounded-full text-sm font-bold ${
                        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'
                      }`}
                      disabled
                    >
                      Following
                    </button>
                  ) : (
                    <button
                      onClick={() => handleFollow(user.id)}
                      className="px-4 py-1.5 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition-colors"
                    >
                      Follow
                    </button>
                  )
                )}
              </div>
            ))
          )}
        </div>

        {/* Trending Hashtags Section */}
        {!searchQuery.trim() && trendingHashtags.length > 0 && (
          <div>
            <h2 className={`p-4 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              Trending Hashtags
            </h2>
            {trendingHashtags.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 cursor-pointer transition-colors border-b ${
                  theme === 'dark' ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  Trending
                </p>
                <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {item.hashtag}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  {formatCount(item.count)} posts
                </p>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  const renderTrendingTab = () => (
    <div>
      <h2 className={`p-4 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        Trending Now
      </h2>
      {loading ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          Loading trending stories...
        </div>
      ) : trendingNews.length === 0 ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          No trending stories available
        </div>
      ) : (
        trendingNews.map((item, idx) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block p-4 transition-colors border-b ${
              theme === 'dark' ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                {idx + 1}
              </span>
              <div className="flex-1">
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {item.title}
                </p>
                <div className={`flex items-center gap-2 mt-1 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  <span>by {item.source}</span>
                  {item.score && <span>· {formatCount(item.score)} points</span>}
                  {item.time && <span>· {item.time}</span>}
                </div>
              </div>
              <ExternalLink size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
            </div>
          </a>
        ))
      )}
    </div>
  );

  const renderNewsTab = () => (
    <div>
      <h2 className={`p-4 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        Latest News
      </h2>
      {loading ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          Loading news...
        </div>
      ) : latestNews.length === 0 ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          No news available
        </div>
      ) : (
        latestNews.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`block p-4 transition-colors border-b ${
              theme === 'dark' ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                theme === 'dark' ? 'bg-blue-400' : 'bg-blue-500'
              }`} />
              <div className="flex-1">
                <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                  {item.title}
                </p>
                <div className={`flex items-center gap-2 mt-1 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  <span>by {item.source}</span>
                  {item.time && <span>· {item.time}</span>}
                </div>
              </div>
              <ExternalLink size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
            </div>
          </a>
        ))
      )}
    </div>
  );

  const renderSportsTab = () => (
    <div>
      <h2 className={`p-4 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        Upcoming Sports Events
      </h2>
      {loading ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          Loading sports events...
        </div>
      ) : sportsEvents.length === 0 ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          No upcoming events
        </div>
      ) : (
        sportsEvents.map((event, idx) => (
          <div
            key={`${event.id}-${idx}`}
            className={`p-4 transition-colors border-b ${
              theme === 'dark' ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className={`text-xs font-medium mb-1 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {event.league}
            </div>
            <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
              {event.homeTeam} vs {event.awayTeam}
            </p>
            <div className={`flex items-center gap-2 mt-1 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
              <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              {event.venue && <span>· {event.venue}</span>}
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderEntertainmentTab = () => (
    <div>
      <h2 className={`p-4 text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
        Top Entertainment
      </h2>
      {loading ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          Loading entertainment...
        </div>
      ) : entertainment.length === 0 ? (
        <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
          No entertainment content available
        </div>
      ) : (
        entertainment.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-4 transition-colors border-b ${
              theme === 'dark' ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.name}
                className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className={`text-xs font-medium mb-0.5 ${
                item.type === 'Podcast' ? 'text-purple-500' :
                item.type === 'Album' ? 'text-green-500' : 'text-red-500'
              }`}>
                {item.type}
              </div>
              <p className={`font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-black'}`}>
                {item.name}
              </p>
              {item.artist && (
                <p className={`text-sm truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                  {item.artist}
                </p>
              )}
            </div>
            <ExternalLink size={16} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'} />
          </a>
        ))
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'for-you':
        return renderForYouTab();
      case 'trending':
        return renderTrendingTab();
      case 'news':
        return renderNewsTab();
      case 'sports':
        return renderSportsTab();
      case 'entertainment':
        return renderEntertainmentTab();
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className="flex justify-center max-w-[1400px] mx-auto">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Explore Area */}
        <main className={`flex-1 border-r max-w-2xl ${
          theme === 'dark'
            ? 'border-gray-700 bg-black'
            : 'border-gray-200 bg-white'
        }`}>
          {/* Search Bar */}
          <div className={`sticky top-0 backdrop-blur z-10 ${
            theme === 'dark' ? 'bg-black/90' : 'bg-white/90'
          }`}>
            <div className="p-4">
              <div className={`flex items-center gap-3 rounded-full px-4 py-2 ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
              }`}>
                <Search size={20} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`flex-1 bg-transparent outline-none ${
                    theme === 'dark'
                      ? 'text-white placeholder-gray-500'
                      : 'text-black placeholder-gray-600'
                  }`}
                />
              </div>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearchQuery('');
                  }}
                  className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? theme === 'dark' ? 'text-white' : 'text-black'
                      : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </main>

        {/* Right Sidebar */}
        <RightSidebar />
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <>
      <SignedIn>
        <ExploreContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
