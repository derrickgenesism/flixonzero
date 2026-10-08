/**
 * GET /api/video/stream/[token]
 *
 * Resolves a short-lived token to the real video URL and redirects the browser
 * directly to the CDN. The real R2/CDN URL is never exposed in page source.
 *
 * For downloads, use POST /api/video/download which generates a presigned URL
 * with Content-Disposition: attachment.
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

  // Hard redirect to CDN — browser streams directly, zero Vercel latency
  const response = NextResponse.redirect(resolved.videoUrl, { status: 302 });
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  return response;
}

export async function HEAD(request, { params }) {
  return GET(request, { params });
}
