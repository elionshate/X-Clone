'use client';

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { Sidebar } from "@/components/sidebar";
import { MessageCircle } from "lucide-react";
import { useTheme } from "@/providers/theme-provider";

function ChatContent() {
  const { theme } = useTheme();

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Chat Area */}
      <main className={`flex-1 border-r ${
        theme === 'dark'
          ? 'border-gray-700 bg-black'
          : 'border-gray-200 bg-white'
      }`}>
        {/* Empty State */}
        <div className="flex flex-col items-center justify-center h-full">
          <MessageCircle size={64} className={`mb-4 ${
            theme === 'dark' ? 'text-gray-600' : 'text-gray-300'
          }`} />
          <h3 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-black'
          }`}>No messages yet</h3>
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            Start a conversation with someone to begin chatting
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <>
      <SignedIn>
        <ChatContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
