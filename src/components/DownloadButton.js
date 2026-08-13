'use client';

import { useState, useEffect, useRef } from 'react';

export default function DownloadButton({ movieId, title }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null); // null = idle, 0-0.99 = downloading, 1 = done
  const [isNative] = useState(() => {
    if (typeof window !== 'undefined') return !!window.ReactNativeWebView;
    return false;
  });
  const abortRef = useRef(null);

  const [statusState, setStatusState] = useState(null); // null, 'downloading', 'paused', 'completed'
  const [pausedProgress, setPausedProgress] = useState(0);

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (typeof data === 'string') data = JSON.parse(data);
        if (data.type === 'DOWNLOAD_PROGRESS' && data.downloads) {
          const mine = data.downloads.find(d => String(d.movieId) === String(movieId));
          if (!mine) {
            // Deleted from mobile downloads -> reset button to idle state
            setProgress(null);
            setStatusState(null);
          } else if (mine.status === 'completed') {
            setProgress(1);
            setStatusState('completed');
          } else if (mine.status === 'paused') {
            setStatusState('paused');
            setPausedProgress(mine.progress || 0);
          } else if (mine.status === 'downloading') {
            setStatusState('downloading');
            setProgress(mine.progress || 0);
          } else if (mine.status === 'error') {
            setProgress(null);
            setStatusState(null);
          }
        }
      } catch (_) {}
    };
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
    };
  }, [movieId]);

  const handleDownload = async () => {
    // If paused in React Native app, send RESUME_DOWNLOAD message
    if (statusState === 'paused' && (isNative || window.ReactNativeWebView)) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'RESUME_DOWNLOAD',
        payload: { movieId },
      }));
      setStatusState('downloading');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // For React Native WebView — hand off direct download URL to native downloader
      if (isNative || window.ReactNativeWebView) {
        const dlRes = await fetch('/api/video/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId, title }),
        });
        const dlData = await dlRes.json();
        if (!dlData.downloadUrl) {
          setError(dlData.error || 'Unable to generate download link.');
          setLoading(false);
          return;
        }
        setProgress(0);
        setStatusState('downloading');
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DOWNLOAD_VIDEO',
          payload: {
            videoUrl: dlData.downloadUrl,
            title: title || 'flixon-video',
            movieId,
          },
        }));
        setLoading(false);
        return;
      }

      // For web: call self-contained download endpoint with movieId
      const res = await fetch('/api/video/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, title }),
      });

      const dlData = await res.json();

      if (!dlData.downloadUrl) {
        setError(dlData.error || 'Download link generation failed. Please try again.');
        setLoading(false);
        return;
      }

      // Trigger browser native download via location assignment.
      window.location.href = dlData.downloadUrl;

    } catch (err) {
      if (err.name === 'AbortError') {
        setProgress(null);
        setStatusState(null);
        return;
      }
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Button rendering ---
  let content;
  let disabled = false;

  if (statusState === 'completed' || progress === 1) {
    content = (
      <>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span style={{ color: '#4ade80' }}>Downloaded</span>
      </>
    );
    disabled = true;
  } else if (statusState === 'paused') {
    content = (
      <>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24" stroke="none">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span style={{ color: '#fbbf24' }}>Resume ({Math.round((pausedProgress || 0) * 100)}%)</span>
      </>
    );
  } else if (statusState === 'downloading' || progress !== null) {
    const pct = Math.round((progress || 0) * 100);
    content = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '70px', height: '5px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--acc)', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: '12px' }}>{pct}%</span>

        {/* Pause Icon Button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (isNative || window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'PAUSE_DOWNLOAD',
                payload: { movieId }
              }));
              setStatusState('paused');
            }
          }}
          title="Pause Download"
          style={{ cursor: 'pointer', padding: '2px 4px', display: 'inline-flex', alignItems: 'center', opacity: 0.9 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#fbbf24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </span>

        {/* Stop / Cancel Icon Button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            if (isNative || window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'DELETE_DOWNLOAD',
                payload: { movieId }
              }));
              setProgress(null);
              setStatusState(null);
            }
          }}
          title="Stop & Cancel Download"
          style={{ cursor: 'pointer', padding: '2px 4px', display: 'inline-flex', alignItems: 'center', opacity: 0.9 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#ff6b6b">
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </span>
      </div>
    );
    disabled = false;
  } else if (loading) {
    content = (
      <>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Preparing…
      </>
    );
    disabled = true;
  } else {
    content = (
      <>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download
      </>
    );
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={disabled}
        className="gms-btn gms-btn--ghost"
        style={{ opacity: disabled && !progress ? 0.6 : 1, cursor: disabled ? 'default' : 'pointer' }}
      >
        {content}
      </button>
      {error && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '6px', maxWidth: '220px' }}>{error}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
