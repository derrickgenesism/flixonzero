'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchTMDBSuggestions, fetchTMDBSeriesDetails, createSeries } from '../actions';

export default function AddSeriesClient({ tmdbApiKey }) {
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [selectedSeries, setSelectedSeries] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail_url: '',
    backdrop_url: '',
    release_year: '',
    categories: [],
    status: 'ongoing'
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Debounced TMDB Search for TV Shows
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2 && !selectedSeries) {
        setIsSearching(true);
        const data = await fetchTMDBSuggestions(searchQuery, tmdbApiKey);
        setSuggestions(data);
        setIsSearching(false);
      } else {
        setSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, tmdbApiKey, selectedSeries]);

  async function handleSelectSuggestion(tmdbSeries) {
    setSearchQuery(tmdbSeries.name || tmdbSeries.title);
    setSuggestions([]);
    setSelectedSeries(tmdbSeries.id);
    
    // Fetch full details
    const details = await fetchTMDBSeriesDetails(tmdbSeries.id, tmdbApiKey);
    
    if (details) {
      const year = details.first_air_date ? details.first_air_date.split('-')[0] : '';
      const genres = details.genres?.map(g => g.name) || [];
      const isEnded = details.status === 'Ended' || details.status === 'Canceled';
      
      setFormData({
        title: details.name || tmdbSeries.name,
        description: details.overview || tmdbSeries.overview,
        thumbnail_url: tmdbSeries.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbSeries.poster_path}` : '',
        backdrop_url: tmdbSeries.backdrop_path ? `https://image.tmdb.org/t/p/original${tmdbSeries.backdrop_path}` : '',
        release_year: year,
        categories: genres,
        status: isEnded ? 'completed' : 'ongoing'
      });
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) {
      setError("Please provide a title.");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    const formDataObj = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'categories') {
        formDataObj.append(key, value.join(', '));
      } else {
        formDataObj.append(key, value);
      }
    });

    const res = await createSeries(formDataObj);
    
    if (res?.error) {
      setError(res.error);
      setSaving(false);
    } else {
      router.push(`/admin/series/${res.id}`);
    }
  };

  const handleManualEdit = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
      
      {/* LEFT COLUMN: Smart Search */}
      <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--acc)' }}>Smart Search (TMDB TV Shows)</h2>
          
          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text2)' }}>Search TV Show</label>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedSeries(null);
              }}
              placeholder="e.g. Breaking Bad"
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
                      <div style={{ fontWeight: 'bold' }}>{s.name || s.title}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text2)' }}>{s.first_air_date?.substring(0, 4)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', padding: '15px', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <button 
          onClick={handleSubmit}
          disabled={saving || !formData.title}
          className="gms-btn gms-btn--primary" 
          style={{ padding: '16px', fontSize: '18px', width: '100%', opacity: (!formData.title) ? 0.5 : 1 }}
        >
          {saving ? 'Creating Series...' : 'Create Series'}
        </button>

      </div>

      {/* RIGHT COLUMN: Preview & Manual Overrides */}
      <div style={{ flex: '2 1 500px', background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#fff' }}>Series Details Preview</h2>
        
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
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Release Year</label>
                <input type="text" value={formData.release_year} onChange={e => handleManualEdit('release_year', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '5px' }}>Status</label>
                <select value={formData.status} onChange={e => handleManualEdit('status', e.target.value)} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
