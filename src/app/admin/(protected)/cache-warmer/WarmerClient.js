'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Script from 'next/script';

// ─── Format Bytes ────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─── Video Warmer Card Component (Real DOM Video Element) ────────────────────
function VideoWarmerCard({ job, playTime, onComplete, onError }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [timer, setTimer] = useState(playTime);

  useEffect(() => {
    let isCancelled = false;
    let timerInterval = null;

    const run = async () => {
      const video = videoRef.current;
      if (!video) return;

      video.defaultMuted = true;
      video.muted = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.src = job.url;
      video.load();

      const loaded = await new Promise((res) => {
        const onCanPlay = () => res(true);
        const onErr = () => res(false);
        video.addEventListener('canplay', onCanPlay, { once: true });
        video.addEventListener('error', onErr, { once: true });
        setTimeout(() => res(false), 8000); // 8s timeout
      });

      if (isCancelled) return;

      if (loaded) {
        try {
          await video.play();
        } catch (_) {}

        let elapsed = 0;
        timerInterval = setInterval(() => {
          if (isCancelled) return;
          elapsed += 1;
          const remaining = Math.max(0, playTime - elapsed);
          setTimer(remaining);
          setProgress(Math.min(100, Math.round((elapsed / playTime) * 100)));

          if (elapsed >= playTime) {
            clearInterval(timerInterval);
            if (!isCancelled) onComplete(job.id);
          }
        }, 1000);
      } else {
        // Fallback: warm via fetch Range request to trigger Cloudflare edge cache
        try {
          await fetch(job.url, {
            headers: { Range: 'bytes=0-1048576' }, // first 1MB
            mode: 'no-cors',
          });
        } catch (_) {}
        if (!isCancelled) onComplete(job.id);
      }
    };

    run();

    return () => {
      isCancelled = true;
      if (timerInterval) clearInterval(timerInterval);
      if (videoRef.current) {
        try {
          videoRef.current.pause();
          videoRef.current.removeAttribute('src');
          videoRef.current.load();
        } catch (_) {}
      }
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch (_) {}
      }
    };
  }, [job.url, job.id, playTime, onComplete]);

  return (
    <div style={{
      background: 'rgba(0,0,0,0.5)',
      borderRadius: '8px',
      border: '1px solid rgba(255,255,255,0.1)',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
    }}>
      <video
        ref={videoRef}
        muted
        playsInline
        style={{
          width: '100%',
          height: '110px',
          objectFit: 'cover',
          borderRadius: '4px',
          background: '#000',
        }}
      />
      <div style={{
        fontSize: '11px',
        fontWeight: '600',
        color: '#fff',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }} title={job.title || job.key}>
        {job.title || job.key}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
        <span style={{ color: '#e50914', fontWeight: '700' }}>⏱️ {timer}s</span>
        <span style={{ color: 'var(--text3)' }}>{progress}%</span>
      </div>
      <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #e50914, #ff5e62)',
          transition: 'width 1s linear',
        }} />
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WarmerClient({ dbMovies = [], initialProvider = 'b2' }) {
  const [provider, setProvider] = useState(initialProvider);
  const [activeTab, setActiveTab] = useState('warmer'); // 'warmer' | 'explorer' | 'duplicates' | 'batch_uploader'

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 1: CDN VIDEO WARMER
  // ───────────────────────────────────────────────────────────────────────────
  const [warmSource, setWarmSource] = useState('db'); // 'db' | 'bucket'
  const [warmDuration, setWarmDuration] = useState(3);
  const [concurrency, setConcurrency] = useState(3);
  const [warmJobs, setWarmJobs] = useState([]);
  const [isWarming, setIsWarming] = useState(false);
  const [skipIndex, setSkipIndex] = useState('');
  const [reminderMsg, setReminderMsg] = useState(null);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  // Silent Web Audio oscillator to prevent Chromium throttling background tab
  useEffect(() => {
    let audioCtx;
    let oscillator;
    if (isWarming) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0; // Pure silence
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start();
      } catch (_) {}
    }
    return () => {
      try { oscillator?.stop(); } catch (_) {}
      try { audioCtx?.close(); } catch (_) {}
    };
  }, [isWarming]);

  // Reactive Warmer Queue Processor
  useEffect(() => {
    if (isWarming) {
      const warmingCount = warmJobs.filter(j => j.status === 'warming').length;
      if (warmingCount < concurrency) {
        const nextPending = warmJobs.find(j => j.status === 'pending');
        if (nextPending) {
          setWarmJobs(prev => prev.map(j => j.id === nextPending.id ? { ...j, status: 'warming' } : j));
        } else if (warmingCount === 0) {
          setIsWarming(false); // Finished all
        }
      }
    }
  }, [warmJobs, isWarming, concurrency]);

  const handleWarmComplete = useCallback((id) => {
    setWarmJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'done' } : j));
  }, []);

  const handleStartWarmer = async () => {
    let list = [];
    if (warmSource === 'db') {
      list = dbMovies.map((m, idx) => {
        let u = m.video_url;
        if (u.includes('<iframe')) return null;
        if (u.includes('<video') || u.includes('<source')) {
          const match = u.match(/src=["']([^"']+)['"]/);
          if (match?.[1]) u = match[1];
        }
        return {
          id: `db-${idx}`,
          title: m.title,
          key: m.title,
          url: u,
          status: 'pending',
        };
      }).filter(Boolean);
    } else {
      // Fetch bucket files
      try {
        const res = await fetch('/api/admin/storage/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider, fetchAll: true }),
        });
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          list = data.results.map((k, idx) => ({
            id: `b-${idx}`,
            title: k,
            key: k,
            url: `https://cdn.flixon.net/${encodeURIComponent(k).replace(/%2F/g, '/')}?cb=${Date.now()}`,
            status: 'pending',
          }));
        }
      } catch (err) {
        alert(`Failed to fetch bucket files: ${err.message}`);
        return;
      }
    }

    if (list.length === 0) {
      alert('No videos found to warm!');
      return;
    }

    setWarmJobs(list);
    setIsWarming(true);
  };

  const handleStopWarmer = () => {
    setIsWarming(false);
    setWarmJobs(prev => prev.map(j => j.status === 'warming' ? { ...j, status: 'pending' } : j));
  };

  const handleJumpWarmer = () => {
    const target = parseInt(skipIndex, 10);
    if (!isNaN(target) && target >= 1 && target <= warmJobs.length) {
      setWarmJobs(prev => prev.map((j, idx) => ({
        ...j,
        status: idx < target - 1 ? 'done' : 'pending',
      })));
      setIsWarming(true);
      setSkipIndex('');
    }
  };

  const handleSendTelegramReminder = async () => {
    setIsSendingReminder(true);
    setReminderMsg(null);
    try {
      const res = await fetch('/api/admin/warm-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      });
      const data = await res.json();
      if (res.ok) setReminderMsg({ ok: true, text: '✅ Telegram reminder sent!' });
      else setReminderMsg({ ok: false, text: `❌ ${data.error || 'Failed'}` });
    } catch (_) {
      setReminderMsg({ ok: false, text: '❌ Network error' });
    }
    setIsSendingReminder(false);
    setTimeout(() => setReminderMsg(null), 4000);
  };

  const warmerStats = useMemo(() => {
    let pending = 0, warming = 0, done = 0;
    warmJobs.forEach(j => {
      if (j.status === 'pending') pending++;
      else if (j.status === 'warming') warming++;
      else if (j.status === 'done') done++;
    });
    return { total: warmJobs.length, pending, warming, done };
  }, [warmJobs]);

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 2: BUCKET EXPLORER & SEARCH
  // ───────────────────────────────────────────────────────────────────────────
  const [explorerQuery, setExplorerQuery] = useState('');
  const [explorerResults, setExplorerResults] = useState(null);
  const [isSearchingBucket, setIsSearchingBucket] = useState(false);
  const [deletingKey, setDeletingKey] = useState(null);
  const [previewVideoUrl, setPreviewVideoUrl] = useState(null);

  const fetchBucketFiles = useCallback(async (q = '') => {
    setIsSearchingBucket(true);
    try {
      const res = await fetch('/api/admin/storage/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, query: q, maxLimit: 500 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExplorerResults(data);
    } catch (err) {
      alert(`Bucket search failed: ${err.message}`);
    }
    setIsSearchingBucket(false);
  }, [provider]);

  useEffect(() => {
    if (activeTab === 'explorer') {
      fetchBucketFiles(explorerQuery);
    }
  }, [activeTab, provider]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      alert(`Copied CDN URL to clipboard!\n${url}`);
    } catch (_) {}
  };

  const handleDeleteStorageFile = async (key) => {
    if (!window.confirm(`Are you absolutely sure you want to PERMANENTLY delete "${key}" from ${provider.toUpperCase()}? This cannot be undone.`)) {
      return;
    }
    setDeletingKey(key);
    try {
      const res = await fetch('/api/admin/storage/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`Successfully deleted "${key}"`);
      setExplorerResults(prev => prev ? {
        ...prev,
        results: prev.results.filter(r => r.key !== key),
        totalFound: prev.totalFound - 1,
      } : prev);
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
    setDeletingKey(null);
  };

  const handleQueueCompression = async (key) => {
    try {
      const res = await fetch('/api/compression-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoKey: key, provider }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`✅ Queued "${key}" for Squeeze VPS Compression! Check "Compress Existing" tab to monitor progress.`);
    } catch (err) {
      alert(`Compression queue error: ${err.message}`);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 3: DUPLICATE CLEANER
  // ───────────────────────────────────────────────────────────────────────────
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [duplicateScanResults, setDuplicateScanResults] = useState(null);
  const [deletedDuplicateKeys, setDeletedDuplicateKeys] = useState(new Set());

  const handleScanDuplicates = async () => {
    setIsScanningDuplicates(true);
    setDuplicateScanResults(null);
    setDeletedDuplicateKeys(new Set());
    try {
      const res = await fetch('/api/admin/storage/scan-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, threshold: 0.75 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDuplicateScanResults(data);
    } catch (err) {
      alert(`Scan failed: ${err.message}`);
    }
    setIsScanningDuplicates(false);
  };

  const handleDeleteDuplicateFile = async (key) => {
    if (!window.confirm(`Delete "${key}" to reclaim space?`)) return;
    try {
      const res = await fetch('/api/admin/storage/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, key }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDeletedDuplicateKeys(prev => new Set([...prev, key]));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // TAB 4: BATCH URL UPLOADER (DIRECT STREAMING)
  // ───────────────────────────────────────────────────────────────────────────
  const [linksText, setLinksText] = useState('');
  const [uploadQueue, setUploadQueue] = useState([]);
  const [isBatchUploading, setIsBatchUploading] = useState(false);

  // Background audio keepalive for batch upload
  useEffect(() => {
    let audioCtx;
    let oscillator;
    if (isBatchUploading) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        oscillator = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0;
        oscillator.connect(gain);
        gain.connect(audioCtx.destination);
        oscillator.start();
      } catch (_) {}
    }
    return () => {
      try { oscillator?.stop(); } catch (_) {}
      try { audioCtx?.close(); } catch (_) {}
    };
  }, [isBatchUploading]);

  // Reactive Batch Upload Processor (up to 3 parallel streams)
  useEffect(() => {
    if (isBatchUploading) {
      const uploadingCount = uploadQueue.filter(u => u.status === 'uploading').length;
      if (uploadingCount < 3) {
        const nextPending = uploadQueue.find(u => u.status === 'pending');
        if (nextPending) {
          processSingleStreamUpload(nextPending);
        } else if (uploadingCount === 0) {
          setIsBatchUploading(false);
        }
      }
    }
  }, [uploadQueue, isBatchUploading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStartBatchUpload = (e) => {
    e.preventDefault();
    if (!linksText.trim()) return;

    const lines = linksText.trim().split('\n').filter(l => l.trim().length > 0);
    const newItems = lines.map((line, idx) => {
      const parts = line.split('|').map(s => s.trim());
      return {
        id: `up-${Date.now()}-${idx}`,
        url: parts[0],
        name: parts[1] || '',
        status: 'pending',
        message: 'Pending in queue...',
        percent: 0,
        speedLabel: '',
        etaLabel: '',
      };
    });

    setUploadQueue(prev => [...prev, ...newItems]);
    setLinksText('');
    setIsBatchUploading(true);
  };

  const processSingleStreamUpload = async (item) => {
    setUploadQueue(prev => prev.map(u => u.id === item.id ? { ...u, status: 'uploading', message: 'Connecting...' } : u));

    try {
      const res = await fetch('/api/admin/storage/batch-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: item.url,
          fileName: item.name || undefined,
          provider,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let partialLine = '';
      let lastLoaded = 0;
      let lastTime = Date.now();
      let smoothedSpeed = 0;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          partialLine += decoder.decode(value, { stream: true });
          const lines = partialLine.split('\n');
          partialLine = lines.pop();

          for (const line of lines) {
            if (!line.trim()) continue;
            let data;
            try { data = JSON.parse(line); } catch (_) { continue; }

            if (data.type === 'progress') {
              const now = Date.now();
              const elapsedSec = (now - lastTime) / 1000;
              let speed = '';
              let eta = '';
              let pct = 0;

              if (elapsedSec > 0.5 && data.loaded) {
                const bytesSec = Math.max(0, (data.loaded - lastLoaded) / elapsedSec);
                smoothedSpeed = smoothedSpeed === 0 ? bytesSec : (smoothedSpeed * 0.7 + bytesSec * 0.3);
                speed = `${(smoothedSpeed / (1024 * 1024)).toFixed(2)} MB/s`;
                lastLoaded = data.loaded;
                lastTime = now;

                if (data.total && smoothedSpeed > 0) {
                  const remainingSec = (data.total - data.loaded) / smoothedSpeed;
                  eta = remainingSec > 60
                    ? `${Math.floor(remainingSec / 60)}m ${Math.floor(remainingSec % 60)}s left`
                    : `${Math.floor(remainingSec)}s left`;
                }
              }

              if (data.total && data.loaded) {
                pct = Math.min(99, Math.floor((data.loaded / data.total) * 100));
              }

              setUploadQueue(prev => prev.map(u => u.id === item.id ? {
                ...u,
                percent: pct || u.percent,
                speedLabel: speed || u.speedLabel,
                etaLabel: eta || u.etaLabel,
                message: pct >= 95 ? 'Finalizing in bucket...' : 'Streaming...',
              } : u));
            } else if (data.type === 'error') {
              throw new Error(data.error);
            } else if (data.type === 'done') {
              setUploadQueue(prev => prev.map(u => u.id === item.id ? {
                ...u,
                status: 'done',
                percent: 100,
                message: `✅ Saved as: ${data.fileName}`,
              } : u));
            }
          }
        }
      }
    } catch (err) {
      setUploadQueue(prev => prev.map(u => u.id === item.id ? {
        ...u,
        status: 'error',
        message: `❌ ${err.message}`,
      } : u));
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Top Bar: Active Provider Selector & Tabs ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '15px',
        background: 'var(--bg2)',
        padding: '12px 18px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '25px',
      }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'warmer', label: '🔥 CDN Video Warmer' },
            { id: 'explorer', label: '🔍 Bucket Explorer & Search' },
            { id: 'duplicates', label: '🧹 Duplicate Cleaner' },
            { id: 'batch_uploader', label: '📥 Batch URL Streamer' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                background: activeTab === tab.id ? 'var(--acc)' : 'rgba(255,255,255,0.06)',
                color: activeTab === tab.id ? '#fff' : 'var(--text2)',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Storage Provider Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Storage:</span>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setProvider('b2')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                background: provider === 'b2' ? '#ff3b30' : 'transparent',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>📦</span> Backblaze B2
            </button>
            <button
              onClick={() => setProvider('r2')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                border: 'none',
                background: provider === 'r2' ? '#f38020' : 'transparent',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>☁️</span> Cloudflare R2
            </button>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: CDN VIDEO WARMER CONTENT                                       */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'warmer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '25px', alignItems: 'start' }}>
          {/* Controls & Configuration */}
          <div style={{
            background: 'var(--bg2)',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚙️</span> Warmer Settings
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Source Videos</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setWarmSource('db')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    background: warmSource === 'db' ? 'var(--acc)' : 'rgba(255,255,255,0.06)',
                    color: '#fff', border: 'none', fontWeight: '600',
                  }}
                >
                  🎬 Catalog ({dbMovies.length})
                </button>
                <button
                  onClick={() => setWarmSource('bucket')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                    background: warmSource === 'bucket' ? 'var(--acc)' : 'rgba(255,255,255,0.06)',
                    color: '#fff', border: 'none', fontWeight: '600',
                  }}
                >
                  📦 {provider.toUpperCase()} Bucket
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>
                Parallel Video Tiles ({concurrency} simultaneous)
              </label>
              <input
                type="range"
                min="1"
                max="6"
                value={concurrency}
                onChange={e => setConcurrency(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>
                Play Duration per Video ({warmDuration}s)
              </label>
              <input
                type="range"
                min="2"
                max="10"
                value={warmDuration}
                onChange={e => setWarmDuration(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Jump / Skip */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Jump to Video Index</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={skipIndex}
                  onChange={e => setSkipIndex(e.target.value)}
                  style={{
                    flex: 1, padding: '7px 10px', background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border)', borderRadius: '6px', color: '#fff', fontSize: '12px'
                  }}
                />
                <button
                  onClick={handleJumpWarmer}
                  style={{
                    padding: '7px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
                  }}
                >
                  Jump
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {!isWarming ? (
                <button
                  onClick={handleStartWarmer}
                  style={{
                    padding: '12px', background: '#e50914', color: '#fff', border: 'none',
                    borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <span>🔥</span> Start CDN Warmer
                </button>
              ) : (
                <button
                  onClick={handleStopWarmer}
                  style={{
                    padding: '12px', background: '#ff9800', color: '#000', border: 'none',
                    borderRadius: '6px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  <span>⏸️</span> Pause Warmer
                </button>
              )}

              <button
                onClick={handleSendTelegramReminder}
                disabled={isSendingReminder}
                style={{
                  padding: '9px', background: 'rgba(0,136,204,0.15)', border: '1px solid #0088cc',
                  color: '#29b6f6', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                }}
              >
                {isSendingReminder ? 'Sending...' : '📢 Send Telegram Reminder'}
              </button>
              {reminderMsg && (
                <div style={{ fontSize: '11px', textAlign: 'center', color: reminderMsg.ok ? '#46b450' : '#e50914' }}>
                  {reminderMsg.text}
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Active Tiles & Progress */}
          <div>
            {/* Stats Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}>
              <div style={{ background: 'var(--bg2)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>TOTAL VIDEOS</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>{warmerStats.total}</div>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>WARMING NOW</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#ff9800', marginTop: '4px' }}>{warmerStats.warming}</div>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>WARMED & CACHED</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#46b450', marginTop: '4px' }}>{warmerStats.done}</div>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>PENDING QUEUE</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#aaa', marginTop: '4px' }}>{warmerStats.pending}</div>
              </div>
            </div>

            {/* Active Video Player Tiles */}
            {warmJobs.length === 0 ? (
              <div style={{
                background: 'var(--bg2)',
                padding: '60px 20px',
                textAlign: 'center',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔥</div>
                <h3 style={{ margin: '0 0 8px', color: '#fff' }}>CDN Video Warmer is Ready</h3>
                <p style={{ color: 'var(--text2)', maxWidth: '500px', margin: '0 auto', fontSize: '13px', lineHeight: '1.5' }}>
                  Click &quot;Start CDN Warmer&quot; on the left to spawn parallel video players. Each video is streamed through <strong>cdn.flixon.net</strong> to prime Cloudflare edge cache nodes.
                </p>
              </div>
            ) : (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: '14px', color: 'var(--text2)' }}>
                  Active Video Tiles ({warmJobs.filter(j => j.status === 'warming').length} warming)
                </h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(concurrency, 3)}, 1fr)`,
                  gap: '12px',
                  marginBottom: '20px',
                }}>
                  {warmJobs.filter(j => j.status === 'warming').map(job => (
                    <VideoWarmerCard
                      key={job.id}
                      job={job}
                      playTime={warmDuration}
                      onComplete={handleWarmComplete}
                    />
                  ))}
                </div>

                {/* Queue Summary List */}
                <div style={{ background: 'var(--bg2)', borderRadius: '8px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', color: 'var(--text3)' }}>
                    <span>UPCOMING QUEUE</span>
                    <span>{warmerStats.done} of {warmerStats.total} completed ({warmerStats.total > 0 ? Math.round((warmerStats.done / warmerStats.total) * 100) : 0}%)</span>
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {warmJobs.slice(0, 100).map((job, idx) => (
                      <div
                        key={job.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          borderRadius: '4px',
                          background: job.status === 'warming' ? 'rgba(255,152,0,0.1)' : job.status === 'done' ? 'rgba(70,180,80,0.1)' : 'rgba(0,0,0,0.2)',
                          fontSize: '12px',
                        }}
                      >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>
                          #{idx + 1} {job.title || job.key}
                        </span>
                        <span style={{
                          fontWeight: '600',
                          color: job.status === 'done' ? '#46b450' : job.status === 'warming' ? '#ff9800' : 'var(--text3)',
                        }}>
                          {job.status === 'done' ? '✅ Cached' : job.status === 'warming' ? '⚡ Warming' : '⏳ Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: BUCKET EXPLORER & SEARCH                                       */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'explorer' && (
        <div>
          {/* Search Bar */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder={`Search ${provider.toUpperCase()} bucket by filename...`}
              value={explorerQuery}
              onChange={e => setExplorerQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchBucketFiles(explorerQuery)}
              style={{
                flex: '1 1 300px',
                padding: '10px 14px',
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => fetchBucketFiles(explorerQuery)}
              disabled={isSearchingBucket}
              style={{
                padding: '10px 20px',
                background: 'var(--acc)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {isSearchingBucket ? 'Searching...' : '🔍 Search'}
            </button>
            <button
              onClick={() => { setExplorerQuery(''); fetchBucketFiles(''); }}
              style={{
                padding: '10px 16px',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Refresh
            </button>
          </div>

          {/* Results Table */}
          <div style={{ background: 'var(--bg2)', borderRadius: '8px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.08)' }}>
            {!explorerResults ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>
                {isSearchingBucket ? 'Connecting to storage bucket...' : 'Click Search or Refresh to load bucket contents.'}
              </div>
            ) : explorerResults.results.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>
                No files found in {provider.toUpperCase()} bucket.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: '12px' }}>KEY / FILE NAME</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: '12px' }}>SIZE</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: '12px' }}>LAST MODIFIED</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: '12px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {explorerResults.results.map((item) => (
                    <tr key={item.key} style={{ borderTop: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '500', wordBreak: 'break-all', maxWidth: '350px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>🎥</span>
                          <span>{item.key}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                        {formatBytes(item.size)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text3)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {item.lastModified ? new Date(item.lastModified).toLocaleDateString() : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setPreviewVideoUrl(item.url)}
                            style={{
                              padding: '5px 10px', background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                              borderRadius: '4px', fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            👁 Preview
                          </button>
                          <button
                            onClick={() => handleCopyUrl(item.url)}
                            style={{
                              padding: '5px 10px', background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.15)', color: '#fff',
                              borderRadius: '4px', fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            🔗 CDN Link
                          </button>
                          <button
                            onClick={() => handleQueueCompression(item.key)}
                            style={{
                              padding: '5px 10px', background: 'rgba(99,102,241,0.2)',
                              border: '1px solid #6366f1', color: '#818cf8',
                              borderRadius: '4px', fontSize: '11px', fontWeight: '600', cursor: 'pointer',
                            }}
                          >
                            🗜 Squeeze
                          </button>
                          <button
                            onClick={() => handleDeleteStorageFile(item.key)}
                            disabled={deletingKey === item.key}
                            style={{
                              padding: '5px 10px', background: 'rgba(229,9,20,0.15)',
                              border: '1px solid #e50914', color: '#ff6b6b',
                              borderRadius: '4px', fontSize: '11px', cursor: 'pointer',
                            }}
                          >
                            {deletingKey === item.key ? '...' : '🗑 Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: DUPLICATE CLEANER                                              */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'duplicates' && (
        <div>
          <div style={{
            background: 'var(--bg2)',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '15px',
          }}>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🧹</span> Duplicate Video Scanner & Cleaner
              </h3>
              <p style={{ margin: 0, color: 'var(--text2)', fontSize: '13px', maxWidth: '650px' }}>
                Performs Sørensen–Dice fuzzy matching across your <strong>{provider.toUpperCase()}</strong> bucket to find duplicate uploads, uncompressed vs compressed versions, and numbered copies.
              </p>
            </div>
            <button
              onClick={handleScanDuplicates}
              disabled={isScanningDuplicates}
              style={{
                padding: '12px 24px',
                background: 'var(--acc)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: isScanningDuplicates ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span>🔍</span> {isScanningDuplicates ? 'Scanning Bucket (may take ~10s)...' : 'Scan Bucket for Duplicates'}
            </button>
          </div>

          {duplicateScanResults && (
            <div>
              {/* Summary KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>SCANNED FILES</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>{duplicateScanResults.scannedCount}</div>
                </div>
                <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>DUPLICATE GROUPS</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff9800', marginTop: '4px' }}>{duplicateScanResults.groupCount}</div>
                </div>
                <div style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>RECLAIMABLE DISK SPACE</div>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#46b450', marginTop: '4px' }}>{formatBytes(duplicateScanResults.totalWastedBytes)}</div>
                </div>
              </div>

              {/* Duplicate Groups List */}
              {duplicateScanResults.groups.length === 0 ? (
                <div style={{ background: 'var(--bg2)', padding: '40px', textAlign: 'center', borderRadius: '8px', color: '#46b450' }}>
                  🎉 Awesome! No duplicate videos found in your {provider.toUpperCase()} bucket.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {duplicateScanResults.groups.map((group, gIdx) => (
                    <div
                      key={gIdx}
                      style={{
                        background: 'var(--bg2)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        padding: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
                        <div>
                          <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff', textTransform: 'capitalize' }}>
                            {group.title}
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--text3)', marginLeft: '10px' }}>
                            ({group.files.length} variants found)
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#46b450', fontWeight: '700' }}>
                          Potential savings: {formatBytes(group.potentialSavings)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {group.files.map((file, fIdx) => {
                          const isDeleted = deletedDuplicateKeys.has(file.key);
                          const isLargest = fIdx === 0;

                          return (
                            <div
                              key={file.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderRadius: '6px',
                                background: isDeleted ? 'rgba(255,255,255,0.02)' : isLargest ? 'rgba(255,152,0,0.06)' : 'rgba(70,180,80,0.06)',
                                border: `1px solid ${isDeleted ? 'transparent' : isLargest ? 'rgba(255,152,0,0.2)' : 'rgba(70,180,80,0.2)'}`,
                                opacity: isDeleted ? 0.4 : 1,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                                <span style={{ fontSize: '12px' }}>{isLargest ? '🐘 [Raw / Largest]' : '⚡ [Compressed / Smaller]'}</span>
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: '500',
                                  color: '#fff',
                                  textDecoration: isDeleted ? 'line-through' : 'none',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: '450px',
                                }}>
                                  {file.key}
                                </span>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text2)' }}>
                                  {formatBytes(file.size)}
                                </span>
                                <button
                                  onClick={() => setPreviewVideoUrl(file.url)}
                                  style={{
                                    padding: '4px 8px', background: 'rgba(255,255,255,0.08)',
                                    border: 'none', color: '#fff', borderRadius: '4px', fontSize: '11px', cursor: 'pointer',
                                  }}
                                >
                                  Preview
                                </button>
                                {!isDeleted ? (
                                  <button
                                    onClick={() => handleDeleteDuplicateFile(file.key)}
                                    style={{
                                      padding: '4px 10px', background: 'rgba(229,9,20,0.2)',
                                      border: '1px solid #e50914', color: '#ff6b6b', borderRadius: '4px', fontSize: '11px', cursor: 'pointer',
                                    }}
                                  >
                                    Delete This Copy
                                  </button>
                                ) : (
                                  <span style={{ fontSize: '11px', color: '#46b450' }}>Deleted ✓</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: BATCH URL UPLOADER (DIRECT STREAMING)                          */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {activeTab === 'batch_uploader' && (
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '25px', alignItems: 'start' }}>
          {/* Input Panel */}
          <div style={{
            background: 'var(--bg2)',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📥</span> Batch URL Streamer
            </h3>
            <p style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: '1.5', margin: '0 0 14px' }}>
              Paste video URLs to stream straight into <strong>{provider.toUpperCase()}</strong> from the server without consuming your local internet bandwidth!
            </p>

            <form onSubmit={handleStartBatchUpload}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>
                Video Links (Format: URL | CustomName.mp4)
              </label>
              <textarea
                rows={8}
                placeholder={`https://example.com/movie1.mp4 | Inception.mp4\nhttps://example.com/movie2.mp4 | Interstellar.mp4`}
                value={linksText}
                onChange={e => setLinksText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '12px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                  marginBottom: '15px',
                }}
              />

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'var(--acc)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                🚀 Start Batch Streaming Upload
              </button>
            </form>
          </div>

          {/* Upload Queue Progress */}
          <div>
            <div style={{
              background: 'var(--bg2)',
              padding: '16px 20px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.08)',
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff' }}>
                Upload Queue ({uploadQueue.length} items)
              </span>
              <span style={{ fontSize: '12px', color: isBatchUploading ? '#ff9800' : '#46b450' }}>
                {isBatchUploading ? '⚡ Streaming active' : 'Idle'}
              </span>
            </div>

            {uploadQueue.length === 0 ? (
              <div style={{ background: 'var(--bg2)', padding: '50px', textAlign: 'center', borderRadius: '8px', color: 'var(--text3)' }}>
                No batch uploads queued. Paste links on the left to start.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {uploadQueue.map(item => (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--bg2)',
                      padding: '14px 18px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '350px' }}>
                        {item.name || item.url}
                      </span>
                      <div style={{ display: 'flex', gap: '10px', fontSize: '12px' }}>
                        {item.speedLabel && <span style={{ color: '#818cf8', fontWeight: '600' }}>{item.speedLabel}</span>}
                        {item.etaLabel && <span style={{ color: 'var(--text3)' }}>{item.etaLabel}</span>}
                        <span style={{
                          fontWeight: '700',
                          color: item.status === 'done' ? '#46b450' : item.status === 'error' ? '#e50914' : '#ff9800',
                        }}>
                          {item.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '6px' }}>
                      <div style={{
                        width: `${item.percent}%`,
                        height: '100%',
                        background: item.status === 'done' ? '#46b450' : item.status === 'error' ? '#e50914' : 'linear-gradient(90deg, #6366f1, #818cf8)',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      {item.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────────── */}
      {/* VIDEO PREVIEW MODAL                                                   */}
      {/* ───────────────────────────────────────────────────────────────────── */}
      {previewVideoUrl && (
        <div
          onClick={() => setPreviewVideoUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#111',
              padding: '20px',
              borderRadius: '12px',
              maxWidth: '800px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, fontSize: '16px', color: '#fff' }}>Video Playback Preview</h4>
              <button
                onClick={() => setPreviewVideoUrl(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <video
              src={previewVideoUrl}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '480px', borderRadius: '8px', background: '#000' }}
            />
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text2)', wordBreak: 'break-all' }}>
              <strong>CDN URL:</strong> <a href={previewVideoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--acc)' }}>{previewVideoUrl}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
