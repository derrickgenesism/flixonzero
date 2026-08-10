import Navbar from '@/components/Navbar';
import MoviesCatalog from './MoviesCatalog';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Movies — Flixon',
  description: 'Browse all movies and series on Flixon',
};

export default async function MoviesPage() {
  const supabase = await createClient();
  
  // Fetch all movies initially to pass to the client component
  // The client component will handle sorting and filtering
  const { data: movies, error } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching movies for catalog:', error);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '1200px', margin: '0 auto', padding: '100px 24px 60px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '24px' }}>Browse Movies</h1>
        <MoviesCatalog initialMovies={movies || []} />
      </main>
    </div>
  );
}
