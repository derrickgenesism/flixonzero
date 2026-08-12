'use client';

import { useState, useEffect } from 'react';
import { fetchTMDBMovieDetails, insertMovie } from './actions';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AddMovieClient({ tmdbApiKey }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('title') || '');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'video',
    thumbnail_url: '',
    backdrop_url: '',
    video_url: searchParams.get('video_url') || '',
    categories: [],
    release_year: '',
    actors: '',
    trailer_url: '',
    imdb_rating: '',
    director: '',
    runtime: '',
    is_coming_soon: false
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Debounced TMDB Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2 && !selectedMovie) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(searchQuery)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.results.slice(0, 5));
          }
        } catch (err) {
          console.error(err);
        }
        setIsSearching(false);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, tmdbApiKey, selectedMovie]);

  async function handleSelectSuggestion(tmdbMovie) {
    setSearchQuery(tmdbMovie.title);
    setSuggestions([]);
    setSelectedMovie(tmdbMovie.id);
    
    // Fetch full details including credits
    const details = await fetchTMDBMovieDetails(tmdbMovie.id, tmdbApiKey);
    
    if (details) {
      const cast = details.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || '';
      const year = details.release_date ? details.release_date.split('-')[0] : '';
      const genres = details.genres?.map(g => g.name) || [];
      const director = details.credits?.crew?.find(c => c.job === 'Director')?.name || '';
      
      setFormData({
        ...formData,
        title: details.title || tmdbMovie.title,
        description: details.overview || tmdbMovie.overview,
        thumbnail_url: tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : '',
        backdrop_url: tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbMovie.backdrop_path}` : '',
        release_year: year,
        actors: cast,
        categories: genres,
        director,
        runtime: details.runtime || '',
        imdb_rating: details.vote_average ? (details.vote_average / 2).toFixed(1) : ''
      });
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.video_url) {
      setError("Please provide a Cloudflare video URL.");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    const res = await insertMovie(formData);
    
    if (res?.error) {
      setError(res.error);
      setSaving(false);
    } else {
      alert("Movie added successfully!");
      router.push('/');
    }
  };

  const handleManualEdit = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      
      {/* LEFT COLUMN: Smart Search & Cloudflare Link */}
      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--acc)' }}>1. Smart Search (TMDB)</h2>
          
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text2)' }}>Search Movie Title</label>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedMovie(null);
              }}
              placeholder="e.g. Spider-Man No Way Home"
              style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px', fontSize: '16px' }}
            />
            {isSearching && <span style={{ position: 'absolute', right: '15px', top: '40px', fontSize: '12px', color: 'var(--text2)' }}>Searching...</span>}
            
            {suggestions.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#222', border: '1px solid #444', borderRadius: '6px', marginTop: '5px', zIndex: 10, overflow: 'hidden' }}>
                {suggestions.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => handleSelectSuggestion(s)}
                    style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #333', display: 'flex', gap: '15px', alignItems: 'center' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {s.poster_path && (
                      <img src={`https://image.tmdb.org/t/p/w92${s.poster_path}`} style={{ width: '30px', borderRadius: '4px' }} alt="" />
                    )}
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{s.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.release_date?.substring(0, 4)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--acc)' }}>2. Video Link (Cloudflare)</h2>
          <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text2)' }}>Direct Video URL</label>
          <input 
            type="url" 
            value={formData.video_url}
            onChange={(e) => handleManualEdit('video_url', e.target.value)}
            placeholder="https://customer-xxx.cloudflarestream.com/.../manifest/video.mp4"
            required
            style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        {/* Coming Soon toggle */}
        <div style={{ background: 'rgba(229,9,20,0.05)', border: '1px solid rgba(229,9,20,0.2)', borderRadius: '10px', padding: '16px', marginBottom: '0' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontSize: '15px', fontWeight: '600' }}>
            <input
              type="checkbox"
              checked={formData.is_coming_soon}
              onChange={e => handleManualEdit('is_coming_soon', e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--acc)' }}
            />
            Mark as "Coming Soon" (will not be watchable yet)
          </label>
        </div>

        {error && (
          <div style={{ background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', padding: '15px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || !selectedMovie}
          className="gms-btn gms-btn--primary"
          style={{ padding: '16px', fontSize: '18px', width: '100%', opacity: !selectedMovie ? 0.5 : 1 }}
        >
          {saving ? 'Publishing Movie...' : formData.is_coming_soon ? 'Save as Coming Soon' : 'Save & Publish Movie'}
        </button>

      </div>

      {/* RIGHT COLUMN: Preview & Manual Overrides */}
      <div style={{ flex: '2 1 500px', background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff' }}>Movie Details Preview</h2>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          {formData.thumbnail_url ? (
            <img src={formData.thumbnail_url} alt="Poster" style={{ width: '120px', borderRadius: '8px', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '120px', height: '180px', background: '#111', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>Poster</div>
          )}
          
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Title</label>
              <input type="text" value={formData.title} onChange={e => handleManualEdit('title', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Year</label>
                <input type="text" value={formData.release_year} onChange={e => handleManualEdit('release_year', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Movie Type</label>
                <select value={formData.type} onChange={e => handleManualEdit('type', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}>
                  <option value="video">Premium Movie</option>
                  <option value="genesis_free_movie">Free Movie</option>
                  <option value="gsm_series">Series Episode</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Cast / Actors</label>
            <input type="text" value={formData.actors} onChange={e => handleManualEdit('actors', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Director</label>
              <input type="text" value={formData.director} onChange={e => handleManualEdit('director', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Runtime (minutes)</label>
              <input type="number" value={formData.runtime} onChange={e => handleManualEdit('runtime', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>IMDb Rating (/5)</label>
              <input type="number" step="0.1" min="0" max="5" value={formData.imdb_rating} onChange={e => handleManualEdit('imdb_rating', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Trailer URL (YouTube)</label>
            <input type="url" value={formData.trailer_url} onChange={e => handleManualEdit('trailer_url', e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Description</label>
            <textarea value={formData.description} onChange={e => handleManualEdit('description', e.target.value)} rows="5" style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Genres (Comma separated)</label>
            <input
              type="text"
              value={formData.categories.join(', ')}
              onChange={e => handleManualEdit('categories', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>VJ (Translator)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark'].map(vj => {
                const isSelected = formData.categories.includes(vj);
                return (
                  <button
                    key={vj}
                    type="button"
                    onClick={() => {
                      let cats = [...formData.categories];
                      if (isSelected) {
                        cats = cats.filter(c => c !== vj);
                      } else {
                        cats.push(vj);
                      }
                      handleManualEdit('categories', cats);
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', border: '1px solid #444', 
                      background: isSelected ? 'var(--acc)' : '#222',
                      color: '#fff', cursor: 'pointer', fontSize: '12px'
                    }}
                  >
                    {vj}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
