'use client';

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { Bookmark } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

function BookmarksContent() {
  const { theme } = useTheme();

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Bookmarks Area */}
      <main className={`flex-1 border-r max-w-2xl ${
        theme === 'dark'
          ? 'border-gray-700 bg-black'
          : 'border-gray-200 bg-white'
      }`}>
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center h-full">
          <Bookmark size={64} className={`mb-4 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <h3 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>Save posts for later</h3>
          <p className={`text-center max-w-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Bookmark posts to easily find them again in the future.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function BookmarksPage() {
  return (
    <>
      <SignedIn>
        <BookmarksContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
