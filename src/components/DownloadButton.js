'use client';

import { useState, useEffect } from 'react';

export default function DownloadButton({ movieId, title }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [isNative] = useState(() => {
    if (typeof window !== 'undefined') return !!window.ReactNativeWebView;
    return false;
  });

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (typeof data === 'string') data = JSON.parse(data);
        if (data.type === 'DOWNLOAD_PROGRESS' && data.downloads) {
          const mine = data.downloads.find(d => d.movieId === movieId);
          if (mine) setProgress(mine.progress);
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
    setLoading(true);
    setError(null);

    try {
      // For React Native WebView — hand off to the native downloader
      if (isNative || window.ReactNativeWebView) {
        const tokenRes = await fetch('/api/video/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ movieId }),
        });
        const tokenData = await tokenRes.json();
        if (!tokenData.token) {
          setError(tokenData.error || 'Unable to generate download link.');
          setLoading(false);
          return;
        }
        setProgress(0);
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DOWNLOAD_VIDEO',
          payload: {
            videoUrl: `${window.location.origin}/api/video/stream/${tokenData.token}`,
            title: title || 'flixon-video',
            movieId,
          },
        }));
        setLoading(false);
        return;
      }

      // For web: get the download URL (works for both R2 presigned and external proxy)
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

      // Open the download URL — browser handles it natively
      // For R2: presigned URL with Content-Disposition triggers immediate download
      // For external: our streaming proxy serves it with Content-Disposition
      const a = document.createElement('a');
      a.href = dlData.downloadUrl;
      const safe = (title || 'flixon-video')
        .replace(/[^a-zA-Z0-9\s\-_]/g, '').trim().replace(/\s+/g, '_') || 'flixon-video';
      a.download = `${safe}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- Button rendering ---
  let content;
  let disabled = false;

  if (progress === 1) {
    content = (
      <>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span style={{ color: '#4ade80' }}>Downloaded</span>
      </>
    );
    disabled = true;
  } else if (progress !== null) {
    const pct = Math.round((progress || 0) * 100);
    content = (
      <>
        <div style={{ width: '80px', height: '5px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--acc)', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: '12px' }}>{pct}%</span>
      </>
    );
    disabled = true;
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
