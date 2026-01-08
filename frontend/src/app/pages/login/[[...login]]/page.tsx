'use client';

import { useSignIn, useSignUp, useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/providers/theme-provider";
import { Moon, Sun, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const { signIn, isLoaded: signInLoaded, setActive } = useSignIn();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  const { isSignedIn, signOut } = useAuth();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const isDark = theme === 'dark';

  // If user already has a local session, redirect to home
  useEffect(() => {
    const localSession = localStorage.getItem('localUserSession');
    if (localSession) {
      window.location.href = '/pages/home';
      return;
    }
    // Only try to sign out from Clerk if signed in
    // Wrap in try-catch to prevent 422 errors from breaking the app
    if (isSignedIn) {
      try {
        signOut().catch(() => {
          // Ignore Clerk sign out errors - user may not have a valid session
        });
      } catch {
        // Ignore errors
      }
    }
  }, [isSignedIn, signOut]);

  // Helper to clear Clerk cookies when using local auth
  const clearClerkCookies = () => {
    // Clear any Clerk-related cookies to prevent 422 errors
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      if (name.startsWith('__clerk') || name.startsWith('__session')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      }
    }
  };

  // Handle quick registration (creates user directly in backend)
  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !username || !email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      
      // Check if username already exists
      const checkResponse = await fetch(`${API_URL}/users/username/${username}`);
      if (checkResponse.ok) {
        throw new Error('Username already taken');
      }
      
      // Create user in backend directly
      const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          username: username.toLowerCase(),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create account');
      }
      
      const userData = await response.json();
      
      // Clear Clerk cookies to prevent 422 errors
      clearClerkCookies();
      
      // Store session in localStorage for local users
      localStorage.setItem('localUserSession', JSON.stringify({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        name: userData.name,
        avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
        isLocalUser: true,
      }));
      
      // Redirect to home
      window.location.href = '/pages/home';
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);
    setError('');
    
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    // First try to find user in backend by email or username
    try {
      // Try by username first (if email looks like a username)
      let userData = null;
      
      if (!email.includes('@')) {
        // It's a username, not email
        const response = await fetch(`${API_URL}/users/username/${email}`);
        if (response.ok) {
          userData = await response.json();
        }
      } else {
        // It's an email, search for user
        const response = await fetch(`${API_URL}/users/search?query=${encodeURIComponent(email)}&limit=1`);
        if (response.ok) {
          const users = await response.json();
          if (users.length > 0 && users[0].email === email) {
            userData = users[0];
          }
        }
      }
      
      // If found in backend, login as local user
      if (userData) {
        // Clear Clerk cookies to prevent 422 errors
        clearClerkCookies();
        
        localStorage.setItem('localUserSession', JSON.stringify({
          id: userData.id,
          username: userData.username,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
          isLocalUser: true,
        }));
        window.location.href = '/pages/home';
        return;
      }
    } catch (err) {
      // Backend lookup failed, try Clerk
      console.log('Backend lookup failed, trying Clerk...');
    }
    
    // Try Clerk authentication
    if (!signInLoaded || !signIn) {
      setError('Authentication service not ready');
      setIsLoading(false);
      return;
    }
    
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/pages/home');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      await signUp.create({
        emailAddress: email,
        password,
        username,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' ') || undefined,
      });

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setVerificationPending(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpLoaded || !signUp) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.push('/pages/home');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!signInLoaded || !signIn) return;
    
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/pages/login/sso-callback',
        redirectUrlComplete: '/pages/home',
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to sign in with Google');
    }
  };

  const handleGoogleSignUp = async () => {
    if (!signUpLoaded || !signUp) return;
    
    try {
      await signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/pages/login/sso-callback',
        redirectUrlComplete: '/pages/home',
      });
    } catch (err: any) {
      setError(err.errors?.[0]?.message || 'Failed to sign up with Google');
    }
  };

  // Verification code UI
  if (verificationPending) {
    return (
      <div className={`min-h-screen flex ${isDark ? 'bg-black' : 'bg-white'}`}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`absolute top-4 right-4 p-3 rounded-full transition-colors ${
            isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
          }`}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
              <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>𝕏</span>
            </div>

            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              We sent you a code
            </h1>
            <p className={`mb-8 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
              Enter it below to verify {email}
            </p>

            <form onSubmit={handleVerification} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Verification code"
                  className={`w-full px-4 py-4 rounded-md border text-lg transition-colors ${
                    isDark 
                      ? 'bg-black border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-blue-500'
                  } outline-none`}
                  autoFocus
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !verificationCode}
                className={`w-full py-3 rounded-full font-bold text-lg transition-colors ${
                  verificationCode && !isLoading
                    ? 'bg-white text-black hover:bg-gray-200'
                    : isDark
                      ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={24} /> : 'Verify'}
              </button>

              <button
                type="button"
                onClick={() => setVerificationPending(false)}
                className={`w-full py-3 rounded-full font-bold border transition-colors ${
                  isDark 
                    ? 'border-gray-700 text-white hover:bg-gray-900' 
                    : 'border-gray-300 text-black hover:bg-gray-50'
                }`}
              >
                Back
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-black' : 'bg-white'}`}>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className={`absolute top-4 right-4 p-3 rounded-full transition-colors z-10 ${
          isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
        }`}
        aria-label="Toggle theme"
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Left side - Logo (hidden on mobile) */}
      <div className={`hidden lg:flex flex-1 items-center justify-center ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
        <span className={`text-[280px] font-bold select-none ${isDark ? 'text-white' : 'text-black'}`}>𝕏</span>
      </div>

      {/* Right side - Auth form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <span className={`text-5xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>𝕏</span>
          </div>

          {/* Title */}
          <h1 className={`text-4xl lg:text-5xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isSignUp ? 'Join X today' : 'Sign in to X'}
          </h1>

          {/* OAuth Buttons */}
          <div className="space-y-3 mb-4">
            <button
              onClick={isSignUp ? handleGoogleSignUp : handleGoogleSignIn}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full font-medium transition-colors ${
                isDark 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
            </button>

            <button
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-full font-medium transition-colors ${
                isDark 
                  ? 'bg-white text-black hover:bg-gray-200' 
                  : 'bg-white text-black border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              {isSignUp ? 'Sign up with GitHub' : 'Sign in with GitHub'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 my-4">
            <div className={`flex-1 h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
            <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>or</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
          </div>

          {/* Form */}
          <form onSubmit={isSignUp ? handleQuickRegister : handleSignIn} className="space-y-4">
            {isSignUp && (
              <>
                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className={`w-full px-4 py-4 rounded-md border text-lg transition-colors ${
                      isDark 
                        ? 'bg-black border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-blue-500'
                    } outline-none`}
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="Username"
                    className={`w-full px-4 py-4 rounded-md border text-lg transition-colors ${
                      isDark 
                        ? 'bg-black border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                        : 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-blue-500'
                    } outline-none`}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className={`w-full px-4 py-4 rounded-md border text-lg transition-colors ${
                  isDark 
                    ? 'bg-black border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
                required
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full px-4 py-4 pr-12 rounded-md border text-lg transition-colors ${
                  isDark 
                    ? 'bg-black border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-black placeholder-gray-400 focus:border-blue-500'
                } outline-none`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {/* Clerk CAPTCHA element for bot protection - always rendered but hidden when not needed */}
            <div id="clerk-captcha" className={isSignUp ? '' : 'hidden'} />

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-full font-bold text-lg transition-colors ${
                isLoading
                  ? isDark
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {isLoading ? (
                <Loader2 className="animate-spin mx-auto" size={24} />
              ) : isSignUp ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Forgot password */}
          {!isSignUp && (
            <button className={`w-full mt-4 py-3 rounded-full font-bold border transition-colors ${
              isDark 
                ? 'border-gray-700 text-white hover:bg-gray-900' 
                : 'border-gray-300 text-black hover:bg-gray-50'
            }`}>
              Forgot password?
            </button>
          )}

          {/* Switch mode */}
          <p className={`mt-10 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setEmail('');
                setPassword('');
                setName('');
                setUsername('');
              }}
              className="text-blue-500 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>

          {/* Footer */}
          <footer className={`mt-16 text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'}`}>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <Link href="#" className="hover:underline">About</Link>
              <Link href="#" className="hover:underline">Download the X app</Link>
              <Link href="#" className="hover:underline">Help Center</Link>
              <Link href="#" className="hover:underline">Terms of Service</Link>
              <Link href="#" className="hover:underline">Privacy Policy</Link>
              <Link href="#" className="hover:underline">Cookie Policy</Link>
              <Link href="#" className="hover:underline">Accessibility</Link>
              <Link href="#" className="hover:underline">Ads info</Link>
              <Link href="#" className="hover:underline">Blog</Link>
              <Link href="#" className="hover:underline">Careers</Link>
              <Link href="#" className="hover:underline">Brand Resources</Link>
              <Link href="#" className="hover:underline">Advertising</Link>
              <Link href="#" className="hover:underline">Marketing</Link>
              <Link href="#" className="hover:underline">X for Business</Link>
              <Link href="#" className="hover:underline">Developers</Link>
              <Link href="#" className="hover:underline">Directory</Link>
              <Link href="#" className="hover:underline">Settings</Link>
            </div>
            <p className="mt-3">© 2026 X Clone.</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
