'use server';

import { createClient } from '@/utils/supabase/server';

const PAGE_SIZE = 24;

export async function fetchMoviesPage(category, page = 0, pageSize = PAGE_SIZE) {
  const supabase = await createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const startOf2026 = '2026-01-01T00:00:00.000Z';

  let query = supabase.from('movies').select('*', { count: 'exact' });

  if (!category || category === 'All') {
    query = query.order('created_at', { ascending: false });
  } else if (category === 'Trending' || category === 'New Arrivals' || category === 'Latest' || category.includes('Latest')) {
    // User requested Trending, Latest and New Arrivals to simply be the most recently added
    query = query.order('created_at', { ascending: false });
  } else if (category === 'Top Rated') {
    query = query.not('imdb_rating', 'is', null).order('imdb_rating', { ascending: false });
  } else if (category === 'Free') {
    query = query.eq('type', 'genesis_free_movie').order('created_at', { ascending: false });
  } else if (category === 'Premium Exclusives') {
    query = query.eq('type', 'video').order('created_at', { ascending: false });
  } else if (category === 'Popular Series') {
    query = query.eq('type', 'gsm_series').order('created_at', { ascending: false });
  } else {
    // Real genre/VJ category
    query = query.contains('categories', [category]).order('created_at', { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) {
    console.error('fetchMoviesPage error:', error.message);
    return { movies: [], total: 0 };
  }
  return { movies: data || [], total: count || 0 };
}

export async function searchMoviesPage(q, page = 0, pageSize = PAGE_SIZE) {
  const supabase = await createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('movies')
    .select('*', { count: 'exact' })
    .or(`title.ilike.%${q}%,actors.ilike.%${q}%`)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('searchMoviesPage error:', error.message);
    return { movies: [], total: 0 };
  }
  return { movies: data || [], total: count || 0 };
}

export async function fetchFavoritesPage(profileId, page = 0, pageSize = PAGE_SIZE) {
  const supabase = await createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('favorites')
    .select('movie_id, created_at, movies(*)', { count: 'exact' })
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.error('fetchFavoritesPage error:', error.message);
    return { movies: [], total: 0 };
  }
  
  const movies = (data || []).map(f => f.movies).filter(Boolean);
  return { movies, total: count || 0 };
}
