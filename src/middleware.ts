import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Grab the full cookie object so we can read its value
  const authCookie = request.cookies.get('auth-token'); 
  const isAuthenticated = !!authCookie;
  const tokenValue = authCookie?.value || '';
  
  const pathname = request.nextUrl.pathname;
  
  // Define login routes (public + undisclosed internal portals)
  const isLoginPage = 
    pathname.startsWith('/login') || 
    pathname.startsWith('/admin-portal') || 
    pathname.startsWith('/distributor-portal');
    
  // Define protected dashboard routes
  const isProtectedDashboard = pathname.startsWith('/investor');

  // Kicks unauthenticated users back to the public login if they hit a protected route
  if (isProtectedDashboard && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Prevent logged-in users from accessing ANY login page again
  if (isLoginPage && isAuthenticated) {
    // Smart redirect based on the token value we set during login
    if (tokenValue.includes('admin')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    } 
    if (tokenValue.includes('distributor')) {
      return NextResponse.redirect(new URL('/distributor', request.url));
    }
    
    // Default fallback for Investors
    return NextResponse.redirect(new URL('/investor', request.url));
  }

  // Allow the request to proceed normally if conditions are met
  return NextResponse.next();
}

// Specify exactly which paths this middleware should run on
export const config = {
  matcher: [
    '/login/:path*',
    '/admin-portal/:path*',
    '/distributor-portal/:path*',
    '/investor/:path*',
  ],
};