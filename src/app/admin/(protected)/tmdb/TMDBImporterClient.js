'use client'

import { useState } from 'react'
import { updateMovieWithTMDB } from './actions'

export default function TMDBImporterClient({ movies, apiKey }) {
  const [loadingId, setLoadingId] = useState(null)
  const [results, setResults] = useState({})
  const [query, setQuery] = useState('')
  const [customQueries, setCustomQueries] = useState({})

  async function searchTMDB(movieId, fallbackTitle) {
    const titleQuery = customQueries[movieId] || fallbackTitle
    setLoadingId(movieId)
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(titleQuery)}`)
      const data = await res.json()
      setResults(prev => ({ ...prev, [movieId]: data.results?.slice(0, 5) || [] }))
    } catch (err) {
      console.error(err)
      alert("Error searching TMDB. Ensure API key is correct.")
    }
    setLoadingId(null)
  }

  const TMDB_GENRES = {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Science Fiction",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western"
  }

  async function applyTMDBData(dbMovieId, tmdbMovie) {
    setLoadingId(`apply-${dbMovieId}`)
    
    const posterUrl = tmdbMovie.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}` : null
    const backdropUrl = tmdbMovie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}` : null
    
    if (!posterUrl) {
      alert("This TMDB result doesn't have a poster!")
      setLoadingId(null)
      return
    }

    // Map genre_ids to text
    const categories = (tmdbMovie.genre_ids || [])
      .map(id => TMDB_GENRES[id])
      .filter(Boolean)

    const res = await updateMovieWithTMDB({
      id: dbMovieId,
      title: tmdbMovie.title,
      description: tmdbMovie.overview,
      thumbnail_url: posterUrl,
      backdrop_url: backdropUrl,
      categories: categories
    })

    if (res?.error) {
      alert("Error: " + res.error)
    } else {
      // Clear results on success
      setResults(prev => ({ ...prev, [dbMovieId]: null }))
      alert("Movie updated successfully!")
    }
    setLoadingId(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {movies.map(movie => (
        <div key={movie.id} style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '10px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
          <img 
            src={movie.thumbnail_url || 'https://via.placeholder.com/150x225?text=No+Image'} 
            style={{ width: '100px', height: '150px', objectFit: 'cover', borderRadius: '6px' }}
            alt={movie.title} 
          />
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '20px', color: '#fff' }}>{movie.title}</h3>
            <p style={{ color: 'var(--text2)', fontSize: '14px', margin: '0 0 15px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {movie.description || 'No description yet.'}
            </p>
            
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Custom search query..." 
                value={customQueries[movie.id] !== undefined ? customQueries[movie.id] : movie.title}
                onChange={e => setCustomQueries(prev => ({ ...prev, [movie.id]: e.target.value }))}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  width: '300px',
                  fontSize: '14px'
                }}
              />
              <button 
                onClick={() => searchTMDB(movie.id, movie.title)}
                disabled={loadingId === movie.id}
                className="gms-btn gms-btn--primary"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                {loadingId === movie.id ? 'Searching...' : 'Search TMDB'}
              </button>
            </div>

            {/* Results */}
            {results[movie.id] && (
              <div style={{ marginTop: '20px', display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                {results[movie.id].length === 0 && <span style={{ color: 'var(--text2)' }}>No results found.</span>}
                {results[movie.id].map(tmdb => (
                  <div key={tmdb.id} style={{ width: '150px', flexShrink: 0, background: '#111', padding: '10px', borderRadius: '8px' }}>
                    <img 
                      src={tmdb.poster_path ? `https://image.tmdb.org/t/p/w200${tmdb.poster_path}` : 'https://via.placeholder.com/200x300'} 
                      style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }}
                      alt={tmdb.title}
                    />
                    <div style={{ fontSize: '12px', color: '#fff', marginBottom: '5px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tmdb.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text2)', marginBottom: '10px' }}>
                      {tmdb.release_date?.substring(0,4)}
                    </div>
                    <button 
                      onClick={() => applyTMDBData(movie.id, tmdb)}
                      disabled={loadingId === `apply-${movie.id}`}
                      className="gms-btn"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 12px', fontSize: '11px', width: '100%' }}
                    >
                      {loadingId === `apply-${movie.id}` ? 'Applying...' : 'Apply Data'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
