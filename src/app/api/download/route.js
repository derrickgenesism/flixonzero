import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('Missing url parameter', { status: 400 });
  }

  try {
    // Fetch the remote video stream
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch from external source: ${res.statusText}`);
    }

    // Extract a safe filename from the URL
    let filename = 'flixon_video.mp4';
    try {
      const urlParts = url.split('?')[0].split('/');
      const rawFilename = urlParts[urlParts.length - 1];
      if (rawFilename) {
        // Decode and strip invalid characters
        filename = decodeURIComponent(rawFilename).replace(/[^a-zA-Z0-9.-_ ]/g, '_');
      }
    } catch (e) {
      console.warn('Could not parse filename, using default.');
    }

    // Create response headers
    const headers = new Headers();
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Forward Content-Type and Content-Length if available so the browser shows progress
    if (res.headers.get('content-type')) {
      headers.set('Content-Type', res.headers.get('content-type'));
    } else {
      headers.set('Content-Type', 'application/octet-stream');
    }
    
    if (res.headers.get('content-length')) {
      headers.set('Content-Length', res.headers.get('content-length'));
    }

    // Stream the body directly to the client
    return new NextResponse(res.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download Proxy Error:', error);
    return new Response('Error proxying download', { status: 500 });
  }
}
