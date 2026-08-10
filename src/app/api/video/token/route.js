/**
 * POST /api/video/token
 * 
 * Called from the movie page when user clicks play.
 * Verifies the user's session and subscription, then returns a short-lived token.
 * The real video URL is NEVER sent to the client.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createVideoToken } from '@/lib/videoTokens';

export async function POST(request) {
  try {
    const { movieId } = await request.json();

    if (!movieId) {
      return NextResponse.json({ error: 'Missing movieId' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the movie (only server-side)
    const { data: movie, error } = await supabase
      .from('movies')
      .select('id, type, video_url')
      .eq('id', movieId)
      .single();

    if (error || !movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // 3. Extract real URL from HTML if needed
    let realUrl = null;
    if (movie.video_url) {
      if (movie.video_url.includes('<video') || movie.video_url.includes('<source')) {
        const match = movie.video_url.match(/src=["']([^"']+)['"]/);
        if (match?.[1]) realUrl = match[1];
      } else {
        realUrl = movie.video_url;
      }
    }

    if (!realUrl) {
      return NextResponse.json({ error: 'No video available' }, { status: 404 });
    }

    // 4. Check subscription for premium content
    if (movie.type !== 'genesis_free_movie') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_end_date')
        .eq('email', user.email)
        .single();

      const hasActiveSub = profile?.subscription_end_date &&
        new Date(profile.subscription_end_date) > new Date();

      if (!hasActiveSub) {
        return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
      }
    }

    // 5. Issue a short-lived token
    const token = createVideoToken(realUrl, user.id);

    return NextResponse.json({ token, expiresIn: 7200 });
  } catch (err) {
    console.error('[/api/video/token] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
