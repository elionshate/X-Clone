'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

interface LocalUserSession {
  id: number;
  username: string;
  email: string;
  name: string;
  avatar: string;
  isLocalUser: true;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isLocalUser: boolean;
  user: {
    id: number | string;
    username: string;
    email: string;
    name: string;
    avatar?: string;
  } | null;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to check for local session synchronously
function getLocalSession(): LocalUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('localUserSession');
    if (stored) {
      const session = JSON.parse(stored) as LocalUserSession;
      if (session.isLocalUser) {
        return session;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function TestAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  
  const [localSession, setLocalSession] = useState<LocalUserSession | null>(null);
  const [isCheckingLocalSession, setIsCheckingLocalSession] = useState(true);
  const [hasLocalSession, setHasLocalSession] = useState(false);

  // Check for local session first (before Clerk hooks run)
  useEffect(() => {
    const session = getLocalSession();
    if (session) {
      setLocalSession(session);
      setHasLocalSession(true);
    }
    setIsCheckingLocalSession(false);

    // Listen for storage changes
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'localUserSession') {
        const newSession = getLocalSession();
        setLocalSession(newSession);
        setHasLocalSession(newSession !== null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Only use Clerk hooks if there's no local session
  // This prevents Clerk from making API calls when not needed
  const clerkAuth = useAuth();
  const clerkUserData = useUser();
  
  // Extract Clerk values, but only use them if no local session
  const isSignedIn = hasLocalSession ? false : clerkAuth.isSignedIn;
  const clerkLoaded = hasLocalSession ? true : clerkAuth.isLoaded;
  const clerkSignOut = clerkAuth.signOut;
  const clerkUser = hasLocalSession ? null : clerkUserData.user;

  const handleSignOut = useCallback(async () => {
    if (localSession) {
      localStorage.removeItem('localUserSession');
      setLocalSession(null);
      setHasLocalSession(false);
      window.location.href = '/pages/login';
    } else if (isSignedIn) {
      try {
        await clerkSignOut();
      } catch (e) {
        console.error('Clerk sign out error:', e);
      }
      window.location.href = '/pages/login';
    }
  }, [localSession, isSignedIn, clerkSignOut]);

  const isLoading = !clerkLoaded || isCheckingLocalSession;
  const isAuthenticated = localSession !== null || isSignedIn === true;
  const isLocalUser = localSession !== null;

  // Build user object
  let user: AuthContextType['user'] = null;
  if (localSession) {
    user = {
      id: localSession.id,
      username: localSession.username,
      email: localSession.email,
      name: localSession.name,
      avatar: localSession.avatar,
    };
  } else if (isSignedIn && clerkUser) {
    user = {
      id: clerkUser.id,
      username: clerkUser.username || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || '',
      email: clerkUser.primaryEmailAddress?.emailAddress || '',
      name: clerkUser.fullName || clerkUser.firstName || '',
      avatar: clerkUser.imageUrl,
    };
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, isLocalUser, user, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useTestAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useTestAuth must be used within TestAuthProvider');
  }
  return context;
}

// Component to protect routes - works with both Clerk and local user
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useTestAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/pages/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
