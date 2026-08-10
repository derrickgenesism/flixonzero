import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import ManageSeriesClient from './ManageSeriesClient';
import { fetchTMDbApiKey } from '../../movies/add/actions';

export const metadata = { title: 'Manage Series — Flixon Admin' };

export default async function SeriesDetailsPage({ params }) {
  const { id } = await params;
  
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: series } = await supabase
    .from('series')
    .select('*')
    .eq('id', id)
    .single();

  if (!series) notFound();

  // Fetch all episodes belonging to this series
  const { data: episodes } = await supabase
    .from('movies')
    .select('id, title, season_number, episode_number, thumbnail_url, type')
    .eq('series_id', id)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });

  const tmdbApiKey = await fetchTMDbApiKey();

  return (
    <ManageSeriesClient 
      series={series} 
      initialEpisodes={episodes || []} 
      tmdbApiKey={tmdbApiKey} 
    />
  );
}
