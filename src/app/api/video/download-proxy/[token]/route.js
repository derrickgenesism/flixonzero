/**
 * GET /api/video/download-proxy/[token]
 *
 * Streaming proxy for external video downloads.
 * Resolves a short-lived token to the real external video URL,
 * fetches it, and streams it back to the browser with
 * Content-Disposition: attachment so it appears in native downloads.
 *
 * Uses Edge Runtime for optimal streaming performance.
 */

import { resolveVideoToken } from '@/lib/videoTokens';

export const runtime = 'edge';

export async function GET(request, { params }) {
  const { token } = await params;

  if (!token) {
    return new Response('Missing token', { status: 400 });
  }

  const resolved = resolveVideoToken(token);
  if (!resolved) {
    return new Response('Download link expired. Please go back and click Download again.', {
      status: 410,
    });
  }

  // Get the filename from query params
  const url = new URL(request.url);
  const filename = url.searchParams.get('filename') || 'flixon-video';

  try {
    // Fetch the external video
    const upstream = await fetch(resolved.videoUrl);

    if (!upstream.ok) {
      return new Response('Failed to fetch video from external source.', { status: 502 });
    }

    // Stream it through with download headers
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}.mp4"`,
        ...(upstream.headers.get('content-length')
          ? { 'Content-Length': upstream.headers.get('content-length') }
          : {}),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[download-proxy] Error:', err);
    return new Response('Network error while fetching video.', { status: 502 });
  }
}
