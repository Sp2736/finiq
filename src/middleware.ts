// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  
  // Get the hostname (e.g., 'admin.finiq.com', 'investors.localhost:3000')
  const hostname = req.headers.get('host') || '';

  // Define your base domain depending on the environment
  const baseDomain = process.env.NODE_ENV === 'production' ? 'finiq.com' : 'localhost:3000';

  // Extract the subdomain (returns '' if it's the root domain)
  const subdomain = hostname.replace(`.${baseDomain}`, '').replace(baseDomain, '');

  // Allow Next.js internal requests, static files, and API routes to pass through untouched
  if (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // ==========================================
  // SUBDOMAIN ROUTING LOGIC
  // ==========================================

  // We do NOT rewrite the /login route because it is a shared UI located at src/app/(auth)/login
  // The login page itself will read the subdomain to know which API to hit.
  if (url.pathname === '/login') {
    return NextResponse.next();
  }

  // Rewrite authenticated routes based on the subdomain
  if (subdomain === 'admin') {
    return NextResponse.rewrite(new URL(`/admin${url.pathname}`, req.url));
  }
  
  if (subdomain === 'investors' || subdomain === 'investor') {
    return NextResponse.rewrite(new URL(`/investor${url.pathname}`, req.url));
  }
  
  if (subdomain === 'distributor') {
    return NextResponse.rewrite(new URL(`/distributor${url.pathname}`, req.url));
  }

  // If no subdomain matches, proceed to root
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except for Next.js internals and static files
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
  ],
};