'use client';

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { Bell } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

function NotificationContent() {
  const { theme } = useTheme();

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Notification Area */}
      <main className={`flex-1 border-r max-w-2xl ${
        theme === 'dark'
          ? 'border-gray-700 bg-black'
          : 'border-gray-200 bg-white'
      }`}>
        {/* Notification Tabs */}
        <div className={`flex border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <button className="flex-1 py-4 font-bold text-center border-b-2 border-blue-500 text-blue-500">
            All
          </button>
          <button className={`flex-1 py-4 font-semibold text-center ${
            theme === 'dark' ? 'text-gray-500' : 'text-gray-600'
          }`}>
            Verified
          </button>
        </div>

        {/* Empty State */}
        <div className="flex flex-col items-center justify-center h-full">
          <Bell size={64} className={`mb-4 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <h3 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>No notifications yet</h3>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            When someone likes, replies to, or mentions you, you'll see it here
          </p>
        </div>
      </main>
    </div>
  );
}

export default function NotificationPage() {
  return (
    <>
      <SignedIn>
        <NotificationContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
