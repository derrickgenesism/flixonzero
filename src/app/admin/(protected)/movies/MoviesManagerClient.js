'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';

const PAGE_SIZE = 50;
import Link from 'next/link';

const TYPE_LABELS = {
  video: { label: 'Premium', color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  genesis_free_movie: { label: 'Free', color: '#46b450', bg: 'rgba(70,180,80,0.12)' },
  gsm_series: { label: 'Series', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

export default function MoviesManagerClient({ initialMovies }) {
  const supabase = createClient();
  const [movies, setMovies] = useState(initialMovies);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isDeleting, setIsDeleting] = useState(null);

  const filtered = useMemo(() => {
    setVisibleCount(PAGE_SIZE); // reset when filter changes
    return movies.filter(m => {
      const matchSearch = m.title?.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || m.type === filterType;
      return matchSearch && matchType;
    });
  }, [movies, search, filterType]);

  const visible = filtered.slice(0, visibleCount);

  const handleDelete = async (movie) => {
    if (!window.confirm(`Are you sure you want to delete "${movie.title}"? This cannot be undone.`)) return;
    
    setIsDeleting(movie.id);
    
    try {
      const { error } = await supabase.from('movies').delete().eq('id', movie.id);
      if (error) throw error;
      
      setMovies(prev => prev.filter(m => m.id !== movie.id));
    } catch (err) {
      alert('Failed to delete movie: ' + err.message);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', margin: 0 }}>📽️ Published Movies</h1>
          <p style={{ color: 'var(--text2)', margin: '6px 0 0', fontSize: '14px' }}>
            {movies.length} movie{movies.length !== 1 ? 's' : ''} total
          </p>
        </div>
        <Link href="/admin/movies/add" style={{
          background: 'var(--acc)', color: '#fff', padding: '10px 20px',
          borderRadius: '8px', fontWeight: '700', fontSize: '14px', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          + Add New Movie
        </Link>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 280px' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search movies..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '11px 14px 11px 40px',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              color: '#fff', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          style={{
            padding: '11px 16px', background: 'var(--bg2)', border: '1px solid var(--border)',
            color: '#fff', borderRadius: '8px', fontSize: '14px', outline: 'none', cursor: 'pointer'
          }}
        >
          <option value="all">All Types</option>
          <option value="video">Premium</option>
          <option value="genesis_free_movie">Free</option>
          <option value="gsm_series">Series</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎬</div>
            <div style={{ fontSize: '16px', fontWeight: '600' }}>No movies found</div>
            <div style={{ fontSize: '13px', marginTop: '6px', color: 'var(--text3)' }}>Try adjusting your search or filter</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Movie</th>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Year</th>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Type</th>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Genres</th>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((movie, i) => {
                const typeInfo = TYPE_LABELS[movie.type] || { label: movie.type, color: '#aaa', bg: 'rgba(170,170,170,0.1)' };
                return (
                  <tr
                    key={movie.id}
                    style={{
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                      transition: 'background 0.15s',
                      opacity: isDeleting === movie.id ? 0.5 : 1,
                      pointerEvents: isDeleting === movie.id ? 'none' : 'auto'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* Thumbnail + Title */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                          width: '48px', height: '68px', borderRadius: '6px', overflow: 'hidden',
                          background: '#111', flexShrink: 0, border: '1px solid var(--border)'
                        }}>
                          {movie.thumbnail_url ? (
                            <img
                              src={movie.thumbnail_url}
                              alt={movie.title}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎬</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff', lineHeight: 1.3 }}>{movie.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '3px' }}>ID: {movie.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Year */}
                    <td style={{ padding: '14px 20px', color: 'var(--text2)', fontSize: '14px' }}>
                      {movie.release_year || '—'}
                    </td>

                    {/* Type Badge */}
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        background: typeInfo.bg, color: typeInfo.color,
                        border: `1px solid ${typeInfo.color}33`,
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap'
                      }}>
                        {typeInfo.label}
                      </span>
                    </td>

                    {/* Genres */}
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '200px' }}>
                        {(movie.categories || []).slice(0, 3).map(cat => (
                          <span key={cat} style={{
                            background: 'rgba(255,255,255,0.07)', color: 'var(--text2)',
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px'
                          }}>
                            {cat}
                          </span>
                        ))}
                        {(movie.categories || []).length > 3 && (
                          <span style={{ color: 'var(--text3)', fontSize: '11px', alignSelf: 'center' }}>+{movie.categories.length - 3}</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/admin/movies/${movie.id}/edit`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(255,255,255,0.07)', color: '#fff',
                            border: '1px solid var(--border)',
                            padding: '7px 14px', borderRadius: '6px',
                            fontSize: '13px', fontWeight: '600', textDecoration: 'none',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--acc)'; e.currentTarget.style.borderColor = 'var(--acc)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                        >
                          ✏️ Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(movie)}
                          disabled={isDeleting === movie.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            background: 'rgba(255,59,48,0.1)', color: '#ff3b30',
                            border: '1px solid rgba(255,59,48,0.3)',
                            padding: '7px 14px', borderRadius: '6px',
                            fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#ff3b30'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,59,48,0.1)'; e.currentTarget.style.color = '#ff3b30'; }}
                        >
                          {isDeleting === movie.id ? 'Deleting...' : '🗑️ Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Load More */}
      {visibleCount < filtered.length && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            style={{
              padding: '12px 32px', background: 'var(--bg2)',
              border: '1px solid var(--border)', color: '#fff',
              borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.color = 'var(--acc)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#fff'; }}
          >
            Load More ({Math.min(PAGE_SIZE, filtered.length - visibleCount)} more)
          </button>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '10px' }}>
            Showing {visibleCount} of {filtered.length} movies
          </p>
        </div>
      )}

      {visibleCount >= filtered.length && filtered.length > 0 && (
        <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '12px', textAlign: 'right' }}>
          All {filtered.length} movies shown
        </p>
      )}
    </div>
  );
}
