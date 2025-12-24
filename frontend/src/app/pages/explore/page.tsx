'use client';

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { Search } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

function ExploreContent() {
  const { theme } = useTheme();

  const trendingTopics = [
    { category: 'Technology', topic: '#ReactJS', posts: '245K Posts' },
    { category: 'Programming', topic: '#TypeScript', posts: '892K Posts' },
    { category: 'Web Development', topic: '#NextJS', posts: '432K Posts' },
    { category: 'Trending', topic: '#JavaScript', posts: '1.2M Posts' },
    { category: 'Technology', topic: '#TailwindCSS', posts: '156K Posts' },
    { category: 'Trending', topic: '#WebDev', posts: '678K Posts' },
  ];

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Explore Area */}
      <main className={`flex-1 border-r max-w-2xl ${
        theme === 'dark'
          ? 'border-gray-700 bg-black'
          : 'border-gray-200 bg-white'
      }`}>
        {/* Search Bar */}
        <div className={`sticky top-0 backdrop-blur z-10 p-4 ${
          theme === 'dark'
            ? 'bg-black/90'
            : 'bg-white/90'
        }`}>
          <div className={`flex items-center gap-3 rounded-full px-4 py-2 ${
            theme === 'dark'
              ? 'bg-gray-900'
              : 'bg-gray-100'
          }`}>
            <Search size={20} className={theme === 'dark' ? 'text-gray-500' : 'text-gray-600'} />
            <input
              type="text"
              placeholder="Search"
              className={`flex-1 bg-transparent outline-none ${
                theme === 'dark'
                  ? 'text-white placeholder-gray-500'
                  : 'text-black placeholder-gray-600'
              }`}
            />
          </div>
        </div>

        {/* Trending Section */}
        <div className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`p-4 text-xl font-bold ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>
            Trends for you
          </h2>
          
          {trendingTopics.map((item, idx) => (
            <div
              key={idx}
              className={`p-4 cursor-pointer transition-colors border-b ${
                theme === 'dark'
                  ? 'border-gray-700 hover:bg-gray-900'
                  : 'border-gray-200 hover:bg-gray-50'
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
      </main>
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
