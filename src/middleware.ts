import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const staffCookie = request.cookies.get('staff-auth-token');
  const investorCookie = request.cookies.get('investor-auth-token');

  const isInvestorAuthenticated = !!investorCookie;
  const isStaffAuthenticated = !!staffCookie;

  // Define login routes
  const isInvestorLogin = pathname.startsWith('/login');
  const isStaffLogin = pathname.startsWith('/admin-portal') || pathname.startsWith('/distributor-portal');
  const isAnyLoginPage = isInvestorLogin || isStaffLogin;

  // Define protected dashboard routes
  const isInvestorRoute = pathname.startsWith('/investor');
  const isAdminRoute = pathname.startsWith('/admin') && !pathname.startsWith('/admin-portal');
  const isDistributorRoute = pathname.startsWith('/distributor') && !pathname.startsWith('/distributor-portal');
  const isStaffRoute = isAdminRoute || isDistributorRoute;

  // ─── PROTECTION LOGIC ──────────────────────────────────────────────────

  // Investor Route Protection
  if (isInvestorRoute && !isInvestorAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Staff Route Protection (Admin/Distributor)
  if (isStaffRoute && !isStaffAuthenticated) {
    const targetPortal = isAdminRoute ? '/admin-portal' : '/distributor-portal';
    return NextResponse.redirect(new URL(targetPortal, request.url));
  }

  // ─── PREVENT RE-LOGIN ──────────────────────────────────────────────────

  if (isInvestorLogin && isInvestorAuthenticated) {
    return NextResponse.redirect(new URL('/investor', request.url));
  }

  if (isStaffLogin && isStaffAuthenticated) {
    // Redirect to the appropriate dashboard based on which portal they are on
    const destination = pathname.startsWith('/admin-portal') ? '/admin' : '/distributor';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return NextResponse.next();
}

// Specify exactly which paths this middleware should run on
export const config = {
  matcher: [
    '/login/:path*',
    '/admin-portal/:path*',
    '/distributor-portal/:path*',
    '/investor/:path*',
    '/admin/:path*',
    '/distributor/:path*',
  ],
};