'use server';

import { createClient } from '@/utils/supabase/server';

export async function liveSearchMovies(query) {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('movies')
    .select('id, title, thumbnail_url, type, description')
    .ilike('title', `%${query}%`)
    .limit(5);

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  return data || [];
}
