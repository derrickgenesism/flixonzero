const fs = require('fs');
let file = 'src/app/api/video/token/route.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `.select('id, type, video_url')`,
  `.select('id, type, video_url, categories')`
);

const oldAuthCheck = `    // 4. Check subscription for premium content
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
    }`;

const newAuthCheck = `    // 4. Check if it's free
    const { data: settingsData } = await supabase
      .from('admin_settings')
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
    }`;

content = content.replace(oldAuthCheck, newAuthCheck);

fs.writeFileSync(file, content);
console.log('Fixed API video token authorization for Free to Watch movies');
