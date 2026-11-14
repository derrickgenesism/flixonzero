'use client';

import { useState, useEffect, useRef } from 'react';
import { insertMovie, fetchTMDBMovieDetails } from '../add/actions';
import Link from 'next/link';
import VjSelector from '@/components/admin/VjSelector';

function extractVjsAndCleanTitle(urlOrName) {
  if (!urlOrName) return { title: '', vjs: [] };
  let name = urlOrName.split('/').pop().split('?')[0] || '';
  try {
    name = decodeURIComponent(name);
  } catch (_) {}

  const lower = name.toLowerCase().replace(/[\._-]/g, ' ');
  const detectedVjs = [];
  const knownVjs = [
    { key: 'vj junior', name: 'VJ Junior' },
    { key: 'vj emmy', name: 'VJ Emmy' },
    { key: 'vj ice p', name: 'VJ Ice P' },
    { key: 'vj jingo', name: 'VJ Jingo' },
    { key: 'vj mark', name: 'VJ Mark' },
    { key: 'vj kamil', name: 'VJ Kamil' },
    { key: 'vj jovan', name: 'VJ Jovan' },
    { key: 'vj kevin', name: 'VJ Kevin' },
    { key: 'vj kevo', name: 'VJ Kevo' },
    { key: 'vj muba', name: 'VJ Muba' },
    { key: 'vj neil', name: 'VJ Neil' },
    { key: 'vj ulio', name: 'VJ Ulio' },
    { key: 'vj ham', name: 'VJ Ham' },
    { key: 'vj mosco', name: 'VJ Mosco' },
    { key: 'vj soul', name: 'VJ Soul' },
    { key: 'vj cox', name: 'VJ Cox' },
    { key: 'vj isma', name: 'VJ Isma' },
    { key: 'vj frank', name: 'VJ Frank' },
  ];

  for (const item of knownVjs) {
    if (lower.includes(item.key) && !detectedVjs.includes(item.name)) {
      detectedVjs.push(item.name);
    }
  }

  const title = name
    .replace(/\.(mp4|mkv|webm|avi|mov|m3u8)$/i, '')
    .replace(/[\._]/g, ' ')
    .replace(/\b(vj\s+[a-z0-9]+)\b/ig, '')
    .replace(/\b(1080p|720p|480p|4k|2160p|bluray|web-dl|webrip|x264|x265|hevc|h264|aac|dvdrip|hdrip|luga|luganda|translated)\b/ig, '')
    .replace(/\[.*?\]|\(.*?\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { title, vjs: detectedVjs };
}

function cleanMovieTitleFromUrl(urlOrName) {
  return extractVjsAndCleanTitle(urlOrName).title;
}

export default function UploadClient({ tmdbApiKey = '' }) {
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'file'
  const [provider, setProvider] = useState('b2'); // 'b2' or 'r2'
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState(null);

  // TMDB Selection State for currently queued item
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTmdb, setSelectedTmdb] = useState(null);
  const [autoPublish, setAutoPublish] = useState(true);
  const [isNewArrival, setIsNewArrival] = useState(false);
  const [selectedVjs, setSelectedVjs] = useState([]);

  // Active Multi-Job Queue
  const [jobs, setJobs] = useState([]);

  // Auto-detect title and VJ from URL or file input
  useEffect(() => {
    const raw = uploadMode === 'url' ? videoUrl.trim() : (file?.name || '');
    if (raw) {
      const { title, vjs } = extractVjsAndCleanTitle(raw);
      if (title && !selectedTmdb && title.length > 2) {
        setSearchQuery(title);
      }
      if (vjs.length > 0 && selectedVjs.length === 0) {
        setSelectedVjs(vjs);
      }
    }
  }, [videoUrl, file, uploadMode, selectedTmdb]);

  // Debounced TMDB Search
  useEffect(() => {
    if (!tmdbApiKey || !searchQuery.trim() || searchQuery.trim().length < 2 || selectedTmdb) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results?.slice(0, 5) || []);
        }
      } catch (err) {
        console.error('TMDB Search Error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, tmdbApiKey, selectedTmdb]);

  async function handleSelectTmdb(item) {
    setIsSearching(true);
    setSuggestions([]);
    try {
      const details = await fetchTMDBMovieDetails(item.id, tmdbApiKey);
      if (details) {
        const cast = details.credits?.cast?.slice(0, 5).map(c => c.name).join(', ') || '';
        const year = details.release_date ? details.release_date.split('-')[0] : '';
        const genres = details.genres?.map(g => g.name) || ['Action', 'Drama'];
        const director = details.credits?.crew?.find(c => c.job === 'Director')?.name || '';

        setSelectedTmdb({
          tmdbId: details.id,
          title: details.title || item.title,
          description: details.overview || item.overview || 'Stream high-definition movies on FlixOn.',
          thumbnail_url: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
          backdrop_url: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : '',
          release_year: year,
          release_date: details.release_date || item.release_date || '',
          actors: cast,
          categories: genres,
          director,
          runtime: details.runtime || '',
          imdb_rating: details.vote_average ? (details.vote_average / 2).toFixed(1) : ''
        });
        setSearchQuery(details.title || item.title);
      }
    } catch (err) {
      console.error('Failed to fetch full TMDB movie details:', err);
    } finally {
      setIsSearching(false);
    }
  }

  // Publish a completed video with TMDB data
  async function publishMovieToCatalog(jobId, tmdbData, publicVideoUrl, vjs = []) {
    if (!tmdbData || !publicVideoUrl) return;

    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, publishing: true } : j));

    try {
      const nonVjCategories = (tmdbData.categories || ['Action', 'Drama']).filter(c => !c || !c.toLowerCase().startsWith('vj '));
      const finalCategories = [...nonVjCategories, ...(vjs || [])];

      // Respect exact publication / release date from TMDB
      let publicationDate = new Date().toISOString();
      if (tmdbData?.release_date) {
        try {
          publicationDate = new Date(tmdbData.release_date).toISOString();
        } catch (_) {}
      }

      const moviePayload = {
        title: tmdbData.title,
        description: tmdbData.description,
        type: 'video',
        thumbnail_url: tmdbData.thumbnail_url,
        video_url: publicVideoUrl,
        categories: finalCategories.length > 0 ? finalCategories : ['Action', 'Drama'],
        release_year: tmdbData.release_year,
        created_at: publicationDate,
        actors: tmdbData.actors,
        director: tmdbData.director,
        runtime: tmdbData.runtime,
        imdb_rating: tmdbData.imdb_rating,
      };

      const res = await insertMovie(moviePayload);
      if (res?.success) {
        setJobs(prev => prev.map(j => j.id === jobId ? {
          ...j,
          publishing: false,
          published: true,
          publishedMovieId: res.movie?.id
        } : j));
      } else {
        setJobs(prev => prev.map(j => j.id === jobId ? {
          ...j,
          publishing: false,
          publishError: res?.error || 'Failed to publish movie'
        } : j));
      }
    } catch (err) {
      console.error('Publish Error:', err);
      setJobs(prev => prev.map(j => j.id === jobId ? {
        ...j,
        publishing: false,
        publishError: err.message
      } : j));
    }
  }

  // Add a new job to the streaming queue and start processing immediately
  function handleQueueJob() {
    if (uploadMode === 'url' && !videoUrl.trim()) return;
    if (uploadMode === 'file' && !file) return;

    const currentUrl = videoUrl.trim();
    const currentFile = file;
    const currentTargetProvider = provider;
    const currentTmdb = selectedTmdb;
    const currentAutoPublish = autoPublish;
    const currentVjs = isNewArrival ? [...selectedVjs, 'New Arrival'] : [...selectedVjs];

    const rawName = uploadMode === 'url'
      ? (currentUrl.split('/').pop().split('?')[0] || `video_${Date.now()}.mp4`)
      : currentFile.name;

    let cleanFilename = rawName;
    try { cleanFilename = decodeURIComponent(rawName); } catch (_) {}
    cleanFilename = cleanFilename.replace(/\s+/g, '-');

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newJob = {
      id: jobId,
      type: uploadMode,
      source: uploadMode === 'url' ? currentUrl : currentFile.name,
      filename: cleanFilename,
      provider: currentTargetProvider,
      progress: 0,
      status: 'streaming', // 'streaming', 'completed', 'error', 'cancelled'
      statusMsg: uploadMode === 'url' ? 'Connecting to source URL...' : 'Requesting upload signature...',
      error: null,
      publicUrl: null,
      tmdb: currentTmdb,
      vjs: currentVjs,
      autoPublish: currentAutoPublish,
      published: false,
      publishing: false,
      publishError: null,
      publishedMovieId: null,
      abortController: null,
    };

    setJobs(prev => [newJob, ...prev]);

    // Reset inputs immediately so admin can paste the next movie!
    setVideoUrl('');
    setFile(null);
    setSelectedTmdb(null);
    setSelectedVjs([]);
    setIsNewArrival(false);
    setSearchQuery('');
    setSuggestions([]);
    const fileEl = document.getElementById('flx-queue-file-input');
    if (fileEl) fileEl.value = '';

    // Start background stream
    if (uploadMode === 'url') {
      startUrlStream(jobId, currentUrl, cleanFilename, currentTargetProvider, currentTmdb, currentAutoPublish, currentVjs);
    } else {
      startFileUpload(jobId, currentFile, cleanFilename, currentTargetProvider, currentTmdb, currentAutoPublish, currentVjs);
    }
  }

  // URL Stream Worker
  function startUrlStream(jobId, url, key, targetProvider, tmdbData, shouldAutoPublish, vjs = []) {
    const sse = new EventSource(`/api/upload-direct?url=${encodeURIComponent(url)}&key=${encodeURIComponent(key)}&provider=${targetProvider}`);

    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, abortController: sse } : j));

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'progress') {
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, progress: payload.data } : j));
        } else if (payload.type === 'status') {
          setJobs(prev => prev.map(j => j.id === jobId ? { ...j, statusMsg: payload.data } : j));
        } else if (payload.type === 'complete') {
          sse.close();
          const finalUrl = payload.data.url;
          setJobs(prev => prev.map(j => j.id === jobId ? {
            ...j,
            status: 'completed',
            progress: 100,
            statusMsg: `Streamed successfully to ${targetProvider.toUpperCase()}!`,
            publicUrl: finalUrl
          } : j));

          if (shouldAutoPublish && tmdbData) {
            publishMovieToCatalog(jobId, tmdbData, finalUrl, vjs);
          }
        } else if (payload.type === 'error') {
          sse.close();
          setJobs(prev => prev.map(j => j.id === jobId ? {
            ...j,
            status: 'error',
            error: payload.data,
            statusMsg: 'Streaming failed'
          } : j));
        }
      } catch (err) {
        console.warn('SSE Parse warning:', err);
      }
    };

    sse.onerror = () => {
      sse.close();
      setJobs(prev => prev.map(j => j.id === jobId && j.status === 'streaming' ? {
        ...j,
        status: 'error',
        error: 'Connection dropped while streaming link.',
        statusMsg: 'Stream interrupted'
      } : j));
    };
  }

  // File Upload Worker
  async function startFileUpload(jobId, fileObj, key, targetProvider, tmdbData, shouldAutoPublish, vjs = []) {
    try {
      const res = await fetch('/api/r2-presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: fileObj.name, contentType: fileObj.type || 'video/mp4', provider: targetProvider })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get upload signature');

      const { url, key: generatedKey } = data;
      const xhr = new XMLHttpRequest();

      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, abortController: xhr } : j));

      await new Promise((resolve, reject) => {
        xhr.open('PUT', url, true);
        xhr.setRequestHeader('Content-Type', fileObj.type || 'video/mp4');

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.min(99, Math.round((e.loaded / e.total) * 100));
            setJobs(prev => prev.map(j => j.id === jobId ? {
              ...j,
              progress: percent,
              statusMsg: `Uploading ${percent}% (${(e.loaded / (1024 * 1024)).toFixed(1)} MB / ${(e.total / (1024 * 1024)).toFixed(1)} MB)...`
            } : j));
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed with HTTP ${xhr.status}`));
        };

        xhr.onerror = () => reject(new Error('Network error during file upload'));
        xhr.onabort = () => reject(new Error('Upload was cancelled by user'));
        xhr.send(fileObj);
      });

      const finalUrl = `https://cdn.flixon.net/${encodeURIComponent(generatedKey)}`;
      setJobs(prev => prev.map(j => j.id === jobId ? {
        ...j,
        status: 'completed',
        progress: 100,
        statusMsg: `File saved to ${targetProvider.toUpperCase()} bucket!`,
        publicUrl: finalUrl
      } : j));

      if (shouldAutoPublish && tmdbData) {
            publishMovieToCatalog(jobId, tmdbData, finalUrl, vjs);
          }
    } catch (err) {
      setJobs(prev => prev.map(j => j.id === jobId ? {
        ...j,
        status: 'error',
        error: err.message,
        statusMsg: 'Upload failed'
      } : j));
    }
  }

  // Cancel in-flight job
  function handleCancelJob(jobId) {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        if (j.abortController) {
          if (typeof j.abortController.close === 'function') j.abortController.close();
          if (typeof j.abortController.abort === 'function') j.abortController.abort();
        }
        return { ...j, status: 'cancelled', statusMsg: 'Cancelled by admin' };
      }
      return j;
    }));
  }

  // Remove job from list
  function handleRemoveJob(jobId) {
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%', boxSizing: 'border-box' }}>
      
      {/* ── TOP: Multi-Movie Stream & Upload Card ── */}
      <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
        
        {/* Header & Modes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', color: '#fff', fontSize: '20px', fontWeight: '800' }}>
              ⚡ High-Speed Direct Stream &amp; Instant TMDB Publisher
            </h2>
            <p style={{ margin: 0, color: 'var(--text3)', fontSize: '13px' }}>
              Stream movies directly from any URL into your cloud storage and publish them live to FlixOn in a single step.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setUploadMode('url')}
              style={{
                background: uploadMode === 'url' ? 'var(--acc)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: uploadMode === 'url' ? '1px solid var(--acc)' : '1px solid rgba(255,255,255,0.1)',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              🔗 Direct URL Stream
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('file')}
              style={{
                background: uploadMode === 'file' ? 'var(--acc)' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: uploadMode === 'file' ? '1px solid var(--acc)' : '1px solid rgba(255,255,255,0.1)',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '700'
              }}
            >
              📁 File Upload
            </button>
          </div>
        </div>

        {/* Cloud Provider Destination */}
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Target Cloud Bucket:
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setProvider('b2')}
              style={{
                background: provider === 'b2' ? '#9333ea' : 'transparent',
                color: '#fff',
                border: provider === 'b2' ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.1)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🟣 Backblaze B2 (flixonvideos)
            </button>
            <button
              type="button"
              onClick={() => setProvider('r2')}
              style={{
                background: provider === 'r2' ? '#ea580c' : 'transparent',
                color: '#fff',
                border: provider === 'r2' ? '1px solid #f97316' : '1px solid rgba(255,255,255,0.1)',
                padding: '5px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              🟠 Cloudflare R2 (movies)
            </button>
          </div>
        </div>

        {/* Input Field: URL or File */}
        <div style={{ marginBottom: '16px' }}>
          {uploadMode === 'url' ? (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Direct Movie Link (.mp4 / .mkv / direct video URL):
              </label>
              <input
                type="url"
                placeholder="https://example.com/source/Spider-Man-No-Way-Home.1080p.mp4"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '13px 16px',
                  borderRadius: '8px',
                  border: '1px solid #444',
                  background: '#111',
                  color: '#fff',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Video File:
              </label>
              <input
                type="file"
                id="flx-queue-file-input"
                accept="video/*"
                onChange={e => e.target.files && setFile(e.target.files[0])}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '2px dashed #444',
                  borderRadius: '8px',
                  background: '#111',
                  color: 'var(--text2)',
                  cursor: 'pointer',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}
        </div>

        {/* TMDB Smart Matcher Section */}
        {tmdbApiKey && (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🎬 TMDB Metadata &amp; Auto-Publish:
              </span>
              {selectedTmdb && (
                <button
                  type="button"
                  onClick={() => setSelectedTmdb(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Change Movie
                </button>
              )}
            </div>

            {selectedTmdb ? (
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '10px', padding: '10px 14px' }}>
                {selectedTmdb.thumbnail_url && (
                  <img src={selectedTmdb.thumbnail_url} alt="" style={{ width: '42px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: '800', color: '#fff', fontSize: '15px' }}>
                    {selectedTmdb.title} <span style={{ color: '#fbbf24', fontSize: '12px' }}>({selectedTmdb.release_year})</span>
                  </div>
                  <div style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedTmdb.categories?.join(' • ')} {selectedTmdb.imdb_rating ? `· ★ ${selectedTmdb.imdb_rating}/5` : ''}
                  </div>
                  <div style={{ color: '#4ade80', fontSize: '11px', marginTop: '3px', fontWeight: '700' }}>
                    ✓ Metadata locked — ready for instant publishing
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search movie title on TMDB (e.g. Dune Part Two)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    border: '1px solid #444',
                    background: '#1a1a1a',
                    color: '#fff',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
                {isSearching && (
                  <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '12px', color: 'var(--text3)' }}>
                    Searching...
                  </span>
                )}

                {suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#202020', border: '1px solid #444', borderRadius: '8px', marginTop: '4px', zIndex: 100, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
                    {suggestions.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectTmdb(s)}
                        style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '12px', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {s.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w92${s.poster_path}`} style={{ width: '32px', height: '46px', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                        ) : (
                          <div style={{ width: '32px', height: '46px', background: '#333', borderRadius: '4px' }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ color: '#fff', fontSize: '14px', display: 'block' }}>{s.title}</strong>
                          <span style={{ color: 'var(--text3)', fontSize: '12px' }}>
                            {s.release_date ? s.release_date.split('-')[0] : 'N/A'} {s.vote_average ? `• ★ ${(s.vote_average / 2).toFixed(1)}` : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auto-Publish & Feature Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={e => setAutoPublish(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#22c55e' }}
                />
                <span>Automatically publish movie to FlixOn as soon as video stream completes</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#fbbf24' }}>
                <input
                  type="checkbox"
                  checked={isNewArrival}
                  onChange={e => setIsNewArrival(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#fbbf24' }}
                />
                <span>⭐ Pin to Top of New Arrivals (special priority placement above standard release dates)</span>
              </label>
            </div>
          </div>
        )}

                {/* VJ (Translator) Selection Section */}
        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🎙️ VJ (Translator) Selection:
            </span>
            {selectedVjs.length > 0 && (
              <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '700' }}>
                {selectedVjs.join(', ')}
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 10px 0' }}>
            Select the VJ who voiced/translated this movie (e.g. VJ Junior, VJ Emmy, VJ Ice P). It will be saved directly into the movie categories.
          </p>
          <VjSelector
            selectedVjs={selectedVjs}
            onChange={setSelectedVjs}
          />
        </div>

        {/* Action Button: Never blocks! */}
        <button
          type="button"
          onClick={handleQueueJob}
          disabled={(uploadMode === 'url' && !videoUrl.trim()) || (uploadMode === 'file' && !file)}
          className="gms-btn gms-btn--primary"
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '15px',
            fontWeight: '800',
            opacity: ((uploadMode === 'url' && !videoUrl.trim()) || (uploadMode === 'file' && !file)) ? 0.5 : 1,
            cursor: ((uploadMode === 'url' && !videoUrl.trim()) || (uploadMode === 'file' && !file)) ? 'not-allowed' : 'pointer'
          }}
        >
          ⚡ {uploadMode === 'url' ? 'Start Streaming & Add to Queue' : 'Upload File & Add to Queue'}
        </button>
      </div>

      {/* ── BOTTOM: Live Multi-Job Stream Queue ── */}
      {jobs.length > 0 && (
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>
              Streaming Queue ({jobs.length})
            </h3>
            <button
              type="button"
              onClick={() => setJobs(prev => prev.filter(j => j.status === 'streaming'))}
              style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Clear Finished
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {jobs.map(job => {
              const isDone = job.status === 'completed';
              const isError = job.status === 'error';
              const isCancelled = job.status === 'cancelled';

              return (
                <div
                  key={job.id}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isDone ? 'rgba(74,222,128,0.3)' : isError ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '12px',
                    padding: '18px',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                      {job.tmdb?.thumbnail_url ? (
                        <img src={job.tmdb.thumbnail_url} alt="" style={{ width: '36px', height: '52px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <div style={{ width: '36px', height: '52px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                          🎬
                        </div>
                      )}
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: '800', color: '#fff', fontSize: '15px', wordBreak: 'break-all' }}>
                          {job.tmdb?.title ? `${job.tmdb.title} (${job.tmdb.release_year || ''})` : job.filename}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px', wordBreak: 'break-all' }}>
                          <span style={{ color: job.provider === 'b2' ? '#c084fc' : '#f97316', fontWeight: '700' }}>
                            {job.provider === 'b2' ? '🟣 Backblaze B2' : '🟠 Cloudflare R2'}
                          </span>
                          {job.vjs && job.vjs.length > 0 && (
                            <>
                              {' • '}
                              <span style={{ color: '#38bdf8', fontWeight: '700' }}>
                                🎙️ {job.vjs.join(', ')}
                              </span>
                            </>
                          )}
                          {' • '}
                          <span style={{ color: isDone ? '#4ade80' : isError ? '#ff6b6b' : 'var(--text2)' }}>
                            {job.statusMsg}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {job.status === 'streaming' && (
                        <button
                          type="button"
                          onClick={() => handleCancelJob(job.id)}
                          style={{ background: 'rgba(239,68,68,0.15)', color: '#ff6b6b', border: '1px solid rgba(239,68,68,0.3)', padding: '5px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                        >
                          Cancel
                        </button>
                      )}
                      {(isDone || isError || isCancelled) && (
                        <button
                          type="button"
                          onClick={() => handleRemoveJob(job.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '16px', cursor: 'pointer' }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {job.status === 'streaming' && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text3)', marginBottom: '4px' }}>
                        <span>High-Speed Direct Stream</span>
                        <strong>{job.progress}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${job.progress}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #818cf8)', transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {job.error && (
                    <div style={{ marginTop: '10px', padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', color: '#ff6b6b', fontSize: '13px' }}>
                      <strong>Error:</strong> {job.error}
                    </div>
                  )}

                  {/* Published Success Badge */}
                  {job.published && (
                    <div style={{ marginTop: '12px', background: 'rgba(74,222,128,0.1)', border: '1px solid #4ade80', borderRadius: '8px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ color: '#4ade80', fontWeight: '800', fontSize: '13px' }}>
                        ✅ Published Live on FlixOn!
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {job.publishedMovieId && (
                          <Link
                            href={`/movie/${job.publishedMovieId}`}
                            target="_blank"
                            style={{ color: '#fff', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none' }}
                          >
                            View Movie ↗
                          </Link>
                        )}
                        <Link
                          href="/admin/movies"
                          style={{ color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none' }}
                        >
                          Manage Movies →
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Manual Publish Option if completed without TMDB */}
                  {isDone && !job.published && !job.publishing && (
                    <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                      <span style={{ color: 'var(--text3)', fontSize: '12px' }}>
                        Video ready in cloud: <code style={{ color: '#38bdf8' }}>{job.publicUrl}</code>
                      </span>
                      <Link
                        href={`/admin/movies/add?title=${encodeURIComponent(job.tmdb?.title || cleanMovieTitleFromUrl(job.filename))}&video_url=${encodeURIComponent(job.publicUrl)}${job.vjs && job.vjs.length > 0 ? `&vj=${encodeURIComponent(job.vjs.join(','))}` : ''}`}
                        className="gms-btn gms-btn--primary"
                        style={{ fontSize: '12px', padding: '6px 14px' }}
                      >
                        Publish Movie Details &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
