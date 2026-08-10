'use client';

import { useState } from 'react';

export default function DownloadButton({ movieId, title }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

      const videoUrl = `${window.location.origin}/api/video/stream/${data.token}`;
      
      // Check if we are running inside the React Native WebView
      if (window.ReactNativeWebView) {
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

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="gms-btn gms-btn--ghost"
        style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'wait' : 'pointer' }}
      >
        {loading ? (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Preparing…
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </>
        )}
      </button>
      {error && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '6px' }}>{error}</p>}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
