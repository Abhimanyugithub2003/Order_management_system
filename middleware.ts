import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'aasa_auth_token';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  // Protect Dashboard Routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/seller')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect Logged-In Users away from Auth Pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    if (token) {
      const homeUrl = new URL('/', request.url);
      return NextResponse.redirect(homeUrl);
    }
  }

  return NextResponse.next();
}

// Matching paths
export const config = {
  matcher: ['/admin/:path*', '/seller/:path*', '/login', '/register'],
};
