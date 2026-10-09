const { createAdminClient } = require('@/utils/supabase/admin');
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
      .select('id, type, video_url, categories')
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

    // 4. Check if it's free
    const { data: settingsData } = await createAdminClient().from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'free_mode_enabled')
      .maybeSingle();
    const globalFreeMode = settingsData?.setting_value === 'true';
    const isFreeMovie = movie.type === 'genesis_free_movie' || (movie.categories && (Array.isArray(movie.categories) ? movie.categories.includes('Free to Watch') : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));

    // If neither is true, check subscription
    if (!isFreeMovie && !globalFreeMode) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_end_date')
        .eq('email', user.email)
        .single();

      const hasActiveSub = profile?.subscription_end_date &&
        new Date(profile.subscription_end_date) > new Date();

      // Also check PPV access just in case
      const { data: ppv } = await supabase
        .from('ppv_purchases')
        .select('expires_at')
        .eq('user_id', user.id)
        .eq('movie_id', movie.id)
        .maybeSingle();
      
      const hasPpv = ppv?.expires_at && new Date(ppv.expires_at) > new Date();

      if (!hasActiveSub && !hasPpv) {
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
