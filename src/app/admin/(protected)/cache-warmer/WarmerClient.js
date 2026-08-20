'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

// ─── Individual warming player ──────────────────────────────────────────────
// This component renders a REAL <video> element in the DOM, and only starts
// warming after the element is mounted. This guarantees the browser can play it.
function WarmingPlayer({ url, duration, onDone, onError }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const settledRef = useRef(false);
  const fallbackTimerRef = useRef(null);
  const [playTime, setPlayTime] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || settledRef.current) return;

    // Strictly enforce muted attributes to satisfy strict browser autoplay policies
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    const MAX_WAIT = Math.max(120000, (duration + 60) * 1000);

    const finish = (err) => {
      if (settledRef.current) return;
      settledRef.current = true;
      clearTimeout(fallbackTimerRef.current);
      video.pause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (err) onError(err.message || 'Error');
      else onDone();
    };

    const handlePlayError = (e) => {
      if (e.name === 'NotAllowedError') {
        finish(new Error('Autoplay blocked by browser'));
      } else {
        console.warn('Play error:', e);
      }
    };

    const onTimeUpdate = () => {
      if (settledRef.current) return;
      setPlayTime(Math.floor(video.currentTime));
      if (video.currentTime >= duration) {
        finish(null);
      }
    };

    const onEnded = () => {
      if (!settledRef.current) finish(null);
    };

    const onNativeError = () => {
      if (!settledRef.current) {
        setTimeout(() => {
          if (!settledRef.current) finish(null);
        }, duration * 1000);
      }
    };

    fallbackTimerRef.current = setTimeout(() => {
      if (!settledRef.current) finish(new Error('Timed out waiting for video to play'));
    }, MAX_WAIT);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onNativeError);

    if (window.Hls && window.Hls.isSupported() && url.includes('.m3u8')) {
      const hls = new window.Hls({
        autoStartLoad: true,
        startPosition: -1,
        capLevelToPlayerSize: true,
        maxBufferLength: Math.max(10, duration + 5),
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(handlePlayError);
      });

      hls.on(window.Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          finish(new Error(`HLS ${data.type}: ${data.details}`));
        }
      });
    } else {
      video.src = url;
      video.load();
      video.addEventListener('loadeddata', () => {
        video.play().catch(handlePlayError);
      }, { once: true });
    }

    return () => {
      // Cleanup on unmount
      clearTimeout(fallbackTimerRef.current);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onNativeError);
      video.pause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  return (
    <div style={{ position: 'relative', width: '220px', minWidth: '220px', height: '130px', flexShrink: 0 }}>
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        controls
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '6px',
          background: '#000',
          border: '1px solid rgba(255,255,255,0.15)',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '28px',
        left: '4px',
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        fontSize: '10px',
        padding: '2px 6px',
        borderRadius: '4px',
        fontFamily: 'monospace',
      }}>
        {playTime}s / {duration}s
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function WarmerClient({ dbMovies }) {
  const [warmDuration, setWarmDuration] = useState(5);
  const [concurrency, setConcurrency] = useState(3);

  const [queue, setQueue] = useState([]);
  const [isWarming, setIsWarming] = useState(false);
  const [hlsLoaded, setHlsLoaded] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, warming: 0, done: 0, error: 0 });

  // Telegram reminder state
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderMsg, setReminderMsg] = useState(null);

  // Refs
  const queueRef = useRef([]);
  const isWarmingRef = useRef(false);
  const warmDurationRef = useRef(warmDuration);

  useEffect(() => { warmDurationRef.current = warmDuration; }, [warmDuration]);

  // Sync queue to ref and recompute stats
  useEffect(() => {
    queueRef.current = queue;
    let p = 0, w = 0, d = 0, e = 0;
    queue.forEach(item => {
      if (item.status === 'pending') p++;
      else if (item.status === 'warming') w++;
      else if (item.status === 'done') d++;
      else if (item.status === 'error') e++;
    });
    setStats({ total: queue.length, pending: p, warming: w, done: d, error: e });
  }, [queue]);

  // ─── Auto-advance: when a warming item finishes, pick up the next pending ──

  const promoteNext = useCallback(() => {
    setQueue(prev => {
      const warmingCount = prev.filter(q => q.status === 'warming').length;
      if (warmingCount >= concurrency) return prev; // already at capacity

      const nextIdx = prev.findIndex(q => q.status === 'pending');
      if (nextIdx === -1) return prev; // nothing left

      const copy = [...prev];
      copy[nextIdx] = { ...copy[nextIdx], status: 'warming' };
      return copy;
    });
  }, [concurrency]);

  const handleItemDone = useCallback((id) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'done' } : q));
    // Use setTimeout to allow React state to settle before promoting next
    setTimeout(() => promoteNext(), 50);
  }, [promoteNext]);

  const handleItemError = useCallback((id, errorMsg) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status: 'error', errorMsg } : q));
    setTimeout(() => promoteNext(), 50);
  }, [promoteNext]);

  // ─── Controls ──────────────────────────────────────────────────────────────

  const handleStartAll = () => {
    if (!hlsLoaded) {
      alert('Video player library is still loading. Please wait a moment.');
      return;
    }
    const newQueue = dbMovies.map((m, i) => {
      let actualUrl = m.video_url;
      if (actualUrl && actualUrl.includes('<iframe')) {
        return null; // Skip iframes (e.g. YouTube embeds)
      } else if (actualUrl && (actualUrl.includes('<video') || actualUrl.includes('<source'))) {
        const match = actualUrl.match(/src=["']([^"']+)['"]/);
        if (match?.[1]) actualUrl = match[1];
      }

      return {
        id: `v-${i}-${Date.now()}`,
        title: m.title,
        url: actualUrl,
        status: 'pending',
        errorMsg: null,
      };
    }).filter(Boolean); // Remove nulls (iframes)

    // Mark the first N as warming
    const initializedQueue = newQueue.map((q, i) => ({
      ...q,
      status: i < concurrency ? 'warming' : 'pending'
    }));

    setQueue(initializedQueue);
    queueRef.current = initializedQueue;
    setIsWarming(true);
    isWarmingRef.current = true;
  };

  const handleStop = () => {
    setIsWarming(false);
    isWarmingRef.current = false;
    setQueue(prev => prev.map(q =>
      q.status === 'warming' ? { ...q, status: 'pending' } : q
    ));
  };

  // ─── Telegram reminder ────────────────────────────────────────────────────

  const handleSendReminder = async () => {
    setReminderSending(true);
    setReminderMsg(null);
    try {
      const res = await fetch('/api/admin/warm-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      });
      const json = await res.json();
      if (res.ok) {
        setReminderMsg({ ok: true, text: '✅ Reminder sent to Telegram!' });
      } else {
        setReminderMsg({ ok: false, text: `❌ ${json.error || 'Failed to send'}` });
      }
    } catch {
      setReminderMsg({ ok: false, text: '❌ Network error' });
    }
    setReminderSending(false);
    setTimeout(() => setReminderMsg(null), 5000);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  const allDone = stats.total > 0 && stats.pending === 0 && stats.warming === 0;

  return (
    <div>
      <Script
        src="https://cdn.jsdelivr.net/npm/hls.js@latest"
        onLoad={() => setHlsLoaded(true)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '30px' }}>

        {/* ── Settings Panel ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'var(--bg2)', padding: '25px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 20px', color: '#fff' }}>⚙️ Warmer Settings</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                Duration per Video (seconds)
              </label>
              <input
                type="number"
                value={warmDuration}
                onChange={e => setWarmDuration(parseInt(e.target.value) || 1)}
                min="1"
                max="60"
                disabled={isWarming}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                Simultaneous Videos
              </label>
              <input
                type="number"
                value={concurrency}
                onChange={e => setConcurrency(parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                disabled={isWarming}
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '5px' }}>Keep ≤ 5 to avoid browser throttling</div>
            </div>

            <button
              onClick={isWarming ? handleStop : handleStartAll}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 'bold',
                background: isWarming ? 'rgba(255,82,82,0.15)' : 'var(--acc)',
                color: isWarming ? '#ff5252' : '#fff',
                border: isWarming ? '1px solid rgba(255,82,82,0.4)' : 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              {isWarming
                ? '⏹ Stop Warming'
                : `🔥 Warm All ${dbMovies.length} Videos`}
            </button>

            {allDone && (
              <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: '8px', fontSize: '13px', color: '#00c853', textAlign: 'center' }}>
                ✅ All videos warmed!
              </div>
            )}
          </div>

          {/* Telegram Reminder Panel */}
          <div style={{ background: 'var(--bg2)', padding: '25px', borderRadius: '12px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 8px', color: '#fff' }}>📬 Daily Reminder</h2>
            <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 16px', lineHeight: '1.5' }}>
              Your Telegram bot sends a warm-up reminder every day at <strong style={{ color: 'var(--text2)' }}>12:00 PM EAT</strong> automatically.
            </p>
            <button
              onClick={handleSendReminder}
              disabled={reminderSending}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '13px',
                fontWeight: '600',
                background: 'rgba(255,255,255,0.05)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '8px',
                cursor: reminderSending ? 'not-allowed' : 'pointer',
                opacity: reminderSending ? 0.6 : 1,
              }}
            >
              {reminderSending ? 'Sending...' : '📨 Send Reminder Now (Test)'}
            </button>
            {reminderMsg && (
              <div style={{
                marginTop: '10px',
                fontSize: '12px',
                color: reminderMsg.ok ? '#00c853' : '#ff5252',
                textAlign: 'center',
              }}>
                {reminderMsg.text}
              </div>
            )}
          </div>
        </div>

        {/* ── Dashboard ── */}
        <div>
          {/* Stats Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Pending', value: stats.pending, color: 'rgba(255,255,255,0.6)', bg: 'rgba(255,255,255,0.03)', border: 'rgba(255,255,255,0.07)' },
              { label: 'Warming', value: stats.warming, color: '#e50914', bg: 'rgba(229,9,20,0.08)', border: 'rgba(229,9,20,0.2)' },
              { label: 'Done', value: stats.done, color: '#00c853', bg: 'rgba(0,200,83,0.08)', border: 'rgba(0,200,83,0.2)' },
              { label: 'Errors', value: stats.error, color: '#ff9800', bg: 'rgba(255,152,0,0.08)', border: 'rgba(255,152,0,0.2)' },
            ].map(s => (
              <div key={s.label} style={{ background: s.bg, border: `1px solid ${s.border}`, padding: '14px 16px', borderRadius: '10px' }}>
                <div style={{ fontSize: '10px', color: s.color, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8 }}>{s.label}</div>
                <div style={{ fontSize: '26px', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          {stats.total > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>
                <span>{stats.done} / {stats.total} warmed</span>
                <span>{Math.round((stats.done / stats.total) * 100)}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                  width: `${(stats.done / stats.total) * 100}%`,
                  height: '100%',
                  background: 'var(--acc)',
                  transition: 'width 0.4s ease',
                  borderRadius: '3px',
                }} />
              </div>
            </div>
          )}

          {/* Queue List */}
          <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: '700', color: 'var(--text2)', letterSpacing: '1px' }}>
              VIDEO QUEUE
            </div>

            {queue.length === 0 ? (
              <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text3)' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎬</div>
                <div>Click &quot;Warm All Videos&quot; to begin.</div>
                <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>{dbMovies.length} videos in database</div>
              </div>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {queue.map((q, idx) => (
                  <div
                    key={q.id}
                    style={{
                      padding: '12px 20px',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      background: q.status === 'warming' ? 'rgba(229,9,20,0.04)' : 'transparent',
                      transition: 'background 0.3s',
                    }}
                  >
                    {/* Index */}
                    <span style={{ color: 'var(--text3)', fontSize: '11px', width: '28px', flexShrink: 0, textAlign: 'right' }}>
                      {idx + 1}.
                    </span>

                    {/* Video player — rendered as a REAL <video> in the DOM */}
                    {q.status === 'warming' ? (
                      <WarmingPlayer
                        key={q.id + '-player'}
                        url={q.url}
                        duration={warmDuration}
                        onDone={() => handleItemDone(q.id)}
                        onError={(msg) => handleItemError(q.id, msg)}
                      />
                    ) : (
                      <div style={{
                        width: '220px',
                        minWidth: '220px',
                        height: '130px',
                        background: q.status === 'done'
                          ? 'rgba(0,200,83,0.08)'
                          : q.status === 'error'
                          ? 'rgba(255,82,82,0.08)'
                          : 'rgba(255,255,255,0.03)',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.07)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                        flexShrink: 0,
                      }}>
                        {q.status === 'done' && '✅'}
                        {q.status === 'error' && '⚠️'}
                        {q.status === 'pending' && '⏳'}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: q.status === 'warming' ? '600' : 'normal',
                        color: q.status === 'warming' ? '#fff' : 'var(--text2)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {q.title}
                      </div>
                      {q.status === 'error' && q.errorMsg && (
                        <div style={{ fontSize: '10px', color: '#ff9800', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {q.errorMsg}
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <div style={{ flexShrink: 0 }}>
                      {q.status === 'pending' && (
                        <span style={{ fontSize: '11px', color: 'var(--text3)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '20px' }}>Pending</span>
                      )}
                      {q.status === 'warming' && (
                        <span style={{ fontSize: '11px', color: '#e50914', fontWeight: 'bold', background: 'rgba(229,9,20,0.1)', padding: '3px 8px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ animation: 'pulse 1s ease-in-out infinite' }}>🔥</span> Live
                        </span>
                      )}
                      {q.status === 'done' && (
                        <span style={{ fontSize: '11px', color: '#00c853', fontWeight: 'bold', background: 'rgba(0,200,83,0.1)', padding: '3px 8px', borderRadius: '20px' }}>✓ Warmed</span>
                      )}
                      {q.status === 'error' && (
                        <span style={{ fontSize: '11px', color: '#ff9800', fontWeight: 'bold', background: 'rgba(255,152,0,0.1)', padding: '3px 8px', borderRadius: '20px' }}>⚠ Failed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
