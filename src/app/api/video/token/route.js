import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');

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

    // 2. Fetch the movie
    const { data: movie, error } = await supabase
      .from('movies')
      .select('id, type, video_url, categories')
      .eq('id', movieId)
      .single();

    if (error || !movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // 3. Extract real URL
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

    // 4. Check access rights
    const { data: settingsData } = await _injectedAdminClient().from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'free_mode_enabled')
      .maybeSingle();
    const globalFreeMode = settingsData?.setting_value === 'true';
    const isFreeMovie = movie.type === 'genesis_free_movie' || (movie.categories && (Array.isArray(movie.categories) ? movie.categories.includes('Free to Watch') : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));

    if (!isFreeMovie && !globalFreeMode) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_end_date')
        .eq('email', user.email)
        .single();

      const hasActiveSub = profile?.subscription_end_date && new Date(profile.subscription_end_date) > new Date();

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

    // Return the URL directly to the player so HTML5 Range Seeking works properly without 302 Redirect bugs
    return NextResponse.json({ token: realUrl });
  } catch (err) {
    console.error('[/api/video/token] Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
