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
  const isAdminRoute  = adminRoutes.some((route) => pathname.startsWith(route));
  const isVendorRoute = pathname.startsWith('/vendor');

  // Admin session cookies
  const accessToken     = request.cookies.get('access_token')?.value;
  const refreshToken    = request.cookies.get('refresh_token')?.value;
  const authPending     = request.cookies.get('auth_pending')?.value === 'true';
  const isAdminLoggedIn = !!(accessToken || refreshToken || authPending);

  // Vendor session cookies
  const vendorAccessToken  = request.cookies.get('vendor_access_token')?.value;
  const vendorRefreshToken = request.cookies.get('vendor_refresh_token')?.value;
  const vendorAuthPending  = request.cookies.get('vendor_auth_pending')?.value === 'true';
  const isVendorLoggedIn   = !!(vendorAccessToken || vendorRefreshToken || vendorAuthPending);

  // Redirect root based on who is logged in
  if (pathname === '/') {
    if (isAdminLoggedIn)  return NextResponse.redirect(new URL('/admin', request.url));
    if (isVendorLoggedIn) return NextResponse.redirect(new URL('/vendor/dashboard', request.url));
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Public routes (auth pages)
  if (isPublicRoute) {
    if (isAdminLoggedIn && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (isVendorLoggedIn && !isAdminLoggedIn && pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/vendor/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Admin routes require admin session
  if (isAdminRoute && !isAdminLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // Vendor routes require vendor session
  if (isVendorRoute && !isVendorLoggedIn) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};