'use client';

import { useState, useEffect, useRef } from 'react';

const VJ_OPTIONS = [
  'VJ Junior',
  'VJ Emmy',
  'VJ Jingo',
  'VJ Ice P',
  'VJ Mark',
  'VJ Kamil',
  'VJ Jovan',
  'English / Original (No VJ)',
  'Other VJ'
];

export default function MovieRequestModal({ isOpen, onClose, initialTitle = '', defaultEmail = '' }) {
  const [query, setQuery] = useState(initialTitle);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isManual, setIsManual] = useState(false);

  // Form states
  const [title, setTitle] = useState(initialTitle);
  const [year, setYear] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [mediaType, setMediaType] = useState('movie');
  const [vj, setVj] = useState('VJ Junior');
  const [otherVj, setOtherVj] = useState('');
  const [userEmail, setUserEmail] = useState(defaultEmail);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const debounceTimer = useRef(null);

  useEffect(() => {
    if (initialTitle) {
      setQuery(initialTitle);
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  useEffect(() => {
    if (defaultEmail && !userEmail) {
      setUserEmail(defaultEmail);
    }
  }, [defaultEmail, userEmail]);

  // Live TMDB title search
  useEffect(() => {
    if (isManual || selectedMovie) return;
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        setSuggestions(data.results || []);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer.current);
  }, [query, isManual, selectedMovie]);

  function handleSelectSuggestion(item) {
    setSelectedMovie(item);
    setTitle(item.title);
    setYear(item.year || '');
    setPosterUrl(item.poster_url || '');
    setMediaType(item.media_type || 'movie');
    setSuggestions([]);
  }

  function handleClearSelection() {
    setSelectedMovie(null);
    setTitle('');
    setYear('');
    setPosterUrl('');
    setQuery('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const finalTitle = title.trim();
    const finalVj = vj === 'Other VJ' ? otherVj.trim() : vj;

    if (!finalTitle) {
      setError('Please provide a title.');
      return;
    }
    if (!finalVj) {
      setError('Please choose your preferred VJ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/movie-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          year: year.trim(),
          poster_url: posterUrl.trim(),
          vj: finalVj,
          notes: notes.trim(),
          media_type: mediaType,
          user_email: userEmail.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit request. Please try again.');
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg2, #141414)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '24px 8px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>Request Submitted!</h2>
            <p style={{ color: 'var(--text2)', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
              We&apos;ve sent your request for <strong>&quot;{title}&quot; ({vj})</strong> directly to the admin and translation desk. We&apos;ll do our best to upload it promptly!
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                handleClearSelection();
                onClose();
              }}
              className="gms-btn gms-btn--primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(229,9,20,0.15)', color: 'var(--acc, #e50914)', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                <span>🎬</span> FlixOn Upload Desk
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px' }}>Request a Movie / Series</h2>
              <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0 }}>
                Can&apos;t find what you want to watch? Tell us the title and your favorite Ugandan VJ.
              </p>
            </div>

            {error && (
              <div style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.4)', borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* TMDB Search or Manual Input */}
              {!isManual ? (
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
                    Movie or Series Title
                  </label>

                  {selectedMovie ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.15)' }}>
                      {selectedMovie.poster_url && (
                        <img src={selectedMovie.poster_url} alt={selectedMovie.title} style={{ width: '40px', height: '58px', objectFit: 'cover', borderRadius: '6px' }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedMovie.title}
                        </div>
                        <div style={{ color: 'var(--text3)', fontSize: '12px' }}>
                          {selectedMovie.media_type === 'series' ? '📺 TV Series' : '🎬 Movie'} {selectedMovie.year ? `(${selectedMovie.year})` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        style={{ color: 'var(--text2)', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Start typing (e.g. Fast & Furious, Money Heist)..."
                        className="flx-form-input"
                        style={{ width: '100%', padding: '12px 14px', fontSize: '14px' }}
                      />
                      {isSearching && (
                        <div style={{ position: 'absolute', right: '12px', top: '38px', fontSize: '12px', color: 'var(--text3)' }}>
                          Searching...
                        </div>
                      )}

                      {/* Dropdown Suggestions */}
                      {suggestions.length > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: '#1a1a1a',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '10px',
                          marginTop: '6px',
                          maxHeight: '260px',
                          overflowY: 'auto',
                          zIndex: 50,
                          boxShadow: '0 12px 30px rgba(0,0,0,0.85)'
                        }}>
                          {suggestions.map((item) => (
                            <div
                              key={`${item.media_type}-${item.tmdb_id}`}
                              onClick={() => handleSelectSuggestion(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid rgba(255,255,255,0.05)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              {item.poster_url ? (
                                <img src={item.poster_url} alt={item.title} style={{ width: '32px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                              ) : (
                                <div style={{ width: '32px', height: '48px', background: '#333', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>🎬</div>
                              )}
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ color: '#fff', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {item.title}
                                </div>
                                <div style={{ color: 'var(--text3)', fontSize: '11px' }}>
                                  {item.media_type === 'series' ? '📺 TV Series' : '🎬 Movie'} {item.year ? `(${item.year})` : ''}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => { setIsManual(true); setSelectedMovie(null); }}
                      style={{ fontSize: '12px', color: 'var(--text3)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Not finding it? Type title manually
                    </button>
                  </div>
                </div>
              ) : (
                /* Manual Inputs */
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '10px', border: '1px dashed rgba(255,255,255,0.15)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--acc)' }}>Manual Input</span>
                    <button
                      type="button"
                      onClick={() => setIsManual(false)}
                      style={{ fontSize: '12px', color: 'var(--text2)', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
                    >
                      Use TMDB Search
                    </button>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#fff' }}>Title *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Inception or Money Heist Season 3"
                      className="flx-form-input"
                      style={{ width: '100%', padding: '10px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#fff' }}>Year</label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        placeholder="e.g. 2024"
                        className="flx-form-input"
                        style={{ width: '100%', padding: '10px' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px', color: '#fff' }}>Type</label>
                      <select
                        value={mediaType}
                        onChange={(e) => setMediaType(e.target.value)}
                        className="flx-form-input"
                        style={{ width: '100%', padding: '10px' }}
                      >
                        <option value="movie">Movie</option>
                        <option value="series">TV Series</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* VJ Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
                  Preferred VJ / Translation *
                </label>
                <select
                  value={vj}
                  onChange={(e) => setVj(e.target.value)}
                  className="flx-form-input"
                  style={{ width: '100%', padding: '12px 14px', fontSize: '14px' }}
                >
                  {VJ_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} style={{ background: '#1c1c1c', color: '#fff' }}>
                      {opt}
                    </option>
                  ))}
                </select>

                {vj === 'Other VJ' && (
                  <input
                    type="text"
                    required
                    value={otherVj}
                    onChange={(e) => setOtherVj(e.target.value)}
                    placeholder="Specify VJ name (e.g. VJ Dan, VJ Henrry)"
                    className="flx-form-input"
                    style={{ width: '100%', marginTop: '8px', padding: '10px' }}
                  />
                )}
              </div>

              {/* Email / Notification */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
                  Your Email (for notification when uploaded)
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="flx-form-input"
                  style={{ width: '100%', padding: '10px 14px' }}
                />
              </div>

              {/* Optional Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
                  Special Notes or Episode Requests
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={500}
                  placeholder="e.g. Please upload Season 2 in 1080p HD, or looking for specific episode..."
                  rows={3}
                  className="flx-form-input"
                  style={{ width: '100%', padding: '10px 14px', resize: 'none' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="gms-btn gms-btn--primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '800' }}
              >
                {loading ? 'Submitting Request...' : 'Submit Movie Request'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
