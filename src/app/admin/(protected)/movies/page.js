import { createClient } from '@/utils/supabase/server';
import MoviesManagerClient from './MoviesManagerClient';

export const metadata = { title: 'Manage Movies — Admin' };

export default async function ManageMoviesPage() {
  const supabase = await createClient();
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title, thumbnail_url, type, categories, release_year, created_at')
    .order('created_at', { ascending: false })
    .limit(10000); // Fetch all — client handles pagination

  return <MoviesManagerClient initialMovies={movies || []} />;
}
