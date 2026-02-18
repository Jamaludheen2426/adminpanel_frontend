import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/auth',
  '/coming-soon',
];

// Admin routes that require authentication
const adminRoutes = ['/admin'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── INSTALL WIZARD DISABLED (Commented for future use) ───────────────────
  /*
  const installedCookie = request.cookies.get('app_installed')?.value;
  let isInstalled = installedCookie === 'true';
  let isSetupDisabled = false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const needsBackendCheck = (!isInstalled && !pathname.startsWith('/install')) || (isInstalled && pathname.startsWith('/install')) || pathname.startsWith('/install');

  if (needsBackendCheck) {
    try {
      const res = await fetch(`${appUrl}/api/proxy/v1/setup/status`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const json = await res.json();
        isInstalled = json?.data?.installed === true;
        isSetupDisabled = json?.data?.disabled === true;
      }
    } catch { isInstalled = false; }
  }

  if (isSetupDisabled && pathname.startsWith('/install')) return NextResponse.redirect(new URL('/auth/login', request.url));
  if (!isInstalled && !pathname.startsWith('/install')) return NextResponse.redirect(new URL('/install', request.url));
  if (isInstalled && pathname.startsWith('/install')) return NextResponse.redirect(new URL('/admin', request.url));
  */

  // Current Bypass: Always redirect /install to /admin
  if (pathname.startsWith('/install')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // ── AUTH LOGIC ─────────────────────────────────────────────────────────────

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));
  const token = request.cookies.get('access_token')?.value;

  // Check for auth_pending flag (set by login hook for cross-domain cookie handling)
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
    if ((token || isAuthPending) && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    return NextResponse.next();
  }

  // If accessing admin route without token → send to login
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