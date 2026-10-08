const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the hasAccess logic
const oldLogic = `  let hasAccess = false;
  let isFavorite = false;
  let hasPpvAccess = false;
  let userRating = 0;

  if (user) {
    if (movie.type === 'genesis_free_movie' || (movie.categories && movie.categories.includes('Free to Watch'))) {
      hasAccess = true;
    } else {
      const { data: profile } = await supabase.from('user_profiles').select('subscription_end_date').eq('email', user.email).single();
      if (profile?.subscription_end_date && new Date(profile.subscription_end_date) > new Date()) {
        hasAccess = true;
      }
    }

    // Check Pay-Per-View access
    if (!hasAccess) {
      const { data: ppvData } = await supabase
        .from('ppv_purchases')
        .select('expires_at')
        .eq('user_id', user.id)
        .eq('movie_id', movie.id)
        .eq('status', 'success')
        .maybeSingle();
      if (ppvData?.expires_at && new Date(ppvData.expires_at) > new Date()) {
        hasPpvAccess = true;
        hasAccess = true;
      }
    }`;

const newLogic = `  let hasAccess = false;
  let canDownload = false;
  let isPremiumUser = false;
  let isFavorite = false;
  let hasPpvAccess = false;
  let userRating = 0;

  const globalFreeMode = settings.find(s => s.setting_key === 'free_mode_enabled')?.setting_value === 'true';

  if (user) {
    const { data: profile } = await supabase.from('user_profiles').select('subscription_end_date').eq('email', user.email).single();
    if (profile?.subscription_end_date && new Date(profile.subscription_end_date) > new Date()) {
      isPremiumUser = true;
    }

    if (!isPremiumUser) {
      const { data: ppvData } = await supabase
        .from('ppv_purchases')
        .select('expires_at')
        .eq('user_id', user.id)
        .eq('movie_id', movie.id)
        .eq('status', 'success')
        .maybeSingle();
      if (ppvData?.expires_at && new Date(ppvData.expires_at) > new Date()) {
        hasPpvAccess = true;
        isPremiumUser = true;
      }
    }

    canDownload = isPremiumUser;
    hasAccess = isPremiumUser || movie.type === 'genesis_free_movie' || (movie.categories && movie.categories.includes('Free to Watch')) || globalFreeMode;`;

content = content.replace(oldLogic, newLogic);

// Add the banner above the player
const videoPaywallStr = `{/* Video / Paywall */}
      <div style={{ paddingTop: '68px', background: '#000' }}>`;
const bannerStr = `{/* Video / Paywall */}
      <div style={{ paddingTop: '68px', background: '#000' }}>
        {hasAccess && !isPremiumUser && (
          <div style={{ maxWidth: '1100px', margin: '20px auto 0', padding: '12px 20px', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '8px', textAlign: 'center', color: '#4ade80', fontSize: '14px' }}>
            <strong style={{ fontWeight: '800', marginRight: '6px' }}>?? Free Mode Active:</strong>
            You can watch for free! <Link href="/checkout" style={{ color: '#fff', textDecoration: 'underline', marginLeft: '4px' }}>Subscribe to unlock downloads.</Link>
          </div>
        )}`;

content = content.replace(videoPaywallStr, bannerStr);

// Update DownloadButton
const oldDL = `<DownloadButton movieId={movie.id} title={movie.title} />`;
const newDL = `<DownloadButton movieId={movie.id} title={movie.title} requiresSubscription={!canDownload} />`;
content = content.replace(oldDL, newDL);

fs.writeFileSync(file, content);
console.log('movie page updated');
