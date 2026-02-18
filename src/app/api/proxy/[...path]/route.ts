import { NextRequest, NextResponse } from 'next/server';

/**
 * API Proxy Route for cross-domain cookie handling
 * 
 * Forwards all requests to the backend (Render) and properly handles Set-Cookie headers.
 * By proxying through the same domain (Vercel), cookies are set on the Vercel domain
 * and can be read by Next.js middleware.
 * 
 * Usage:
 * - Frontend calls: /api/proxy/v1/auth/login
 * - Proxy forwards to: {NEXT_PUBLIC_API_URL}/v1/auth/login
 * - Cookies set on backend are returned to browser on Vercel domain
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Helper to forward a request
async function forwardRequest(request: NextRequest, path: string, method: string) {
  try {
    // Construct the full backend URL
    const backendUrl = `${BACKEND_URL}/${path}`;

    // Get request body if present
    let body: BodyInit | undefined;
    try {
      if (method !== 'GET' && method !== 'HEAD') {
        body = await request.text();
      }
    } catch {
      body = undefined;
    }

    // Forward headers (exclude host-specific headers)
    const headers = new Headers(request.headers);
    headers.delete('host');
    headers.delete('connection');
    
    // Always set JSON content type for non-file requests
    if (body && !headers.get('content-type')?.includes('multipart/form-data')) {
      headers.set('content-type', 'application/json');
    }

    // Make the request to backend
    const backendResponse = await fetch(backendUrl, {
      method,
      headers,
      body,
      credentials: 'include', // Include cookies in backend request
    });

    // Copy response status and basic headers
    const responseHeaders = new Headers(backendResponse.headers);

    // CRITICAL: Forward Set-Cookie headers from backend
    // These will be set on the Vercel domain (same domain as frontend)
    const setCookieHeaders = backendResponse.headers.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        responseHeaders.append('Set-Cookie', cookie);
      });
    }

    // Create response with forwarded body and headers
    const response = new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });

    return response;
  } catch (error) {
    console.error('[API Proxy Error]', error);
    return NextResponse.json(
      { success: false, message: 'Proxy request failed', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  return forwardRequest(request, path, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  return forwardRequest(request, path, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  return forwardRequest(request, path, 'PUT');
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  return forwardRequest(request, path, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  return forwardRequest(request, path, 'DELETE');
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  return forwardRequest(request, path, 'HEAD');
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathArray } = await params;
  const path = pathArray.join('/');
  return forwardRequest(request, path, 'OPTIONS');
}
