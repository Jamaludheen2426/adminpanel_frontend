import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
  .replace(/\/api(\/v\d+)?\/?$/, '')
  .replace(/\/$/, '');

const MIME_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  ico: 'image/x-icon',
  avif: 'image/avif',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const backendUrl = `${BACKEND_BASE}/uploads/${path.join('/')}`;
    const response = await fetch(backendUrl);
    if (!response.ok) return new NextResponse(null, { status: response.status });
    const data = await response.arrayBuffer();
    const filename = path[path.length - 1] ?? '';
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';
    const contentType = response.headers.get('Content-Type') || MIME_TYPES[ext] || 'application/octet-stream';
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
