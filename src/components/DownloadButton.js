'use client';

import { useState, useEffect } from 'react';

export default function DownloadButton({ movieId, title }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null); // null means not downloading, 1 means completed
  const [isNative, setIsNative] = useState(() => {
    if (typeof window !== 'undefined') {
      return !!window.ReactNativeWebView;
    }
    return false;
  });

  useEffect(() => {

    const handleMessage = (event) => {
      try {
        let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (typeof data === 'string') data = JSON.parse(data); // Double parse in case of escaped JSON

        if (data.type === 'DOWNLOAD_PROGRESS' && data.downloads) {
          const myDownload = data.downloads.find(d => d.movieId === movieId);
          if (myDownload) {
            setProgress(myDownload.progress);
          }
        }
      } catch (e) {
        // Not a JSON message or unrelated message, ignore
      }
    };

    // React Native WebView messages come on the document or window
    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage); // for older android

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
    };
  }, [movieId]);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get a secure token (same auth-checked endpoint)
      const res = await fetch('/api/video/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId }),
      });
      const data = await res.json();

      if (!data.token) {
        setError(data.error || 'Unable to generate download link.');
        setLoading(false);
        return;
      }

      const safeTitle = encodeURIComponent((title || 'flixon-video').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim());
      const videoUrl = `${window.location.origin}/api/video/stream/${data.token}?download=1&title=${safeTitle}`;
      
      // Check if we are running inside the React Native WebView
      if (window.ReactNativeWebView) {
        setProgress(0); // optimistically show 0% progress
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'DOWNLOAD_VIDEO',
          payload: {
            videoUrl,
            title: title || 'flixon-video',
            movieId
          }
        }));
      } else {
        // Trigger download via a hidden <a> pointing to the proxy stream
        const a = document.createElement('a');
        a.href = videoUrl;
        // Suggest a clean filename using the movie title
        a.download = `${(title || 'flixon-video').replace(/[^a-zA-Z0-9\s-]/g, '').trim()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Render logic based on progress
  let buttonContent = null;
  let disabled = false;
  let opacity = 1;

  if (progress === 1) {
    buttonContent = (
      <>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        <span style={{ color: '#4ade80' }}>Downloaded</span>
      </>
    );
    disabled = true;
  } else if (progress !== null) {
    // Show progress bar (if 0, it means indeterminate chunked download)
    const isIndeterminate = progress === 0;
    buttonContent = (
      <>
        <div style={{ width: '100px', height: '6px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
          <div style={{ 
            width: isIndeterminate ? '50%' : `${Math.round(progress * 100)}%`, 
            height: '100%', 
            background: '#e50914',
            animation: isIndeterminate ? 'indeterminate 1.5s infinite linear' : 'none',
            position: isIndeterminate ? 'absolute' : 'static'
          }} />
        </div>
        <span style={{ fontSize: '13px' }}>
          {isIndeterminate ? 'Downloading' : `${Math.round(progress * 100)}%`}
        </span>
      </>
    );
    disabled = true;
  } else if (loading) {
    buttonContent = (
      <>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
        Preparing…
      </>
    );
    disabled = true;
    opacity = 0.6;
  } else {
    buttonContent = (
      <>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        style={{ opacity, cursor: disabled ? 'default' : 'pointer' }}
      >
        {buttonContent}
      </button>
      {error && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes indeterminate {
          0% { left: -50%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
}
