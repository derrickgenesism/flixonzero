const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BAD_CATEGORIES = new Set([
  'category', 'post_tag', 'uncategorized', 'Uncategorized',
  'post_format', 'nav_menu', 'link_category',
]);

async function run() {
  console.log('Fetching movies...');
  const { data: movies, error } = await supabase.from('movies').select('id, categories');
  
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log(`Found ${movies.length} movies.`);
  let updated = 0;
  
  for (const movie of movies) {
    if (!Array.isArray(movie.categories)) continue;
    
    const originalCats = movie.categories;
    const cleanCats = originalCats.filter(c => c && !BAD_CATEGORIES.has(c.trim().toLowerCase()) && c.trim() !== '');
    
    if (originalCats.length !== cleanCats.length) {
      console.log(`Updating ${movie.id} - removed junk categories`);
      await supabase.from('movies').update({ categories: cleanCats }).eq('id', movie.id);
      updated++;
    }
  }
  
  console.log(`Done! Updated ${updated} movies.`);
}

run();
