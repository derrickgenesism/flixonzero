'use client';

import { useEffect, useRef, useState } from 'react';
import { saveWatchProgress } from './actions';

export default function VideoPlayer({ movie, movieId, initialProgress = 0 }) {
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState(null);
  const [tokenError, setTokenError] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastSavedTime = useRef(0);
  const hasSetInitialTime = useRef(false);
  const viewCounted = useRef(false);

  // Fetch a secure token on mount, then build the stream URL
  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch('/api/video/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId }),
    })
      .then(r => r.json())
      .then(data => {
        if (!active) return;
        if (data.token) {
          setStreamUrl(`/api/video/stream/${data.token}`);
        } else {
          setTokenError(data.error || 'Unable to load video');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setTokenError('Network error. Please refresh and try again.');
        setLoading(false);
      });

    return () => { active = false; };
  }, [movieId]);

  // Set initial progress once video metadata is loaded
  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;
    const vid = videoRef.current;
    const onLoaded = () => {
      if (initialProgress > 0 && !hasSetInitialTime.current) {
        vid.currentTime = initialProgress;
        hasSetInitialTime.current = true;
      }
    };
    const onPlay = () => {
      if (!viewCounted.current) {
        viewCounted.current = true;
        fetch(`/api/v1/movies/${movieId}/view`, { method: 'POST' }).catch(() => {});
      }
    };
    vid.addEventListener('loadedmetadata', onLoaded);
    vid.addEventListener('play', onPlay);
    return () => {
      vid.removeEventListener('loadedmetadata', onLoaded);
      vid.removeEventListener('play', onPlay);
    };
  }, [streamUrl, initialProgress]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = Math.floor(videoRef.current.currentTime);
    if (currentTime > 0 && currentTime - lastSavedTime.current >= 10) {
      lastSavedTime.current = currentTime;
      saveWatchProgress(movie.id, currentTime).catch(console.error);
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', minHeight: '300px', flexDirection: 'column', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid var(--acc)', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--text2)', fontSize: '13px' }}>Securing stream…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', minHeight: '300px', flexDirection: 'column', gap: '12px' }}>
        <p style={{ color: '#ff6b6b', fontSize: '15px' }}>⚠ {tokenError}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      controls
      autoPlay
      poster={movie.thumbnail_url}
      onTimeUpdate={handleTimeUpdate}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    >
      <source src={streamUrl} />
      Your browser does not support the video tag.
    </video>
  );
}
