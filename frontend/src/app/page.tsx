'use client';

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check for local user session
    const localSession = localStorage.getItem('localUserSession');
    if (localSession) {
      router.push('/pages/home');
      return;
    }

    // Wait for Clerk to load
    if (!isLoaded) return;

    if (isSignedIn) {
      // User is signed in with Clerk, redirect to home
      router.push('/pages/home');
    } else {
      // User is not signed in, redirect to login
      router.push('/pages/login');
    }
  }, [isSignedIn, isLoaded, router]);

  // Show loading while checking auth
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center">
        <span className="text-6xl font-bold text-white">𝕏</span>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
