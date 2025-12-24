'use client';

import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";
import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { Feed } from "@/components/feed";
import { RightSidebar } from "@/components/right-sidebar";
import { useTheme } from "@/providers/theme-provider";

function HomeContent() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<'for-you' | 'following'>('for-you');

  return (
    <div className={`flex min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main Feed */}
      <Feed tab={tab} onTabChange={setTab} />

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SignedIn>
        <HomeContent />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
