const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function quarantineBrokenMovies() {
  console.log('Fetching all movies to identify broken/external links...');
  const { data: movies, error } = await supabase
    .from('movies')
    .select('id, title, video_url, type');

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  const toQuarantine = movies.filter(m => {
    const url = m.video_url || '';
    if (!url.trim()) return true;
    return !url.includes('cdn.flixon.net') &&
           !url.includes('r2.cloudflarestorage.com') &&
           !url.includes('backblazeb2.com') &&
           !url.includes('r2.dev');
  });

  console.log(`Found ${toQuarantine.length} movies to quarantine.`);

  let updatedCount = 0;
  for (const m of toQuarantine) {
    const { error: updateErr } = await supabase
      .from('movies')
      .update({ type: 'broken_quarantine' })
      .eq('id', m.id);

    if (updateErr) {
      console.error(`Failed to quarantine ID ${m.id} (${m.title}):`, updateErr);
    } else {
      updatedCount++;
      console.log(`✔ [${updatedCount}/${toQuarantine.length}] Quarantined: [ID ${m.id}] ${m.title}`);
    }
  }

  console.log(`\n🎉 Success! Successfully quarantined ${updatedCount} broken/external movies.`);
}

quarantineBrokenMovies();
