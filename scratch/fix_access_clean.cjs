const fs = require('fs');
let file = 'src/app/movie/[id]/page.js';
let content = fs.readFileSync(file, 'utf8');

const startAnchor = `  let hasAccess = false;
  let isFavorite = false;
  let hasPpvAccess = false;
  let userRating = 0;`;

const endAnchor = `        if (ppvData?.expires_at && new Date(ppvData.expires_at) > new Date()) {
          hasPpvAccess = true;
          hasAccess = true;
        }
      }
`;

const startIdx = content.indexOf(startAnchor);
const endIdx = content.indexOf(endAnchor) + endAnchor.length;

if (startIdx !== -1 && endIdx !== -1) {
  const newLogic = `  let hasAccess = false;
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
`;
  
  const newContent = content.substring(0, startIdx) + newLogic + content.substring(endIdx);
  fs.writeFileSync(file, newContent);
  console.log('SUCCESSFULLY REPLACED ACCESS LOGIC');
} else {
  console.log('NOT FOUND', startIdx, endIdx);
}
