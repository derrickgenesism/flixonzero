/**
 * POST /api/video/download
 *
 * Self-contained download endpoint. Takes a movieId, verifies auth and
 * subscription directly, then generates a cryptographically signed, short-lived
 * CDN download URL (valid for 30 minutes) with force-download trigger.
 *
 * The file is served direct from Backblaze B2 via Cloudflare CDN ($0 Egress Bandwidth Alliance).
 * Raw links are hidden behind HMAC SHA-256 tokens and expire automatically.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generateSignedCdnUrl } from '@/lib/cdnSigner';

export async function POST(request) {
  try {
    const body = await request.json();
    const movieId = body.movieId;
    const title = body.title;

    if (!movieId && !body.token) {
      return NextResponse.json({ error: 'Missing movieId. Please refresh the page and try again.' }, { status: 400 });
    }

    const supabase = await createClient();
    let videoUrl = null;
    let movie = null;

    // 1. Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the movie
    if (movieId) {
      const { data: m, error: movieError } = await supabase
        .from('movies')
        .select('id, type, video_url, title')
        .eq('id', movieId)
        .single();

      if (movieError || !m) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }
      movie = m;

      // 3. Verify subscription / PPV access
      if (movie.type !== 'genesis_free_movie') {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_end_date')
          .eq('email', user.email)
          .single();

        const hasActiveSub = profile?.subscription_end_date &&
          new Date(profile.subscription_end_date) > new Date();

        if (!hasActiveSub) {
          const { data: ppvData } = await supabase
            .from('ppv_purchases')
            .select('expires_at')
            .eq('user_id', user.id)
            .eq('movie_id', movie.id)
            .eq('status', 'success')
            .maybeSingle();

          const hasPpv = ppvData?.expires_at && new Date(ppvData.expires_at) > new Date();
          if (!hasPpv) {
            return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
          }
        }
      }

      videoUrl = movie.video_url;
      if (videoUrl && (videoUrl.includes('<video') || videoUrl.includes('<source'))) {
        const match = videoUrl.match(/src=["']([^"']+)['"]/);
        if (match?.[1]) videoUrl = match[1];
      }
    } else if (body.token) {
      return NextResponse.json({ error: 'System updated. Please refresh the page to download.' }, { status: 400 });
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video available for download' }, { status: 404 });
    }

    // 4. Extract video key/path
    let objectKey = null;
    let isExternal = false;

    try {
      if (videoUrl.startsWith('/')) {
        objectKey = videoUrl.replace(/^\//, '');
      } else {
        const parsed = new URL(videoUrl);
        const host = parsed.hostname.toLowerCase();

        if (host.includes('cdn.flixon.net') || host.includes('r2.cloudflarestorage.com') || host.includes('backblazeb2.com') || host.includes('r2.dev')) {
          let path = parsed.pathname.replace(/^\//, '');
          // If path starts with bucket name like movies/ or flixonvideos/, strip it
          if (path.startsWith('movies/')) path = path.replace(/^movies\//, '');
          if (path.startsWith('flixonvideos/')) path = path.replace(/^flixonvideos\//, '');
          if (path.startsWith('file/flixonvideos/')) path = path.replace(/^file\/flixonvideos\//, '');
          objectKey = path;
        } else {
          isExternal = true;
        }
      }

      // Fully decode URI iteratively to resolve any %2520 or encoded characters
      if (objectKey) {
        let decodedKey = objectKey;
        while (decodedKey.includes('%')) {
          const next = decodeURIComponent(decodedKey);
          if (next === decodedKey) break;
          decodedKey = next;
        }
        objectKey = decodedKey;
      }
    } catch {
      isExternal = true;
    }

    // If external non-CDN link, return fallback direct download
    if (isExternal || !objectKey) {
      let downloadUrl = videoUrl;
      try {
        const u = new URL(videoUrl);
        u.searchParams.set('response-content-disposition', 'attachment');
        downloadUrl = u.toString();
      } catch {}
      return NextResponse.json({ downloadUrl });
    }

    // 5. Generate secure, cryptographically signed CDN download URL (30-min expiration)
    // Real raw links are protected and cannot be scraped or shared without the token
    const downloadUrl = generateSignedCdnUrl(objectKey, 1800, true);

    return NextResponse.json({ downloadUrl });

  } catch (err) {
    console.error('[/api/video/download] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
