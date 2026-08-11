import { searchMoviesPage } from '@/app/actions/fetchMovies';
import Navbar from '@/components/Navbar';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import SearchInput from '@/components/SearchInput';

export const metadata = { title: 'Search — Flixon' };

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || '';

  let movies = [];
  let totalCount = 0;
  if (query) {
    const res = await searchMoviesPage(query, 0, 24);
    movies = res.movies;
    totalCount = res.total;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      
      <div style={{ paddingTop: '100px', maxWidth: '1200px', margin: '0 auto', padding: '100px 20px 60px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
          {query ? `Search results for "${query}"` : 'Search Flixon'}
        </h1>
        {query && (
          <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>
            {movies.length} {movies.length === 1 ? 'result' : 'results'} found
          </p>
        )}

        {!query ? (
          <div style={{ padding: '40px 20px 80px', textAlign: 'center', color: 'var(--text3)' }}>
            <svg style={{ margin: '0 auto 16px', display: 'block', color: 'var(--text3)' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <h2 style={{ color: '#fff', marginBottom: '8px', fontSize: '24px' }}>Find your next favorite</h2>
            <p style={{ marginBottom: '24px' }}>Search for movies, series, or actors.</p>
            
            <div style={{ maxWidth: '500px', margin: '0 auto', textAlign: 'left' }}>
              <SearchInput />
            </div>
          </div>
        ) : movies.length > 0 ? (
          <PaginatedMovieGrid 
            initialMovies={movies} 
            totalCount={totalCount} 
            fetchAction={searchMoviesPage} 
            actionArg={query} 
          />
        ) : (
          <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text3)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤔</div>
            <h2 style={{ color: '#fff', marginBottom: '8px', fontSize: '24px' }}>No matches found</h2>
            <p>Try searching for a different title or keyword.</p>
          </div>
        )}
      </div>
    </div>
  );
}
