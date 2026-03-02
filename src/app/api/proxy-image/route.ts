import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        const targetUrl = new URL(url);

        // Append a version stamp so each refresh request is a unique URL,
        // preventing Next.js and the browser from serving a stale cached response.
        targetUrl.searchParams.set('_v', Date.now().toString());

        const response = await fetch(targetUrl.toString(), {
            cache: 'no-store',
            headers: {
                'Pragma': 'no-cache',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Expires': '0',
            },
        });

        if (!response.ok) {
            throw new Error(`Upstream fetch failed: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'no-store, must-revalidate',
                'Access-Control-Allow-Origin': '*',
            },
        });
    } catch (error) {
        console.error('[PROXY_ERROR]', error);
        return new NextResponse('Proxy error', { status: 500 });
    }
}
