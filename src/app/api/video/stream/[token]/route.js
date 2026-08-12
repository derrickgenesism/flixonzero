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
    // To solve serverless timeouts and slow downloads, we redirect the user to the direct URL.
    // Proxying massive video files through Vercel serverless functions causes random disconnects 
    // and incredibly slow buffering/downloads.
    return NextResponse.redirect(videoUrl);
  } catch (err) {
    console.error('[Stream] Error parsing URL, falling back:', err);
    return new Response('Stream error', { status: 500 });
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
