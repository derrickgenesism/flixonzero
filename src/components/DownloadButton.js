'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import OfferCountdown from '@/components/OfferCountdown';
import { useRouter } from 'next/navigation';

export default function DownloadButton({ movieId, title, requiresSubscription, offer = null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null); // null = idle, 0-0.99 = downloading, 1 = done
  const [isNative] = useState(() => {
    if (typeof window !== 'undefined') return !!window.ReactNativeWebView;
    return false;
  });
  const abortRef = useRef(null);

  // "Subscribe to download" prompt (shown instead of a plain error when a non-subscriber taps Download)
  const [showSubscribe, setShowSubscribe] = useState(false);

  useEffect(() => {
    if (!showSubscribe) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowSubscribe(false); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [showSubscribe]);

  const [statusState, setStatusState] = useState(null); // null, 'downloading', 'completed'

  useEffect(() => {
    const handleMessage = (event) => {
      try {
        let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (typeof data === 'string') data = JSON.parse(data);
        if (data.type === 'DOWNLOAD_PROGRESS' && data.downloads) {
          const mine = data.downloads.find(d => String(d.movieId) === String(movieId));
          if (!mine || mine.status === 'paused' || mine.status === 'error') {
            // Deleted, paused, or error -> reset button to idle state
            setProgress(null);
            setStatusState(null);
          } else if (mine.status === 'completed') {
            setProgress(1);
            setStatusState('completed');
          } else if (mine.status === 'downloading') {
            setStatusState('downloading');
            setProgress(mine.progress || 0);
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
          if (dlRes.status === 403 || dlData.error === 'Subscription required') {
            setShowSubscribe(true);
            setLoading(false);
            return;
          }
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
        if (res.status === 403 || dlData.error === 'Subscription required') {
          setShowSubscribe(true);
          setLoading(false);
          return;
        }
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
  } else if (statusState === 'downloading' || (progress !== null && progress < 1)) {
    const pct = Math.round((progress || 0) * 100);
    content = (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ width: '65px', height: '5px', background: 'rgba(255,255,255,0.15)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#e50914', transition: 'width 0.3s' }} />
        </div>
        <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{pct}%</span>

        {/* Stop / Cancel Button */}
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isNative || window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'DELETE_DOWNLOAD',
                payload: { movieId }
              }));
            }
            setProgress(null);
            setStatusState(null);
          }}
          title="Stop & Cancel Download"
          style={{
            background: 'rgba(239, 68, 68, 0.25)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            color: '#ff6b6b',
            fontSize: '11px',
            fontWeight: '700',
            padding: '2px 7px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            marginLeft: '4px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Stop
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
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <button
        type="button"
        onClick={handleDownload}
        disabled={disabled}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 24px',
          borderRadius: '10px',
          fontWeight: '700',
          fontSize: '14px',
          background: disabled && statusState === 'completed'
            ? '#064e3b' 
            : disabled && statusState === 'downloading'
            ? '#171717' 
            : '#262626',
          color: disabled && statusState === 'completed' ? '#4ade80' : '#ffffff',
          border: disabled && statusState === 'completed'
            ? '1px solid #4ade80'
            : disabled && statusState === 'downloading'
            ? '1px solid #e50914'
            : '1px solid #525252',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
          transition: 'all 0.2s ease-in-out',
          cursor: disabled ? 'default' : 'pointer',
        }}
      >
        {content}
      </button>

      {error && (
        <span style={{ color: '#ef4444', fontSize: '12px' }}>{error}</span>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {showSubscribe && typeof document !== 'undefined' && createPortal(
        <div
          className="flx-dlmodal-backdrop"
          onClick={() => setShowSubscribe(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Subscribe to download"
        >
          <div className="flx-dlmodal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="flx-dlmodal-close" onClick={() => setShowSubscribe(false)} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="flx-dlmodal-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </div>

            <h3 className="flx-dlmodal-title">Subscribe to download</h3>
            <p className="flx-dlmodal-text">
              Downloads are for subscribers. Subscribe now to save{title ? <> <strong>{title}</strong></> : ' this movie'} to your device and watch it offline — you can keep streaming it free right here in the meantime.
            </p>

            {offer?.enabled && (
              <div style={{ marginBottom: '16px' }}>
                <OfferCountdown durationMinutes={offer.durationMinutes} discountPercent={offer.discountPercent} variant="compact" />
              </div>
            )}

            <ul className="flx-dlmodal-list">
              {['Download movies and watch offline', 'Unlimited access to all premium movies & series', 'Pay in seconds with MTN or Airtel Mobile Money'].map((t) => (
                <li key={t}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>

            <Link href="/checkout" className="gms-btn gms-btn--primary flx-dlmodal-cta">
              Subscribe &amp; Download
            </Link>
            <button type="button" className="flx-dlmodal-later" onClick={() => setShowSubscribe(false)}>
              Continue watching free
            </button>
          </div>

          <style>{`
            .flx-dlmodal-backdrop {
              position: fixed; inset: 0; z-index: 10000;
              display: flex; align-items: center; justify-content: center; padding: 20px;
              background: rgba(0,0,0,.78); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
              animation: flxDlFade .18s ease-out;
            }
            .flx-dlmodal {
              position: relative; width: 100%; max-width: 400px; max-height: 92vh; overflow-y: auto;
              padding: 28px 24px 22px; text-align: center; border-radius: 20px;
              background: linear-gradient(180deg, #1b1b1b 0%, #121212 100%);
              border: 1px solid rgba(229,9,20,.35);
              box-shadow: 0 20px 60px rgba(0,0,0,.7), 0 0 40px rgba(229,9,20,.12);
              animation: flxDlPop .22s ease-out;
            }
            .flx-dlmodal-close {
              position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center; cursor: pointer;
              background: rgba(255,255,255,.08); border: none; color: #bbb;
            }
            .flx-dlmodal-close:hover { background: rgba(255,255,255,.16); color: #fff; }
            .flx-dlmodal-icon {
              width: 62px; height: 62px; margin: 0 auto 14px; border-radius: 50%;
              display: flex; align-items: center; justify-content: center;
              background: linear-gradient(135deg, #e50914, #ff4d4d); box-shadow: 0 8px 24px rgba(229,9,20,.45);
            }
            .flx-dlmodal-title { margin: 0 0 8px; font-size: 21px; font-weight: 900; color: #fff; letter-spacing: -.3px; }
            .flx-dlmodal-text { margin: 0 0 16px; font-size: 13.5px; line-height: 1.6; color: var(--text2, #a0a0a0); }
            .flx-dlmodal-text strong { color: #fff; }
            .flx-dlmodal-list { list-style: none; margin: 0 0 20px; padding: 0; text-align: left; display: flex; flex-direction: column; gap: 8px; }
            .flx-dlmodal-list li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #d4d4d4; }
            .flx-dlmodal-cta { display: flex; justify-content: center; width: 100%; padding: 14px; font-size: 15px; font-weight: 800; border-radius: 12px; text-decoration: none; box-sizing: border-box; }
            .flx-dlmodal-later { margin-top: 10px; background: transparent; border: none; color: var(--text3, #686868); font-size: 13px; cursor: pointer; padding: 6px; }
            .flx-dlmodal-later:hover { color: #fff; }
            @keyframes flxDlFade { from { opacity: 0; } to { opacity: 1; } }
            @keyframes flxDlPop { from { opacity: 0; transform: translateY(12px) scale(.97); } to { opacity: 1; transform: none; } }
            @media (prefers-reduced-motion: reduce) { .flx-dlmodal-backdrop, .flx-dlmodal { animation: none; } }
          `}</style>
        </div>,
        document.body
      )}
    </div>
  );
}
