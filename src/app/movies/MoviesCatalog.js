'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import MovieCard from '@/components/MovieCard';

export default function MoviesCatalog({ initialMovies }) {
  const [sortBy, setSortBy] = useState('latest');
  const [vjFilter, setVjFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Extract unique VJs and Categories from the movie list
  const allVjs = useMemo(() => {
    const vjs = new Set();
    initialMovies.forEach(m => {
      if (m.categories) {
        m.categories.forEach(c => {
          if (c.toLowerCase().startsWith('vj ')) vjs.add(c);
        });
      }
    });
    return ['All', ...Array.from(vjs).sort()];
  }, [initialMovies]);

  const allCategories = useMemo(() => {
    const cats = new Set();
    initialMovies.forEach(m => {
      if (m.categories) {
        m.categories.forEach(c => {
          if (!c.toLowerCase().startsWith('vj ')) cats.add(c);
        });
      }
    });
    return ['All', ...Array.from(cats).sort()];
  }, [initialMovies]);

  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let result = [...initialMovies];

    if (vjFilter !== 'All') {
      result = result.filter(m => m.categories?.includes(vjFilter));
    }
    if (categoryFilter !== 'All') {
      result = result.filter(m => m.categories?.includes(categoryFilter));
    }

    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'most_watched':
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'top_rated':
        result.sort((a, b) => (b.imdb_rating || 0) - (a.imdb_rating || 0));
        break;
      case 'latest':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
    }

    return result;
  }, [initialMovies, sortBy, vjFilter, categoryFilter]);

  return (
    <div>
      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px', background: 'var(--bg2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Sort By</label>
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', background: '#000', color: '#fff', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer' }}
          >
            <option value="latest">Latest Uploads</option>
            <option value="oldest">Oldest First</option>
            <option value="most_watched">Most Watched</option>
            <option value="top_rated">Top Rated</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Category / Genre</label>
          <select 
            value={categoryFilter} 
            onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', background: '#000', color: '#fff', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer' }}
          >
            {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>VJ Translator</label>
          <select 
            value={vjFilter} 
            onChange={e => setVjFilter(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', background: '#000', color: '#fff', border: '1px solid var(--border)', outline: 'none', cursor: 'pointer' }}
          >
            {allVjs.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

      </div>

      <div style={{ color: 'var(--text3)', marginBottom: '20px', fontSize: '14px' }}>
        Showing {filteredMovies.length} movies
      </div>

      {/* Grid */}
      {filteredMovies.length > 0 ? (
        <div className="gms-movie-grid">
          {filteredMovies.map(m => (
            <MovieCard key={m.id} {...m} />
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>No movies found</h3>
          <p>Try adjusting your filters to find what you're looking for.</p>
        </div>
      )}
    </div>
  );
}
