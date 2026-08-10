'use server';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

function adminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

export async function createSeries(formData) {
  const supabase = adminClient();
  const title = formData.get('title');
  const description = formData.get('description');
  const thumbnail_url = formData.get('thumbnail_url');
  const backdrop_url = formData.get('backdrop_url');
  const release_year = formData.get('release_year') ? parseInt(formData.get('release_year')) : null;
  const status = formData.get('status') || 'ongoing';
  const categoriesRaw = formData.get('categories') || '';
  const categories = categoriesRaw.split(',').map(c => c.trim()).filter(Boolean);

  const { data, error } = await supabase
    .from('series')
    .insert({ title, description, thumbnail_url, backdrop_url, release_year, status, categories })
    .select('id')
    .single();

  if (error) return { error: error.message };
  revalidatePath('/admin/series');
  return { id: data.id };
}

export async function updateSeries(id, formData) {
  const supabase = adminClient();
  const title = formData.get('title');
  const description = formData.get('description');
  const thumbnail_url = formData.get('thumbnail_url');
  const backdrop_url = formData.get('backdrop_url');
  const release_year = formData.get('release_year') ? parseInt(formData.get('release_year')) : null;
  const status = formData.get('status') || 'ongoing';
  const categoriesRaw = formData.get('categories') || '';
  const categories = categoriesRaw.split(',').map(c => c.trim()).filter(Boolean);

  const { error } = await supabase
    .from('series')
    .update({ title, description, thumbnail_url, backdrop_url, release_year, status, categories })
    .eq('id', id);

  if (error) return { error: error.message };
  revalidatePath(`/admin/series/${id}`);
  revalidatePath('/admin/series');
  return { success: true };
}

export async function deleteSeries(id) {
  const supabase = adminClient();
  // Unlink episodes first
  await supabase.from('movies').update({ series_id: null, season_number: null, episode_number: null }).eq('series_id', id);
  const { error } = await supabase.from('series').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/admin/series');
  return { success: true };
}

export async function addEpisode(formData) {
  const supabase = adminClient();
  const series_id = parseInt(formData.get('series_id'));
  const season_number = parseInt(formData.get('season_number') || '1');
  const episode_number = parseInt(formData.get('episode_number') || '1');
  const title = formData.get('title');
  const description = formData.get('description') || '';
  const thumbnail_url = formData.get('thumbnail_url') || '';
  const video_url = formData.get('video_url');
  const type = formData.get('type') || 'gsm_series';

  const { error } = await supabase.from('movies').insert({
    title, description, thumbnail_url, video_url, type,
    series_id, season_number, episode_number,
    created_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  revalidatePath(`/admin/series/${series_id}`);
  revalidatePath('/series');
  return { success: true };
}

export async function removeEpisode(movieId, seriesId) {
  const supabase = adminClient();
  const { error } = await supabase
    .from('movies')
    .update({ series_id: null, season_number: null, episode_number: null })
    .eq('id', movieId);
  if (error) return { error: error.message };
  revalidatePath(`/admin/series/${seriesId}`);
  return { success: true };
}

export async function fetchTMDBSuggestions(query, apiKey) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/tv?api_key=${apiKey}&query=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results.slice(0, 5);
  } catch { return []; }
}

export async function fetchTMDBSeriesDetails(tmdbId, apiKey) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}&append_to_response=credits`);
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
