import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import Cookies from 'js-cookie';

// Routes that don't require authentication
const publicRoutes = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/coming-soon',
  '/',
];

// Admin routes that require authentication
const adminRoutes = ['/admin'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Check if route is admin route
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // Get token from cookies
  const token = request.cookies.get('accessToken')?.value;

  // If accessing public route, allow access
  if (isPublicRoute) {
    // Redirect authenticated users away from auth pages
    if (token && (pathname.startsWith('/auth') || pathname === '/')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // If accessing admin route and no token, redirect to signin
  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
