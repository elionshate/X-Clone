'use client';

import { Search, TrendingUp } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

const trendingItems = [
  { category: 'Technology', topic: '#ReactJS', posts: '245K Posts' },
  { category: 'Trending Worldwide', topic: '#WebDevelopment', posts: '1.5M Posts' },
  { category: 'Programming', topic: '#TypeScript', posts: '892K Posts' },
  { category: 'Trending Worldwide', topic: '#FullStack', posts: '567K Posts' },
  { category: 'Technology', topic: '#NextJS', posts: '432K Posts' },
];

const newsItems = [
  {
    title: 'New React 19 Features Released',
    description: 'React team announces exciting new features...',
    source: 'React Blog',
    time: '2h ago',
  },
  {
    title: 'TypeScript 5.3 is Now Available',
    description: 'Latest version brings performance improvements...',
    source: 'TypeScript Blog',
    time: '4h ago',
  },
  {
    title: 'Next.js 14 Performance Update',
    description: 'Significant improvements to build times...',
    source: 'Vercel Blog',
    time: '6h ago',
  },
];

export function RightSidebar() {
  const { theme } = useTheme();

  return (
    <aside className={`w-80 p-4 sticky top-0 h-screen overflow-y-auto hidden xl:block ${
      theme === 'dark' ? 'bg-black' : 'bg-white'
    }`}>
      {/* Search Bar */}
      <div className={`relative mb-4 p-0 rounded-full flex items-center gap-3 ${
        theme === 'dark'
          ? 'bg-gray-900 text-gray-500'
          : 'bg-gray-100 text-gray-600'
      }`}>
        <Search size={20} className="ml-4" />
        <input
          type="text"
          placeholder="Search X Clone"
          className={`flex-1 py-3 outline-none rounded-full ${
            theme === 'dark'
              ? 'bg-gray-900 text-white placeholder-gray-500'
              : 'bg-gray-100 text-black placeholder-gray-600'
          }`}
        />
      </div>

      {/* What's Happening Section */}
      <div className={`rounded-2xl p-4 mb-4 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <h3 className={`text-2xl font-bold mb-4 flex items-center gap-2 ${
          theme === 'dark' ? 'text-white' : 'text-black'
        }`}>
          <TrendingUp size={24} className="text-blue-500" />
          What's happening!?
        </h3>

        <div className="space-y-4">
          {trendingItems.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
            >
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                {item.category}
              </p>
              <p className={`font-bold text-lg ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                {item.topic}
              </p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                {item.posts}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Today's News Section */}
      <div className={`rounded-2xl p-4 ${
        theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
      }`}>
        <h3 className={`text-2xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-black'
        }`}>
          Today's News
        </h3>

        <div className="space-y-4">
          {newsItems.map((news, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-800'
                  : 'hover:bg-gray-200'
              }`}
            >
              <p className={`text-sm font-semibold ${
                theme === 'dark' ? 'text-blue-500' : 'text-blue-600'
              }`}>
                {news.source} · {news.time}
              </p>
              <p className={`font-bold text-base mt-1 ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                {news.title}
              </p>
              <p className={`text-sm mt-1 ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              }`}>
                {news.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
