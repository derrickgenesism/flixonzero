'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

export default function WarmerClient({ dbMovies }) {
  const [warmDuration, setWarmDuration] = useState(10);
  const [concurrency, setConcurrency] = useState(3);

  const [queue, setQueue] = useState([]);
  const [isWarming, setIsWarming] = useState(false);
  const [hlsLoaded, setHlsLoaded] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, warming: 0, done: 0, error: 0 });

  // Telegram reminder state
  const [reminderSending, setReminderSending] = useState(false);
  const [reminderMsg, setReminderMsg] = useState(null);

  // Refs — avoids stale closure bugs
  const queueRef = useRef([]);
  const activeWorkers = useRef(0);
  const isWarmingRef = useRef(false);
  const warmDurationRef = useRef(warmDuration);

  // Keep warmDurationRef in sync
  useEffect(() => {
    warmDurationRef.current = warmDuration;
  }, [warmDuration]);

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

  // ─── Queue helpers ────────────────────────────────────────────────────────

  const markStatus = useCallback((id, status, extra = {}) => {
    setQueue(prev => prev.map(q => q.id === id ? { ...q, status, ...extra } : q));
  }, []);

  // ─── Core warming logic ───────────────────────────────────────────────────

  const warmVideo = useCallback((url, videoElRef) => {
    return new Promise((resolve, reject) => {
      const video = videoElRef.current;
      if (!video) return reject(new Error('No video element'));

      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      let hls = null;
      let fallbackTimeoutId = null;
      let settled = false;

      const duration = warmDurationRef.current;
      const MAX_WAIT_TIME = Math.max(120000, (duration + 60) * 1000); // Max wait for buffering

      const checkProgress = () => {
        if (!settled && video.currentTime >= duration) {
          finish(null);
        }
      };

      const onEnded = () => {
        if (!settled) finish(null);
      };

      const cleanup = () => {
        clearTimeout(fallbackTimeoutId);
        video.removeEventListener('timeupdate', checkProgress);
        video.removeEventListener('ended', onEnded);
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (hls) hls.destroy();
      };

      const finish = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        if (err) reject(err); else resolve();
      };

      // Fallback timeout to prevent hanging forever if it never plays or buffers endlessly
      fallbackTimeoutId = setTimeout(() => {
        if (!settled) finish(new Error('Timed out waiting for video to play or buffer'));
      }, MAX_WAIT_TIME);

      video.addEventListener('timeupdate', checkProgress);
      video.addEventListener('ended', onEnded);

      const handlePlayError = (e) => {
        if (e.name === 'NotAllowedError') {
          finish(new Error('Autoplay blocked. User interaction required.'));
        }
      };

      if (window.Hls && window.Hls.isSupported() && url.includes('.m3u8')) {
        hls = new window.Hls({
          autoStartLoad: true,
          startPosition: -1,
          capLevelToPlayerSize: true,
          maxBufferLength: Math.max(10, duration + 5),
        });
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
        // Native or MP4/MKV fallback
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(handlePlayError);
        }, { once: true });
        video.addEventListener('error', () => {
          // If the browser can't decode the video (e.g., MKV format), it throws an error immediately.
          // However, assigning src still makes a network request to the CDN, warming the cache.
          // Since it can't play, we can't use timeupdate. We simulate the wait using a timeout.
          setTimeout(() => {
            if (!settled) finish(null);
          }, duration * 1000);
        }, { once: true });
      }
    });
  }, []);

  // processNext uses a stable ref to avoid exhausting workers
  const processNextRef = useRef(null);
  processNextRef.current = async () => {
    if (!isWarmingRef.current) return;

    // Find next pending item
    const currentQueue = queueRef.current;
    const nextIdx = currentQueue.findIndex(q => q.status === 'pending');
    if (nextIdx === -1) {
      activeWorkers.current--;
      return; // All done or nothing left for this worker
    }

    const item = currentQueue[nextIdx];
    const videoElRef = { current: item.videoEl };

    // Mark warming
    setQueue(prev => prev.map((q, i) => i === nextIdx ? { ...q, status: 'warming' } : q));
    // Also update ref immediately
    queueRef.current = queueRef.current.map((q, i) =>
      i === nextIdx ? { ...q, status: 'warming' } : q
    );

    try {
      await warmVideo(item.url, videoElRef);
      markStatus(item.id, 'done');
      // Update ref
      queueRef.current = queueRef.current.map(q => q.id === item.id ? { ...q, status: 'done' } : q);
    } catch (err) {
      const msg = err?.message || 'Error';
      markStatus(item.id, 'error', { errorMsg: msg });
      queueRef.current = queueRef.current.map(q =>
        q.id === item.id ? { ...q, status: 'error', errorMsg: msg } : q
      );
    }

    // This worker picks up the next job
    if (isWarmingRef.current) {
      processNextRef.current();
    } else {
      activeWorkers.current--;
    }
  };

  // ─── Controls ────────────────────────────────────────────────────────────

  const handleStartAll = () => {
    if (!hlsLoaded) {
      alert('Video player library is still loading. Please wait a moment.');
      return;
    }
    const newQueue = dbMovies.map(m => {
      const videoEl = document.createElement('video');
      videoEl.muted = true;
      videoEl.defaultMuted = true;
      videoEl.setAttribute('muted', '');
      videoEl.playsInline = true;
      videoEl.setAttribute('playsinline', '');
      videoEl.controls = true; // Show controls so you can see the scrubber move
      videoEl.style.width = '100%';
      videoEl.style.height = '100%';
      videoEl.style.objectFit = 'cover';
      videoEl.style.borderRadius = '4px';
      videoEl.style.background = '#000';
      return {
        id: Math.random().toString(36).substring(7),
        title: m.title,
        url: m.video_url,
        status: 'pending',
        videoEl,
        errorMsg: null,
      };
    });

    setQueue(newQueue);
    queueRef.current = newQueue;
    setIsWarming(true);
    isWarmingRef.current = true;
    activeWorkers.current = 0;

    // Spawn workers up to concurrency limit
    const slots = Math.min(concurrency, newQueue.length);
    for (let i = 0; i < slots; i++) {
      activeWorkers.current++;
      processNextRef.current();
    }
  };

  const handleStop = () => {
    setIsWarming(false);
    isWarmingRef.current = false;
    activeWorkers.current = 0;
    // Reset warming items back to pending
    setQueue(prev => prev.map(q => {
      if (q.status === 'warming') {
        if (q.videoEl) {
          q.videoEl.pause();
          q.videoEl.removeAttribute('src');
          q.videoEl.load();
        }
        return { ...q, status: 'pending' };
      }
      return q;
    }));
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

  // ─── Video player refs for React rendering ────────────────────────────────

  // We use a callback ref to mount the video element into the DOM node
  const VideoPreview = ({ videoEl }) => {
    const containerRef = useRef(null);
    useEffect(() => {
      const container = containerRef.current;
      if (container && videoEl && !container.contains(videoEl)) {
        container.appendChild(videoEl);
      }
      return () => {
        if (container && container.contains(videoEl)) {
          container.removeChild(videoEl);
        }
      };
    }, [videoEl]);
    return (
      <div
        ref={containerRef}
        style={{
          width: '160px',
          minWidth: '160px',
          height: '90px',
          background: '#000',
          borderRadius: '6px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      />
    );
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
                <div>Click "Warm All Videos" to begin.</div>
                <div style={{ fontSize: '12px', marginTop: '6px', opacity: 0.6 }}>{dbMovies.length} videos in database</div>
              </div>
            ) : (
              <div style={{ maxHeight: '520px', overflowY: 'auto' }}>
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

                    {/* Mini Video Player — only render when warming */}
                    {q.status === 'warming' && q.videoEl ? (
                      <VideoPreview videoEl={q.videoEl} />
                    ) : (
                      <div style={{
                        width: '160px',
                        minWidth: '160px',
                        height: '90px',
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
                        fontSize: '20px',
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
                        color: q.status === 'warming' ? '#fff' : q.status === 'done' ? 'var(--text2)' : 'var(--text2)',
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
