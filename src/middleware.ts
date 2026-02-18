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
  let isSetupDisabled = false;

  // Always verify with backend when:
  // 1. No cookie and not on /install (cold start)
  // 2. Cookie says installed but user is visiting /install (might have been reset)
  const needsBackendCheck =
    (!isInstalled && !pathname.startsWith(INSTALL_ROUTE)) ||
    (isInstalled && pathname.startsWith(INSTALL_ROUTE)) ||
    pathname.startsWith(INSTALL_ROUTE); // Always check status when visiting /install

  if (needsBackendCheck) {
    try {
      // Use the proxy route for setup status check
      // This ensures setup status is checked through the same domain
      const res = await fetch('/api/proxy/v1/setup/status', {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const json = await res.json();
        isInstalled = json?.data?.installed === true;
        isSetupDisabled = json?.data?.disabled === true;
      }
    } catch {
      // Backend not reachable — don't redirect, let it fall through
      isInstalled = false;
    }
  }

  // If setup is disabled and user tries to access /install → send to login
  if (isSetupDisabled && pathname.startsWith(INSTALL_ROUTE)) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
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

  // On /install and not installed and setup not disabled → allow through
  if (pathname.startsWith(INSTALL_ROUTE)) {
    return NextResponse.next();
  }

  // ── YOUR ORIGINAL AUTH LOGIC (unchanged) ──────────────────────────────────

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const token = request.cookies.get('access_token')?.value;
  
  // Check for auth_pending flag (set by login hook for cross-domain cookie handling)
  // This allows access while cross-domain cookies propagate
  const authPendingCookie = request.cookies.get('auth_pending')?.value;
  const isAuthPending = authPendingCookie === 'true';

  // Redirect root to admin if logged in, otherwise to login
  if (pathname === '/') {
    if (token || isAuthPending) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If accessing public route, allow access
  if (isPublicRoute) {
    // Redirect authenticated users away from auth pages to admin
    // But allow if auth_pending (user just logged in, cookies might not be available yet)
    if ((token || isAuthPending) && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // If accessing admin route:
  // Allow if token exists OR auth_pending flag is set (waiting for cross-domain cookies)
  if (isAdminRoute && !token && !isAuthPending) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};