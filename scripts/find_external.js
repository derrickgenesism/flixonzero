const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findExternal() {
  const { data, error } = await supabase
    .from('movies')
    .select('id, title, video_url, type, thumbnail_url, categories, release_year');

  if (error) {
    console.error('Error fetching movies:', error);
    return;
  }

  const external = data.filter(m => {
    const url = m.video_url || '';
    // If it's empty or from pearlpix or other third-party servers
    if (!url) return true;
    return !url.includes('cdn.flixon.net') &&
           !url.includes('r2.cloudflarestorage.com') &&
           !url.includes('backblazeb2.com') &&
           !url.includes('r2.dev');
  });

  console.log(`\n========================================`);
  console.log(`TOTAL EXTERNAL / BROKEN MOVIES: ${external.length}`);
  console.log(`========================================\n`);

  external.forEach((m, idx) => {
    let cleanUrl = m.video_url || 'NO_URL';
    const srcMatch = cleanUrl.match(/src=["']([^"']+)["']/);
    if (srcMatch) cleanUrl = srcMatch[1];
    console.log(`${idx + 1}. [ID: ${m.id}] ${m.title}`);
    console.log(`   URL: ${cleanUrl}\n`);
  });
}

findExternal();
