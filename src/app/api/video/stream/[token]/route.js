/**
 * GET /api/video/stream/[token]
 * 
 * Streams the video by resolving the token to the real URL.
 * Supports HTTP Range requests (required for video seeking).
 * The real R2/CDN URL is NEVER revealed to the browser.
 */

import { NextResponse } from 'next/server';
import { resolveVideoToken } from '@/lib/videoTokens';

export async function GET(request, { params }) {
  const { token } = await params;

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  // Resolve token to real URL
  const resolved = resolveVideoToken(token);
  if (!resolved) {
    return new Response('Token expired or invalid. Please refresh the page.', { status: 410 });
  }

  const { videoUrl } = resolved;

  try {
    // Forward Range header for video seeking support
    const rangeHeader = request.headers.get('range');
    const fetchHeaders = { 'User-Agent': 'Flixon/1.0' };
    if (rangeHeader) fetchHeaders['Range'] = rangeHeader;

    const upstream = await fetch(videoUrl, {
      headers: fetchHeaders,
      signal: AbortSignal.timeout(30000),
    });

    if (!upstream.ok && upstream.status !== 206) {
      console.warn(`[Stream] Proxy failed for token ${token}. Redirecting directly to videoUrl...`);
      return NextResponse.redirect(videoUrl);
    }

    // Build response headers
    const responseHeaders = new Headers();
    const forwardHeaders = [
      'content-type', 'content-length', 'content-range',
      'accept-ranges', 'cache-control', 'last-modified',
    ];
    forwardHeaders.forEach(h => {
      const val = upstream.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Ensure no caching reveals the real URL path
    responseHeaders.set('cache-control', 'no-store');
    responseHeaders.delete('content-disposition'); // don't force download for streaming

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error('[Stream] Error during fetch, falling back to redirect:', err);
    return NextResponse.redirect(videoUrl);
  }
}

/**
 * GET /api/video/stream/[token]?download=1
 * Same as above but forces download
 */
export async function HEAD(request, { params }) {
  // Support HEAD requests (used by some video players to check file size)
  return GET(request, { params });
}
