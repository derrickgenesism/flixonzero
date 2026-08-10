'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { liveSearchMovies } from '@/app/actions/search';
import { cleanCategories } from '@/utils/categories';

export default function SearchInput() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length >= 2) {
        const results = await liveSearchMovies(query);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    };
    const id = setTimeout(fetchSuggestions, 280);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e?.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') { setIsOpen(false); inputRef.current?.blur(); }
  };

  const handleSuggestionClick = (title) => {
    router.push(`/search?q=${encodeURIComponent(title)}`);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="flx-search-wrap" ref={wrapperRef}>
      <form onSubmit={handleSearch} className="flx-search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text3)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search movies, series..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); setSuggestions([]); setIsOpen(false); }}
            style={{ color: 'var(--text3)', padding: 0, lineHeight: 0, flexShrink: 0 }}
            aria-label="Clear search"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </form>

      {isOpen && (
        <div className="flx-search-dropdown">
          {suggestions.map(movie => (
            <div
              key={movie.id}
              className="flx-search-result"
              onClick={() => handleSuggestionClick(movie.title)}
            >
              <img src={movie.thumbnail_url || 'https://via.placeholder.com/36x54'} alt={movie.title} />
              <div className="flx-search-result-info">
                <div className="flx-search-result-title">{movie.title}</div>
                <div className="flx-search-result-meta">
                  {(() => {
                    const clean = cleanCategories(movie.categories);
                    if (clean.length > 0) return clean.slice(0, 2).join(' · ');
                    return movie.type === 'genesis_free_movie' ? 'Free Movie' : movie.type === 'gsm_series' ? 'Series' : 'Premium Movie';
                  })()}
                </div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
          <div className="flx-search-footer" onClick={handleSearch}>
            See all results for "{query}" →
          </div>
        </div>
      )}
    </div>
  );
}
