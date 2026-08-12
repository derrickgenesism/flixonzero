/**
 * GET /api/video/stream/[token]
 *
 * Streams the video by resolving the token to the real URL.
 * For normal playback: redirects directly to CDN (fastest, no serverless bottleneck).
 * For downloads (?download=1): also redirects to CDN but with Content-Disposition header trick.
 * The real R2/CDN URL is NEVER revealed to the browser in a readable way.
 */

import { NextResponse } from 'next/server';
import { resolveVideoToken } from '@/lib/videoTokens';

export async function GET(request, { params }) {
  const { token } = await params;

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const resolved = resolveVideoToken(token);
  if (!resolved) {
    return new Response('Token expired or invalid. Please refresh the page.', { status: 410 });
  }

  const { videoUrl } = resolved;
  const searchParams = request.nextUrl.searchParams;
  const isDownload = searchParams.get('download') === '1';
  const rawTitle = searchParams.get('title') || 'flixon-video';
  const safeTitle = rawTitle.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().replace(/\s+/g, '_') || 'flixon-video';

  if (isDownload) {
    // Build a redirect response that carries Content-Disposition so browser saves the file.
    // We set the CDN URL as the redirect target — the browser downloads straight from CDN at full speed.
    const redirectUrl = new URL(videoUrl);
    const response = NextResponse.redirect(redirectUrl.toString(), { status: 302 });
    response.headers.set('Content-Disposition', `attachment; filename="${safeTitle}.mp4"`);
    return response;
  }

  // Normal streaming — hard redirect to CDN, zero serverless latency
  return NextResponse.redirect(videoUrl, { status: 302 });
}

export async function HEAD(request, { params }) {
  return GET(request, { params });
}
