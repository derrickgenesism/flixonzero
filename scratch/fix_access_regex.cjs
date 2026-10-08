const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /let hasAccess = false;[\s\S]*?hasPpvAccess = true;\s*hasAccess = true;\s*\}\s*\}/;

const newLogic = `let hasAccess = false;
  let canDownload = false;
  let isPremiumUser = false;
  let isFavorite = false;
  let hasPpvAccess = false;
  let userRating = 0;

  const settings = await getCachedSettings();
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
    hasAccess = isPremiumUser || movie.type === 'genesis_free_movie' || (movie.categories && movie.categories.includes('Free to Watch')) || globalFreeMode;
  }`;

if (content.match(regex)) {
  content = content.replace(regex, newLogic);
  
  // Also remove the duplicate settings fetch lower down
  content = content.replace(`  const settings = await getCachedSettings();\n  const ppvSetting = settings.find(s => s.setting_key === 'ppv_price');`, `  const ppvSetting = settings.find(s => s.setting_key === 'ppv_price');`);
  
  fs.writeFileSync(file, content);
  console.log('REGEX WORKED');
} else {
  console.log('REGEX DID NOT MATCH');
}
