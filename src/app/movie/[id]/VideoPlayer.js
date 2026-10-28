'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { saveWatchProgress } from './actions';

export default function VideoPlayer({ movie, movieId, initialProgress = 0, initialStreamUrl = null }) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [streamUrl, setStreamUrl] = useState(initialStreamUrl || null);
  const [tokenError, setTokenError] = useState(null);
  const [loading, setLoading] = useState(!initialStreamUrl);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [networkStalled, setNetworkStalled] = useState(false);
  const [tapRipple, setTapRipple] = useState(null); // { side: 'left' | 'right', text: '10s' }
  const [isBuffering, setIsBuffering] = useState(false);

  const lastSavedTime = useRef(0);
  const hasSetInitialTime = useRef(false);
  const viewCounted = useRef(false);
  const lastTapRef = useRef({ time: 0, x: 0 });
  const rippleTimerRef = useRef(null);

  // 1. Fetch token ONLY if initialStreamUrl was not provided by server
  const fetchToken = useCallback(() => {
    if (initialStreamUrl) {
      setStreamUrl(initialStreamUrl);
      setLoading(false);
      setTokenError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setTokenError(null);

    fetch('/api/video/token', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ movieId }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!active) return;
        if (data.token) {
          setStreamUrl(data.token);
          setTokenError(null);
        } else {
          setTokenError(data.error || 'Unable to load video stream');
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setTokenError('Connection error. Please tap Retry to reload the video.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialStreamUrl, movieId]);

  useEffect(() => {
    if (!initialStreamUrl) {
      const cleanup = fetchToken();
      return cleanup;
    }
  }, [fetchToken, initialStreamUrl]);

  // 2. Set initial resume position and view tracking
  useEffect(() => {
    if (!videoRef.current || !streamUrl) return;
    const vid = videoRef.current;

    const onLoaded = () => {
      if (initialProgress > 0 && !hasSetInitialTime.current) {
        try {
          vid.currentTime = initialProgress;
          hasSetInitialTime.current = true;
        } catch {}
      }
      setNetworkStalled(false);
      setIsBuffering(false);
    };

    const onPlay = () => {
      setNetworkStalled(false);
      setIsBuffering(false);
      if (!viewCounted.current) {
        viewCounted.current = true;
        fetch(`/api/v1/movies/${movieId}/view`, { method: 'POST', credentials: 'include' }).catch(() => {});
      }
    };

    const onWaiting = () => setIsBuffering(true);
    const onPlaying = () => {
      setIsBuffering(false);
      setNetworkStalled(false);
    };
    const onError = () => {
      console.warn('[VideoPlayer] Playback error encountered, offering reload');
      setNetworkStalled(true);
      setIsBuffering(false);
    };

    vid.addEventListener('loadedmetadata', onLoaded);
    vid.addEventListener('play', onPlay);
    vid.addEventListener('waiting', onWaiting);
    vid.addEventListener('playing', onPlaying);
    vid.addEventListener('error', onError);

    return () => {
      vid.removeEventListener('loadedmetadata', onLoaded);
      vid.removeEventListener('play', onPlay);
      vid.removeEventListener('waiting', onWaiting);
      vid.removeEventListener('playing', onPlaying);
      vid.removeEventListener('error', onError);
    };
  }, [streamUrl, initialProgress, movieId]);

  // 3. Periodic watch progress saving
  const handleTimeUpdate = (force = false) => {
    if (!videoRef.current) return;
    const currentTime = Math.floor(videoRef.current.currentTime);
    if (currentTime > 0 && (force || currentTime - lastSavedTime.current >= 10)) {
      lastSavedTime.current = currentTime;
      saveWatchProgress(movie.id, currentTime).catch(() => {});
    }
  };

  // 4. Double-tap to seek (10s back / 10s forward)
  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const now = Date.now();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = touch.clientX - rect.left;
    const width = rect.width;
    const isLeft = x < width * 0.4;
    const isRight = x > width * 0.6;

    if (now - lastTapRef.current.time < 300) {
      // Double-tap detected
      if (videoRef.current) {
        if (isLeft) {
          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
          showRipple('left', '-10s');
        } else if (isRight) {
          videoRef.current.currentTime = Math.min(
            videoRef.current.duration || Infinity,
            videoRef.current.currentTime + 10
          );
          showRipple('right', '+10s');
        }
      }
      lastTapRef.current = { time: 0, x: 0 };
    } else {
      lastTapRef.current = { time: now, x };
    }
  };

  const showRipple = (side, text) => {
    if (rippleTimerRef.current) clearTimeout(rippleTimerRef.current);
    setTapRipple({ side, text });
    rippleTimerRef.current = setTimeout(() => {
      setTapRipple(null);
    }, 650);
  };

  // 5. Desktop keyboard hotkeys
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const vid = videoRef.current;
      if (!vid) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (vid.paused) vid.play().catch(() => {});
          else vid.pause();
          break;
        case 'arrowleft':
        case 'j':
          e.preventDefault();
          vid.currentTime = Math.max(0, vid.currentTime - 10);
          showRipple('left', '-10s');
          break;
        case 'arrowright':
        case 'l':
          e.preventDefault();
          vid.currentTime = Math.min(vid.duration || Infinity, vid.currentTime + 10);
          showRipple('right', '+10s');
          break;
        case 'f':
          e.preventDefault();
          if (containerRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            } else {
              containerRef.current.requestFullscreen?.().catch(() => {});
            }
          }
          break;
        case 'm':
          e.preventDefault();
          vid.muted = !vid.muted;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 6. Playback speed change
  const changeSpeed = (speed) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  // 7. Reload / recover stream without losing position
  const reloadStream = () => {
    setNetworkStalled(false);
    setIsBuffering(true);
    if (videoRef.current) {
      const savedTime = videoRef.current.currentTime || initialProgress;
      videoRef.current.load();
      videoRef.current.currentTime = savedTime;
      videoRef.current.play().catch(() => {});
    }
  };

  if (loading) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', minHeight: '320px', flexDirection: 'column', gap: '14px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.12)', borderTop: '3px solid #e50914', animation: 'flxSpin 0.75s linear infinite' }} />
        <p style={{ color: 'var(--text2, #a3a3a3)', fontSize: '14px', fontWeight: '500', margin: 0 }}>Starting high-speed stream…</p>
        <style>{`@keyframes flxSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', minHeight: '320px', flexDirection: 'column', gap: '16px', padding: '24px', textAlign: 'center' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p style={{ color: '#ef4444', fontSize: '15px', fontWeight: '600', margin: 0, maxWidth: '420px', lineHeight: '1.5' }}>{tokenError}</p>
        <button
          onClick={fetchToken}
          style={{ background: '#e50914', color: '#fff', border: 'none', padding: '10px 22px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          Retry Stream
        </button>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}
    >
      <video
        key={streamUrl}
        ref={videoRef}
        controls
        autoPlay
        playsInline
        poster={movie.thumbnail_url}
        onTimeUpdate={() => handleTimeUpdate(false)}
        onPause={() => handleTimeUpdate(true)}
        onEnded={() => handleTimeUpdate(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
        preload="auto"
      >
        <source src={streamUrl} type="video/mp4" />
        Your browser does not support HTML5 video streaming.
      </video>

      {/* Double Tap Ripple Indicators */}
      {tapRipple && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            transform: 'translateY(-50%)',
            left: tapRipple.side === 'left' ? '12%' : 'auto',
            right: tapRipple.side === 'right' ? '12%' : 'auto',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            borderRadius: '50px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: '700',
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'flxPop 0.3s ease-out',
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {tapRipple.side === 'left' ? '⏪' : '⏩'} {tapRipple.text}
        </div>
      )}

      {/* Buffering Indicator */}
      {isBuffering && !networkStalled && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0,0,0,0.65)',
            padding: '16px 24px',
            borderRadius: '12px',
          }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #e50914', animation: 'flxSpin 0.75s linear infinite' }} />
          <span style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>Buffering HD…</span>
        </div>
      )}

      {/* Network Stall / Connection Drop Recovery Card */}
      {networkStalled && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            zIndex: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center',
            gap: '14px',
          }}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 1l22 22" /><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55" /><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39" /><path d="M10.71 5.05A16 16 0 0 1 22.58 9" /><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <div>
            <h4 style={{ color: '#fff', margin: '0 0 6px', fontSize: '16px', fontWeight: '700' }}>Stream Connection Paused</h4>
            <p style={{ color: 'var(--text2, #a3a3a3)', margin: 0, fontSize: '13px', maxWidth: '340px', lineHeight: '1.4' }}>
              Your cellular connection momentarily paused. Tap below to resume immediately where you left off.
            </p>
          </div>
          <button
            onClick={reloadStream}
            style={{
              background: '#e50914',
              color: '#fff',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 16px rgba(229, 9, 20, 0.4)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            Resume Playback
          </button>
        </div>
      )}

      {/* Floating Speed Control (Bottom-right when hovering/active) */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          right: '16px',
          zIndex: 9,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '6px',
        }}
      >
        {showSpeedMenu && (
          <div
            style={{
              background: 'rgba(15, 15, 15, 0.95)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '8px',
              padding: '4px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 8px 24px rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {[0.75, 1, 1.25, 1.5, 2].map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                style={{
                  background: playbackSpeed === s ? '#e50914' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: playbackSpeed === s ? '700' : '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {s === 1 ? 'Normal (1x)' : `${s}x`}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
          title="Playback Speed"
          style={{
            background: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            borderRadius: '6px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '700',
            cursor: 'pointer',
            backdropFilter: 'blur(6px)',
          }}
        >
          ⚡ {playbackSpeed}x
        </button>
      </div>

      <style>{`
        @keyframes flxSpin { to { transform: rotate(360deg); } }
        @keyframes flxPop { 0% { transform: translateY(-50%) scale(0.85); opacity: 0; } 100% { transform: translateY(-50%) scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
}
