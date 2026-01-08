import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Routes that should completely bypass Clerk middleware
const isAppRoute = createRouteMatcher([
  '/pages/home(.*)',
  '/pages/profile(.*)',
  '/pages/explore(.*)',
  '/pages/notifications(.*)',
  '/pages/messages(.*)',
  '/pages/bookmarks(.*)',
  '/pages/settings(.*)',
])

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/pages/login(.*)',
  '/sign-in(.*)',
  '/sign-up(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  // For app routes, bypass Clerk entirely - auth is handled client-side
  if (isAppRoute(req)) {
    return NextResponse.next()
  }
  
  // If the route is not public, protect it with Clerk
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
