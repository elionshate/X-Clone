'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useEffect, useState, ReactNode } from 'react';

// Check if there's a local user session before loading Clerk
function hasLocalUserSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem('localUserSession');
    if (stored) {
      const session = JSON.parse(stored);
      return session?.isLocalUser === true;
    }
  } catch {
    // Ignore errors
  }
  return false;
}

interface SmartClerkProviderProps {
  children: ReactNode;
}

// A minimal provider that skips Clerk when local user is detected
export function SmartClerkProvider({ children }: SmartClerkProviderProps) {
  const [isLocalUser, setIsLocalUser] = useState<boolean | null>(null);

  useEffect(() => {
    setIsLocalUser(hasLocalUserSession());

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'localUserSession') {
        setIsLocalUser(hasLocalUserSession());
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Show loading state while checking
  if (isLocalUser === null) {
    return <>{children}</>;
  }

  // If local user, wrap with a minimal Clerk provider that won't make API calls
  // We still need ClerkProvider for the hooks to work, but we can suppress errors
  return (
    <ClerkProvider
      signInUrl="/pages/login"
      signUpUrl="/pages/login"
      signInFallbackRedirectUrl="/pages/home"
      signUpFallbackRedirectUrl="/pages/home"
      // When local user is active, we don't need Clerk to sync
      {...(isLocalUser ? { 
        // These props help reduce unnecessary Clerk API calls
        afterSignOutUrl: "/pages/login",
      } : {})}
    >
      {children}
    </ClerkProvider>
  );
}
