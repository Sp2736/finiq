import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the user has an authentication token cookie
  const isAuthenticated = request.cookies.has('auth-token'); 
  
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  const isInvestorRoute = request.nextUrl.pathname.startsWith('/investor');

  // Protect the /investor routes
  if (isInvestorRoute && !isAuthenticated) {
    // Kicks unauthenticated users back to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Prevent logged-in users from accessing the login page again
  if (isLoginPage && isAuthenticated) {
    // Pushes authenticated users straight to their dashboard
    return NextResponse.redirect(new URL('/investor', request.url));
  }

  // Allow the request to proceed normally if conditions are met
  return NextResponse.next();
}

// Specify exactly which paths this middleware should run on
export const config = {
  matcher: [
    '/login/:path*',
    '/investor/:path*',
  ],
};