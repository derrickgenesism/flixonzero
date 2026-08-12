'use client';

import { useState } from 'react';
import MovieCard from './MovieCard';

export default function PaginatedMovieGrid({ 
  title, 
  initialMovies, 
  totalCount, 
  fetchAction, 
  actionArg // category string, search query, or profileId
}) {
  const [movies, setMovies] = useState(initialMovies || []);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const hasMore = movies.length < totalCount;

  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    
    try {
      const nextPage = page + 1;
      const { movies: newMovies } = await fetchAction(actionArg, nextPage);
      
      if (newMovies && newMovies.length > 0) {
        setMovies(prev => [...prev, ...newMovies]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Error loading more movies:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!movies || movies.length === 0) {
    return (
      <div className="gms-section gms-visible">
        {title && <h2 className="gms-section-title">{title}</h2>}
        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text2)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎬</div>
          <h2 style={{ fontSize: '22px', marginBottom: '12px', color: '#fff' }}>No movies found</h2>
          <p style={{ fontSize: '15px', color: 'var(--text3)' }}>We couldn&apos;t find any movies in this category.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gms-section gms-visible">
      {title && (
        <div className="gms-section-head">
          <h2 className="gms-section-title">{title}</h2>
          <span className="gms-view-more">{totalCount} Results</span>
        </div>
      )}
      
      <div className="gms-movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
        ))}
      </div>

      {hasMore && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <button 
            className="gms-btn gms-btn--primary" 
            onClick={handleLoadMore}
            disabled={loading}
            style={{ minWidth: '160px' }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
