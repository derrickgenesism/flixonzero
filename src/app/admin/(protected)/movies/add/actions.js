'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function fetchTMDbApiKey() {
  const supabase = await createClient();
  const { data } = await supabase.from('admin_settings').select('setting_value').eq('setting_key', 'tmdb_api_key').single();
  return data?.setting_value || null;
}

export async function fetchTMDBMovieDetails(movieId, apiKey) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=credits`);
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("TMDB Fetch Error:", error);
    return null;
  }
}

export async function insertMovie(movieData) {
  const supabase = await createClient();
  
  // Ensure user is authorized
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
    return { error: 'Not authorized to add movies' };
  }

  // Generate categories randomly if none provided (or let admin select, for now hardcode generic if empty)
  let categories = movieData.categories;
  if (!categories || categories.length === 0) {
    categories = ['Action', 'Drama']; // Fallback
  }

  const { data, error } = await supabase.from('movies').insert({
    title: movieData.title,
    description: movieData.description,
    type: movieData.type || 'video',
    thumbnail_url: movieData.thumbnail_url,
    video_url: movieData.video_url || null,
    categories: categories,
    release_year: movieData.release_year,
    actors: movieData.actors
  }).select();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/');
  revalidatePath('/admin/movies/cloudflare-import');
  return { success: true, movie: data[0] };
}
