import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { reconcileRecentPending } from '@/lib/payments';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { movieId } = await request.json().catch(() => ({}));

    if (!movieId) {
      return NextResponse.json({ error: 'Missing movieId' }, { status: 400 });
    }

    const supabase = await createClient();
    const admin = createAdminClient();

    // 1. Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to stream this video.' }, { status: 401 });
    }

    // 2. Fetch the movie
    const { data: movie, error } = await admin
      .from('movies')
      .select('id, type, video_url, categories')
      .eq('id', movieId)
      .maybeSingle();

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
      return NextResponse.json({ error: 'No video stream available for this title.' }, { status: 404 });
    }

    // 4. Check user status & frozen accounts
    const { data: userProfile } = await admin
      .from('user_profiles')
      .select('subscription_end_date, role')
      .eq('email', user.email)
      .maybeSingle();

    if (userProfile?.role === 'banned') {
      return NextResponse.json({ error: 'Your account has been restricted. Please contact Support.' }, { status: 403 });
    }

    // 5. Check global free mode and free movie types
    const { data: settingsData } = await admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'free_mode_enabled')
      .maybeSingle();

    const globalFreeMode = settingsData?.setting_value === 'true';
    const isFreeMovie =
      movie.type === 'genesis_free_movie' ||
      (movie.categories &&
        (Array.isArray(movie.categories)
          ? movie.categories.includes('Free to Watch')
          : typeof movie.categories === 'string' && movie.categories.includes('Free to Watch')));

    if (!isFreeMovie && !globalFreeMode) {
      let hasActiveSub = userProfile?.subscription_end_date && new Date(userProfile.subscription_end_date) > new Date();

      // Self-heal: Check if a payment just landed but webhook lagged
      if (!hasActiveSub) {
        const healed = await reconcileRecentPending(user.id);
        if (healed) {
          hasActiveSub = true;
        }
      }

      // Check PPV single purchase
      let hasPpv = false;
      if (!hasActiveSub) {
        const { data: ppv } = await admin
          .from('ppv_purchases')
          .select('expires_at')
          .eq('user_id', user.id)
          .eq('movie_id', movie.id)
          .eq('status', 'success')
          .maybeSingle();

        hasPpv = ppv?.expires_at && new Date(ppv.expires_at) > new Date();
      }

      if (!hasActiveSub && !hasPpv) {
        return NextResponse.json(
          { error: 'Subscription or Pay-Per-View pass required to stream this title.' },
          { status: 403 }
        );
      }
    }

    // Return the authorized stream URL directly
    return NextResponse.json(
      { token: realUrl },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    console.error('[/api/video/token] Error:', err);
    return NextResponse.json({ error: 'Internal server error loading stream.' }, { status: 500 });
  }
}
