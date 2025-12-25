'use client';

import { useState, useEffect } from 'react';
import { SignedIn, SignedOut, RedirectToSignIn, useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { userAPI } from "@/lib/api";
import { useTheme } from "@/providers/theme-provider";
import { ArrowLeft, UserX, Shield, Lock } from 'lucide-react';
import Link from 'next/link';

interface BlockedUser {
  id: number;
  blockerId: number;
  blockedId: number;
  blocked: {
    id: number;
    name: string;
    username: string;
    avatar?: string;
  };
}

function SettingsContent() {
  const { theme } = useTheme();
  const { user: clerkUser } = useUser();
  const [backendUserId, setBackendUserId] = useState<number | null>(null);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'blocked' | 'privacy' | 'security'>('blocked');

  useEffect(() => {
    const loadUserData = async () => {
      if (!clerkUser?.username) return;
      
      try {
        const user = await userAPI.getUserByUsername(clerkUser.username);
        if (user?.id) {
          setBackendUserId(user.id);
          const blocked = await userAPI.getBlockedUsers(user.id);
          setBlockedUsers(blocked || []);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [clerkUser?.username]);

  const handleUnblock = async (blockedUserId: number) => {
    if (!backendUserId) return;
    if (!confirm('Are you sure you want to unblock this user?')) return;

    try {
      await userAPI.unblockUser(backendUserId, blockedUserId);
      setBlockedUsers(prev => prev.filter(b => b.blockedId !== blockedUserId));
    } catch (error) {
      console.error('Error unblocking user:', error);
      alert('Failed to unblock user');
    }
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <Sidebar />
      
      <main className={`flex-1 border-r ${
        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Header */}
        <div className={`sticky top-0 z-10 backdrop-blur-md border-b p-4 ${
          theme === 'dark' 
            ? 'bg-black/80 border-gray-700' 
            : 'bg-white/80 border-gray-200'
        }`}>
          <div className="flex items-center gap-4">
            <Link 
              href="/pages/profile"
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-800 text-white' 
                  : 'hover:bg-gray-100 text-black'
              }`}
            >
              <ArrowLeft size={20} />
            </Link>
            <h1 className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-black'
            }`}>
              Settings
            </h1>
          </div>
        </div>

        <div className="flex">
          {/* Settings Navigation */}
          <div className={`w-64 border-r ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <nav className="p-2">
              <button
                onClick={() => setActiveSection('blocked')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeSection === 'blocked'
                    ? theme === 'dark' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-black'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <UserX size={20} />
                <span>Blocked Accounts</span>
              </button>
              <button
                onClick={() => setActiveSection('privacy')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeSection === 'privacy'
                    ? theme === 'dark' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-black'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <Shield size={20} />
                <span>Privacy</span>
              </button>
              <button
                onClick={() => setActiveSection('security')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  activeSection === 'security'
                    ? theme === 'dark' 
                      ? 'bg-gray-800 text-white' 
                      : 'bg-gray-100 text-black'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <Lock size={20} />
                <span>Security</span>
              </button>
            </nav>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-6">
            {activeSection === 'blocked' && (
              <div>
                <h2 className={`text-lg font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Blocked Accounts
                </h2>
                <p className={`mb-6 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  When you block someone, they won't be able to find you, see your posts, 
                  or interact with you. You also won't see their content.
                </p>

                {loading ? (
                  <div className={`text-center py-8 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Loading...
                  </div>
                ) : blockedUsers.length === 0 ? (
                  <div className={`text-center py-8 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <UserX size={48} className="mx-auto mb-4 opacity-50" />
                    <p>You haven't blocked anyone yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedUsers.map((block) => (
                      <div 
                        key={block.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full overflow-hidden ${
                            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'
                          }`}>
                            {block.blocked.avatar ? (
                              <img 
                                src={block.blocked.avatar} 
                                alt="" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg font-bold">
                                {block.blocked.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className={`font-bold ${
                              theme === 'dark' ? 'text-white' : 'text-black'
                            }`}>
                              {block.blocked.name}
                            </p>
                            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                              @{block.blocked.username}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleUnblock(block.blockedId)}
                          className={`px-4 py-2 rounded-full font-bold transition-colors ${
                            theme === 'dark'
                              ? 'bg-white text-black hover:bg-gray-200'
                              : 'bg-black text-white hover:bg-gray-800'
                          }`}
                        >
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'privacy' && (
              <div>
                <h2 className={`text-lg font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Privacy Settings
                </h2>
                <p className={`mb-6 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Control who can see your content and interact with you.
                </p>
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    Privacy settings coming soon...
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div>
                <h2 className={`text-lg font-bold mb-4 ${
                  theme === 'dark' ? 'text-white' : 'text-black'
                }`}>
                  Security Settings
                </h2>
                <p className={`mb-6 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Manage your account security and authentication.
                </p>
                <div className={`p-4 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                    Security settings coming soon...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Right sidebar placeholder for layout consistency */}
      <div className="w-80 hidden lg:block" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <SignedIn>
        <SettingsContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
