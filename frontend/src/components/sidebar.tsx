'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Home, Compass, Bell, Mail, Bookmark, User, MoreHorizontal, Feather, LogOut, UserPlus, Check, Trash2, Settings } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';
import { ThemePopup } from './theme-popup';
import { PostModal } from './post-modal';
import { userAPI } from '@/lib/api';
import { useUser, useClerk } from '@clerk/nextjs';

interface BackendUser {
  id: number;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  bio?: string;
}

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
  const { signOut } = useClerk();
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [backendUserId, setBackendUserId] = useState<number | undefined>();
  const [backendUser, setBackendUser] = useState<BackendUser | null>(null);
  const logoutPopupRef = useRef<HTMLDivElement>(null);

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
        
        // Check if user exists (API returns null if not found)
        if (existingUser && existingUser.id) {
          console.log('Found existing user with id:', existingUser.id);
          setBackendUserId(existingUser.id);
          setBackendUser(existingUser);
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
          setBackendUser(newUser);
        }
      } catch (error) {
        console.error('Error in getOrCreateUser:', error);
      }
    };

    getOrCreateUser();
  }, [clerkUser]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutPopupRef.current && !logoutPopupRef.current.contains(event.target as Node)) {
        setShowLogoutPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/pages/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAddAccount = () => {
    // Mock functionality - in a real app, this would open a new login flow
    alert('Add existing account feature coming soon! This would allow you to switch between multiple accounts.');
    setShowLogoutPopup(false);
  };

  const handleDeleteAccount = async () => {
    if (!backendUserId || !clerkUser) return;
    
    setIsDeleting(true);
    try {
      // Delete user from backend and Clerk
      await userAPI.deleteUser(backendUserId, clerkUser.id);
      
      // Sign out after deletion
      await signOut();
      window.location.href = '/pages/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

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
        <div className="relative" ref={logoutPopupRef}>
          {/* Logout Popup */}
          {showLogoutPopup && (
            <div className={`absolute bottom-full left-0 right-0 mb-2 rounded-xl shadow-lg overflow-hidden z-50 ${
              theme === 'dark' ? 'bg-black border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              {/* Current Account - Now clickable to go to profile */}
              <Link
                href="/pages/profile"
                onClick={() => setShowLogoutPopup(false)}
                className={`flex items-center justify-between p-4 border-b cursor-pointer transition-colors ${
                  theme === 'dark' ? 'border-gray-700 hover:bg-gray-900' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full overflow-hidden ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                  }`}>
                    {(backendUser?.avatar || clerkUser?.imageUrl) && (
                      <img src={backendUser?.avatar || clerkUser?.imageUrl} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${
                      theme === 'dark' ? 'text-white' : 'text-black'
                    }`}>
                      {backendUser?.name || clerkUser?.firstName || 'User'}
                    </p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
                    }`}>
                      @{clerkUser?.username || 'user'}
                    </p>
                  </div>
                </div>
                <Check size={18} className="text-blue-500" />
              </Link>

              {/* Add Account Option */}
              <button
                onClick={handleAddAccount}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                }`}
              >
                <UserPlus size={18} />
                <span className="font-semibold">Add an existing account</span>
              </button>

              {/* Settings Option */}
              <Link
                href="/pages/settings"
                onClick={() => setShowLogoutPopup(false)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                }`}
              >
                <Settings size={18} />
                <span className="font-semibold">Settings</span>
              </Link>

              {/* Logout Option */}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-900 text-white' : 'hover:bg-gray-50 text-black'
                }`}
              >
                <LogOut size={18} />
                <span className="font-semibold">Log out @{clerkUser?.username || 'user'}</span>
              </button>

              {/* Delete Account Option */}
              <button
                onClick={() => {
                  setShowLogoutPopup(false);
                  setShowDeleteConfirm(true);
                }}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors text-red-500 ${
                  theme === 'dark' ? 'hover:bg-gray-900' : 'hover:bg-gray-50'
                }`}
              >
                <Trash2 size={18} />
                <span className="font-semibold">Delete account</span>
              </button>
            </div>
          )}

          {/* User Menu Button */}
          <div
            onClick={() => setShowLogoutPopup(!showLogoutPopup)}
            className={`flex items-center justify-between p-3 rounded-full cursor-pointer ${
              theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-10 h-10 rounded-full overflow-hidden ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
              }`}>
                {(backendUser?.avatar || clerkUser?.imageUrl) && (
                  <img src={backendUser?.avatar || clerkUser?.imageUrl} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-bold text-sm truncate ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  {backendUser?.name || clerkUser?.firstName || 'User'}
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
        </div>
      </aside>

      {/* Post Modal */}
      <PostModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onPostCreated={handlePostCreated}
        userId={backendUserId}
      />

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className={`w-full max-w-md mx-4 rounded-2xl p-6 ${
            theme === 'dark' ? 'bg-black border border-gray-700' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Delete your account?
            </h2>
            <p className={`mb-6 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              This action is permanent and cannot be undone. All your data including tweets, comments, and followers will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className={`flex-1 py-3 px-4 rounded-full font-bold transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-800 text-white hover:bg-gray-700' 
                    : 'bg-gray-200 text-black hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-full font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
