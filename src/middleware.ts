import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/auth',
  '/coming-soon',
];

// Admin routes that require authentication
const adminRoutes = ['/admin'];

// Install wizard route
const INSTALL_ROUTE = '/install';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── INSTALL GUARD (runs before everything else) ────────────────────────────

  // Fast path: cookie set by backend after finalize step
  const installedCookie = request.cookies.get('app_installed')?.value;
  let isInstalled = installedCookie === 'true';

  // Always verify with backend when:
  // 1. No cookie and not on /install (cold start)
  // 2. Cookie says installed but user is visiting /install (might have been reset)
  const needsBackendCheck =
    (!isInstalled && !pathname.startsWith(INSTALL_ROUTE)) ||
    (isInstalled && pathname.startsWith(INSTALL_ROUTE));

  if (needsBackendCheck) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
      const res = await fetch(`${apiUrl}/setup/status`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        isInstalled = json?.data?.installed === true;
      }
    } catch {
      // Backend not reachable — don't redirect, let it fall through
      isInstalled = false;
    }
  }

  // Not installed + not on /install → send to wizard
  if (!isInstalled && !pathname.startsWith(INSTALL_ROUTE)) {
    // Clear stale cookie if present
    const response = NextResponse.redirect(new URL(INSTALL_ROUTE, request.url));
    if (installedCookie) {
      response.cookies.delete('app_installed');
    }
    return response;
  }

  // Already installed + visiting /install → send to admin
  if (isInstalled && pathname.startsWith(INSTALL_ROUTE)) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // On /install and not installed → allow through
  if (pathname.startsWith(INSTALL_ROUTE)) {
    return NextResponse.next();
  }

  // ── YOUR ORIGINAL AUTH LOGIC (unchanged) ──────────────────────────────────

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const token = request.cookies.get('access_token')?.value;

  // Redirect root to admin if logged in, otherwise to login
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If accessing public route, allow access
  if (isPublicRoute) {
    // Redirect authenticated users away from auth pages to admin
    if (token && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // If accessing admin route and no token, redirect to login
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