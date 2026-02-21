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

async function forwardRequest(request: NextRequest, path: string, method: string) {
  try {
    // Construct the full backend URL
    // Strip leading "v1/" from path because NEXT_PUBLIC_API_URL already ends in /v1
    // e.g. path = "v1/auth/login" → strippedPath = "auth/login"
    // Final URL: https://backend.onrender.com/api/v1/auth/login  ✓
    const strippedPath = path.startsWith('v1/') ? path.slice(3) : path;
    const searchParams = request.nextUrl.search;
    const backendUrl = `${BACKEND_URL}/${strippedPath}${searchParams}`;

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
    headers.delete('content-length'); // CRITICAL: Fetch recalculates this. Old length causes backend hangs.

    // Make the request to backend
    const backendResponse = await fetch(backendUrl, {
      method,
      headers,
      body: body || undefined,
      credentials: 'include',
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie'].includes(lowerKey)) {
        responseHeaders.append(key, value);
      }
    });

    const setCookieHeaders = backendResponse.headers.getSetCookie?.();
    if (setCookieHeaders && setCookieHeaders.length > 0) {
      setCookieHeaders.forEach(cookie => {
        responseHeaders.append('Set-Cookie', cookie);
      });
    }

    // Read full body and create response (avoids streaming hangs in Next.js)
    const responseData = await backendResponse.arrayBuffer();

    return new NextResponse(responseData, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[API Proxy Error]', error);
    return NextResponse.json(
      { success: false, message: 'Proxy request failed: Backend unreachable or timed out' },
      { status: 504 }
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
