'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateMovie(id, movieData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase.from('movies').update({
    title: movieData.title,
    description: movieData.description,
    type: movieData.type,
    thumbnail_url: movieData.thumbnail_url,
    backdrop_url: movieData.backdrop_url,
    video_url: movieData.video_url,
    categories: movieData.categories,
    release_year: movieData.release_year ? Number(movieData.release_year) : null,
    actors: movieData.actors,
    director: movieData.director || null,
    runtime: movieData.runtime ? Number(movieData.runtime) : null,
    imdb_rating: movieData.imdb_rating ? Number(movieData.imdb_rating) : null,
    trailer_url: movieData.trailer_url || null,
    is_coming_soon: movieData.is_coming_soon || false,
  }).eq('id', id);

  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/admin/movies');
  revalidatePath(`/admin/movies/${id}/edit`);
  return { success: true };
}

export async function deleteMovie(id) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator') {
    return { error: 'Only administrators can delete movies' };
  }

  const { error } = await supabase.from('movies').delete().eq('id', id);
  if (error) return { error: error.message };

  revalidatePath('/');
  revalidatePath('/admin/movies');
  return { success: true };
}
