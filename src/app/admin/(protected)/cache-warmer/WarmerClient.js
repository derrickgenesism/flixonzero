'use client';

import { useState, useEffect, useRef } from 'react';
import Script from 'next/script';

export default function WarmerClient({ dbMovies }) {
  const [warmDuration, setWarmDuration] = useState(10);
  const [concurrency, setConcurrency] = useState(5);
  
  const [queue, setQueue] = useState([]);
  const [isWarming, setIsWarming] = useState(false);
  const [hlsLoaded, setHlsLoaded] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, pending: 0, warming: 0, done: 0, error: 0 });

  // Refs for tracking queue state within effects
  const queueRef = useRef([]);
  const activeWorkers = useRef(0);
  const isWarmingRef = useRef(false);

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

  const handleStartAll = () => {
    if (!hlsLoaded) {
      alert('Video player library is still loading. Please wait a second.');
      return;
    }
    const newQueue = dbMovies.map(m => ({
      id: Math.random().toString(36).substring(7),
      title: m.title,
      url: m.video_url,
      status: 'pending',
      playerNode: null
    }));
    setQueue(newQueue);
    queueRef.current = newQueue; // Update ref immediately so workers see it
    setIsWarming(true);
    isWarmingRef.current = true;
    activeWorkers.current = 0;
    
    // Kick off workers
    for (let i = 0; i < concurrency; i++) {
      processNext();
    }
  };

  const handleStop = () => {
    setIsWarming(false);
    isWarmingRef.current = false;
    // Clean up active videos
    setQueue(prev => prev.map(q => {
      if (q.status === 'warming') {
        if (q.hlsInstance) q.hlsInstance.destroy();
        return { ...q, status: 'pending', hlsInstance: null };
      }
      return q;
    }));
    activeWorkers.current = 0;
  };

  const processNext = async () => {
    if (!isWarmingRef.current) return;
    
    // Find next pending
    const currentQueue = queueRef.current;
    const nextIdx = currentQueue.findIndex(q => q.status === 'pending');
    
    if (nextIdx === -1) {
      // Nothing left to process
      return;
    }

    // Mark as warming
    const item = currentQueue[nextIdx];
    
    setQueue(prev => {
      const copy = [...prev];
      copy[nextIdx] = { ...copy[nextIdx], status: 'warming' };
      return copy;
    });

    try {
      await warmVideo(item.url);
      // Mark as done
      setQueue(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(q => q.id === item.id);
        if (idx !== -1) copy[idx] = { ...copy[idx], status: 'done' };
        return copy;
      });
    } catch (err) {
      // Mark as error
      setQueue(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(q => q.id === item.id);
        if (idx !== -1) copy[idx] = { ...copy[idx], status: 'error' };
        return copy;
      });
    }

    // Process next
    if (isWarmingRef.current) {
      processNext();
    }
  };

  const warmVideo = (url) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.autoplay = true;

      let hls = null;
      let timeoutId = null;

      const cleanup = () => {
        clearTimeout(timeoutId);
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (hls) {
          hls.destroy();
        }
        video.remove();
      };

      const finishWarming = () => {
        cleanup();
        resolve();
      };

      if (window.Hls && window.Hls.isSupported() && url.includes('.m3u8')) {
        hls = new window.Hls({
          autoStartLoad: true,
          startPosition: -1,
          capLevelToPlayerSize: true, // limit quality to save bandwidth
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => {
            // Ignore play errors (e.g. autoplay blocked), the segments will still be loaded by Hls.js
          });
          timeoutId = setTimeout(finishWarming, warmDuration * 1000);
        });

        hls.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            cleanup();
            reject(new Error('HLS Error'));
          }
        });
      } else {
        // Fallback for native Safari or direct MP4/MKV URLs
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
          timeoutId = setTimeout(finishWarming, warmDuration * 1000);
        });
        video.addEventListener('error', () => {
          // The browser might not support the format (e.g. MKV), causing an error.
          // However, assigning the src already triggered a network request to the CDN!
          // We just wait the duration and consider it warmed.
          timeoutId = setTimeout(finishWarming, warmDuration * 1000);
        });
      }
    });
  };

  return (
    <div>
      <Script 
        src="https://cdn.jsdelivr.net/npm/hls.js@latest" 
        onLoad={() => setHlsLoaded(true)}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '40px' }}>
        {/* Settings Panel */}
        <div style={{ background: 'var(--bg2)', padding: '25px', borderRadius: '12px', height: 'fit-content' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 20px', color: '#fff' }}>Warmer Settings</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
              Duration per Video (seconds)
            </label>
            <input 
              type="number" 
              value={warmDuration} 
              onChange={e => setWarmDuration(parseInt(e.target.value) || 1)}
              min="1"
              max="60"
              disabled={isWarming}
              className="gms-input"
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>
              Concurrency (Simultaneous videos)
            </label>
            <input 
              type="number" 
              value={concurrency} 
              onChange={e => setConcurrency(parseInt(e.target.value) || 1)}
              min="1"
              max="20"
              disabled={isWarming}
              className="gms-input"
              style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>

          <button 
            onClick={isWarming ? handleStop : handleStartAll}
            className="gms-btn gms-btn--primary"
            style={{ 
              width: '100%', 
              padding: '12px', 
              fontSize: '15px', 
              fontWeight: 'bold',
              background: isWarming ? 'var(--bg)' : 'var(--acc)',
              color: '#fff',
              border: isWarming ? '1px solid rgba(255,255,255,0.2)' : 'none'
            }}
          >
            {isWarming ? 'Stop Warming' : `Warm All Database Movies (${dbMovies.length})`}
          </button>
        </div>

        {/* Dashboard */}
        <div>
          {/* Stats Bar */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1px' }}>Pending</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>{stats.pending}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(229, 9, 20, 0.1)', border: '1px solid rgba(229, 9, 20, 0.2)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#e50914', textTransform: 'uppercase', letterSpacing: '1px' }}>Warming Now</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>{stats.warming}</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(0, 200, 83, 0.1)', border: '1px solid rgba(0, 200, 83, 0.2)', padding: '15px', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', color: '#00c853', textTransform: 'uppercase', letterSpacing: '1px' }}>Completed</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>{stats.done}</div>
            </div>
          </div>

          {/* Progress Bar */}
          {stats.total > 0 && (
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', marginBottom: '25px' }}>
              <div style={{ 
                width: `${(stats.done / stats.total) * 100}%`, 
                height: '100%', 
                background: 'var(--acc)',
                transition: 'width 0.3s ease'
              }} />
            </div>
          )}

          {/* Log / Active List */}
          <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', fontWeight: '600', color: 'var(--text2)' }}>
              CURRENT QUEUE
            </div>
            
            {queue.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
                Click "Warm All Database Movies" to begin.
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {queue.map((q, idx) => (
                  <div key={q.id} style={{ 
                    padding: '12px 20px', 
                    borderBottom: '1px solid rgba(255,255,255,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: q.status === 'warming' ? 'rgba(255,255,255,0.03)' : 'transparent'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <span style={{ color: 'var(--text3)', fontSize: '12px', width: '30px' }}>{idx + 1}.</span>
                      <span style={{ color: q.status === 'warming' ? '#fff' : 'var(--text2)', fontWeight: q.status === 'warming' ? '600' : 'normal' }}>
                        {q.title}
                      </span>
                    </div>
                    <div>
                      {q.status === 'pending' && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Pending...</span>}
                      {q.status === 'warming' && <span style={{ fontSize: '11px', color: '#e50914', fontWeight: 'bold' }}>🔥 Warming</span>}
                      {q.status === 'done' && <span style={{ fontSize: '11px', color: '#00c853', fontWeight: 'bold' }}>✓ Done</span>}
                      {q.status === 'error' && <span style={{ fontSize: '11px', color: '#ff5252', fontWeight: 'bold' }}>Error</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
