'use client';

import { SignedIn, SignedOut, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";

function HomeContent() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/pages/home');
    }
  }, [isSignedIn, router]);

  return null;
}

export default function Home() {

  return (
    <main>
      <SignedIn>
        <HomeContent />
      </SignedIn>
      <SignedOut>
          {/* Landing Page - Shows for unauthenticated users */}
          <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="text-center space-y-8 max-w-md">
              {/* Logo */}
              <div className="text-6xl font-bold">𝕏</div>

              {/* Title */}
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  What's happening!?
                </h1>
                <p className="text-xl text-gray-600">
                  Join X Clone and join the conversation.
                </p>
              </div>

              {/* Call to Action */}
              <div className="space-y-3 pt-4">
                <Link
                  href="/pages/login"
                  className="block w-full rounded-full bg-blue-600 text-white font-bold py-3 px-8 hover:bg-blue-700 transition-colors text-center"
                >
                  Create Account
                </Link>

                <div className="flex items-center gap-2 my-4">
                  <div className="flex-1 h-px bg-gray-300"></div>
                  <span className="text-gray-600 text-sm">or</span>
                  <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                <Link
                  href="/pages/login"
                  className="block w-full rounded-full border-2 border-gray-300 text-gray-900 font-bold py-3 px-8 hover:bg-gray-50 transition-colors text-center"
                >
                  Sign In
                </Link>
              </div>

              {/* Features */}
              <div className="pt-8 space-y-4 text-left text-sm text-gray-700">
                <div className="flex gap-3">
                  <span className="text-2xl">✨</span>
                  <div>
                    <p className="font-bold">Share your thoughts</p>
                    <p className="text-gray-600">Post tweets and engage with others</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">🤝</span>
                  <div>
                    <p className="font-bold">Connect & Follow</p>
                    <p className="text-gray-600">Build your network and follow users</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-2xl">💬</span>
                  <div>
                    <p className="font-bold">Join conversations</p>
                    <p className="text-gray-600">Comment and reply to tweets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <HomeContent />
        </SignedIn>
      </main>
  );
}
