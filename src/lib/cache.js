import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Create a generic unauthenticated client for cached public data
const getAnonClient = () => createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export const getCachedMovies = unstable_cache(
  async () => {
    const { data } = await getAnonClient().from('movies').select('*').order('created_at', { ascending: false });
    return data || [];
  },
  ['all-movies'],
  { revalidate: 3600 }
);

export const getCachedSettings = unstable_cache(
  async () => {
    const { data } = await getAnonClient().from('admin_settings').select('*');
    return data || [];
  },
  ['admin-settings'],
  { revalidate: 3600 }
);

export const getCachedSeries = unstable_cache(
  async () => {
    const { data } = await getAnonClient().from('series').select('*').order('created_at', { ascending: false });
    return data || [];
  },
  ['all-series'],
  { revalidate: 3600 }
);

export const getCachedMovieById = async (id) => {
  const cachedFn = unstable_cache(
    async () => {
      const { data } = await getAnonClient().from('movies').select('*').eq('id', id).single();
      return data || null;
    },
    ['movie-by-id', String(id)],
    { revalidate: 3600 }
  );
  return cachedFn();
};
