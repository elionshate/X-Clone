'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, Compass, Bell, Mail, Bookmark, User, MoreHorizontal, Feather } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { ThemePopup } from './theme-popup';
import { PostModal } from './post-modal';
import { userAPI } from '@/lib/api';
import { useUser } from '@clerk/nextjs';

const navItems = [
  { icon: Home, label: 'Home', href: '/pages/home' },
  { icon: Compass, label: 'Explore', href: '/pages/explore' },
  { icon: Bell, label: 'Notifications', href: '/pages/notification' },
  { icon: Mail, label: 'Messages', href: '/pages/chat' },
  { icon: Bookmark, label: 'Bookmarks', href: '/pages/bookmarks' },
  { icon: User, label: 'Profile', href: '/pages/profile' },
];

export function Sidebar() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [backendUserId, setBackendUserId] = useState<number | undefined>();

  // Get or create backend user
  useEffect(() => {
    const getOrCreateUser = async () => {
      // Wait for Clerk user to be available
      if (!clerkUser) {
        console.log('Clerk user not available yet');
        return;
      }
      
      const username = clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || `user_${clerkUser.id.slice(0, 8)}`;
      const email = clerkUser.primaryEmailAddress?.emailAddress || `${username}@example.com`;
      const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || username;
      
      console.log('Looking for user with username:', username);
      
      try {
        // Try to get existing user by username
        const existingUser = await userAPI.getUserByUsername(username);
        console.log('API response for getUserByUsername:', existingUser);
        
        // Check if user exists (API returns null/empty if not found)
        if (existingUser && existingUser.id) {
          console.log('Found existing user with id:', existingUser.id);
          setBackendUserId(existingUser.id);
          return;
        }
        
        // User doesn't exist, create one
        console.log('User not found in backend, creating new user...');
        const newUser = await userAPI.createUser({
          name,
          email,
          username,
        });
        console.log('Created new user:', newUser);
        if (newUser?.id) {
          setBackendUserId(newUser.id);
        }
      } catch (error) {
        console.error('Error in getOrCreateUser:', error);
        // If lookup failed with error, try to create user
        try {
          const newUser = await userAPI.createUser({
            name,
            email,
            username,
          });
          console.log('Created new user after error:', newUser);
          if (newUser?.id) {
            setBackendUserId(newUser.id);
          }
        } catch (createError) {
          console.error('Error creating user:', createError);
        }
      }
    };

    getOrCreateUser();
  }, [clerkUser]);

  const handlePostCreated = () => {
    // Refresh the page to show new tweet
    window.location.reload();
  };

  return (
    <>
      <aside className={`w-64 border-r p-4 sticky top-0 h-screen flex flex-col ${
        theme === 'dark' 
          ? 'border-gray-700 bg-black' 
          : 'border-gray-200 bg-white'
      }`}>
        {/* Logo */}
        <Link 
          href="/pages/home" 
          className={`text-3xl font-bold mb-8 block ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}
        >
          𝕏
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navItems.map(({ icon: Icon, label, href }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 p-3 rounded-full text-xl font-semibold transition-colors ${
                theme === 'dark'
                  ? 'text-white hover:bg-gray-800'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <Icon size={24} />
              <span>{label}</span>
            </Link>
          ))}
          
          {/* Theme Toggle */}
          <ThemePopup />
        </nav>

        {/* Post Button */}
        <button 
          onClick={() => setIsPostModalOpen(true)}
          className="w-full py-3 px-8 rounded-full font-bold text-lg transition-colors mb-4 bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
        >
          <Feather size={20} />
          Post
        </button>

        {/* User Menu */}
        <div className={`flex items-center justify-between p-3 rounded-full cursor-pointer ${
          theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
        }`}>
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 rounded-full ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
            }`}></div>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${
                theme === 'dark' ? 'text-white' : 'text-black'
              }`}>
                {clerkUser?.firstName || 'User'}
              </p>
              <p className={`text-sm truncate ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
              }`}>
                @{clerkUser?.username || 'user'}
              </p>
            </div>
          </div>
          <MoreHorizontal size={18} className={theme === 'dark' ? 'text-white' : 'text-black'} />
        </div>
      </aside>

      {/* Post Modal */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onPostCreated={handlePostCreated}
        userId={backendUserId}
      />
    </>
  );
}
