'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { queueExistingJob } from './actions';

const PAGE_SIZE = 50;

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function StatusBadge({ status, progress }) {
  const styles = {
    pending:    { bg: 'rgba(255,183,0,0.1)',    border: '#ffb700', color: '#ffb700',  label: '⏳ Pending' },
    processing: { bg: 'rgba(99,102,241,0.1)',   border: '#6366f1', color: '#818cf8',  label: '⚡ Processing' },
    completed:  { bg: 'rgba(70,180,80,0.1)',    border: '#46b450', color: '#46b450',  label: '✅ Done' },
    failed:     { bg: 'rgba(229,9,20,0.1)',     border: '#e50914', color: '#e50914',  label: '❌ Failed' },
    cancelled:  { bg: 'rgba(150,150,150,0.1)',  border: '#888',    color: '#aaa',      label: '🚫 Cancelled' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap'
    }}>
      {status === 'processing' ? `⚡ ${progress || 0}%` : s.label}
    </span>
  );
}

function ProgressBar({ progress, status }) {
  if (status === 'pending') return <span style={{ color: 'var(--text3)', fontSize: '13px' }}>Waiting for VPS worker...</span>;
  if (status === 'completed') return <span style={{ color: '#46b450', fontSize: '13px' }}>Compression complete!</span>;
  if (status === 'failed' || status === 'cancelled') return null;
  
  const pct = progress || 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '160px' }}>
      <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%',
          background: 'linear-gradient(90deg, #6366f1, #818cf8)',
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: '12px', color: 'var(--text2)', minWidth: '32px' }}>{pct}%</span>
    </div>
  );
}

export default function ExistingClient({ initialVideos = [], currentProvider = 'b2', bucketName = '' }) {
  const [videos] = useState(initialVideos || []);
  const [jobs, setJobs] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Direct remote URL queueing state
  const [remoteUrl, setRemoteUrl] = useState('');
  const [remoteName, setRemoteName] = useState('');
  const [isQueueingRemote, setIsQueueingRemote] = useState(false);

  const sortedVideos = useMemo(() => {
    let list = [...videos];
    if (search.trim()) {
      list = list.filter(v => (v.key || '').toLowerCase().includes(search.toLowerCase()));
    }
    switch (sortBy) {
      case 'largest':  list.sort((a, b) => (b.size || 0) - (a.size || 0)); break;
      case 'smallest': list.sort((a, b) => (a.size || 0) - (b.size || 0)); break;
      case 'newest':   list.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)); break;
      case 'oldest':   list.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified)); break;
    }
    setVisibleCount(PAGE_SIZE);
    return list;
  }, [videos, sortBy, search]);

  const visibleVideos = sortedVideos.slice(0, visibleCount);

  // Poll for live job status every 3 seconds
  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/compression-jobs');
      if (!res.ok) return;
      const data = await res.json();
      const map = {};
      for (const job of (data.jobs || [])) {
        if (!map[job.video_key] || new Date(job.created_at) > new Date(map[job.video_key].created_at)) {
          map[job.video_key] = job;
        }
      }
      setJobs(map);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleCancel = async (id) => {
    try {
      await fetch(`/api/compression-jobs/${id}/cancel`, { method: 'POST' });
      fetchJobs();
    } catch (err) {
      console.error('Failed to cancel', err);
    }
  };

  const handleCompress = async (key) => {
    setLoadingKey(key);
    const res = await queueExistingJob(key, null, currentProvider);
    if (res.error) {
      alert(res.error);
    } else {
      fetchJobs();
    }
    setLoadingKey(null);
  };

  const handleQueueRemote = async (e) => {
    e.preventDefault();
    if (!remoteUrl.trim()) return;

    setIsQueueingRemote(true);
    try {
      const res = await fetch('/api/compression-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: remoteUrl.trim(),
          videoKey: remoteName.trim() || undefined,
          provider: currentProvider,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to queue job');
      alert('✅ Compression job queued! The VPS compressor is downloading and compressing in the background.');
      setRemoteUrl('');
      setRemoteName('');
      fetchJobs();
    } catch (err) {
      alert(`Error queueing job: ${err.message}`);
    }
    setIsQueueingRemote(false);
  };

  return (
    <div>
      {/* Remote URL Quick Compressor Box */}
      <div style={{
        background: 'var(--bg2)',
        padding: '20px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        marginBottom: '25px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Queue Direct Video Link for Squeeze Compression
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
            Target: <strong>{currentProvider.toUpperCase()}</strong> ({bucketName || 'active bucket'})
          </span>
        </div>
        <form onSubmit={handleQueueRemote} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="url"
            placeholder="Paste remote video direct URL (https://...)"
            value={remoteUrl}
            onChange={e => setRemoteUrl(e.target.value)}
            required
            style={{
              flex: '2 1 300px',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <input
            type="text"
            placeholder="Custom File Name (e.g. Inception.mp4 - optional)"
            value={remoteName}
            onChange={e => setRemoteName(e.target.value)}
            style={{
              flex: '1 1 200px',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '13px',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={isQueueingRemote}
            style={{
              padding: '10px 20px',
              background: 'var(--acc)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '700',
              cursor: isQueueingRemote ? 'not-allowed' : 'pointer',
              opacity: isQueueingRemote ? 0.7 : 1,
            }}
          >
            {isQueueingRemote ? 'Queueing...' : '🗜 Queue & Compress'}
          </button>
        </form>
      </div>

      {/* Active Processing Jobs Banner */}
      {Object.values(jobs).filter(j => j.status === 'processing').map(job => (
        <div key={job.id} style={{
          marginBottom: '20px', padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))',
          border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div style={{ fontSize: '24px' }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#fff', marginBottom: '6px', fontSize: '14px' }}>
              VPS Compressor Working: <span style={{ color: '#818cf8' }}>{job.video_key}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.08)', height: '8px', borderRadius: '4px', overflow: 'hidden', maxWidth: '400px' }}>
                <div style={{
                  width: `${job.progress || 0}%`, height: '100%',
                  background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                  transition: 'width 0.5s ease',
                  boxShadow: '0 0 8px rgba(99,102,241,0.6)'
                }} />
              </div>
              <span style={{ color: '#818cf8', fontWeight: '700', fontSize: '14px' }}>{job.progress || 0}%</span>
            </div>
          </div>
          <button
            onClick={() => handleCancel(job.id)}
            style={{
              padding: '6px 12px', background: 'rgba(229,9,20,0.2)', border: '1px solid #e50914',
              color: '#fff', borderRadius: '4px', fontSize: '12px', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      ))}

      {/* Filter / Search Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder={`Search ${currentProvider.toUpperCase()} files by filename...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', boxSizing: 'border-box',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              color: '#fff', borderRadius: '8px', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {[
            { key: 'newest',   label: '🕐 Newest' },
            { key: 'oldest',   label: '🕰️ Oldest' },
            { key: 'largest',  label: '⬆️ Largest' },
            { key: 'smallest', label: '⬇️ Smallest' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setSortBy(opt.key)}
              style={{
                padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                cursor: 'pointer', border: '1px solid',
                background: sortBy === opt.key ? 'var(--acc)' : 'var(--bg2)',
                borderColor: sortBy === opt.key ? 'var(--acc)' : 'var(--border)',
                color: sortBy === opt.key ? '#fff' : 'var(--text2)',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span style={{ color: 'var(--text3)', fontSize: '13px', flexShrink: 0 }}>
          {sortedVideos.length} of {videos.length} videos
        </span>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg2)', borderRadius: '8px', overflowX: 'auto' }}>
        {videos.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>
            No video files found in {currentProvider.toUpperCase()} bucket ({bucketName}).
          </div>
        ) : sortedVideos.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text2)' }}>
            No videos match your search. <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--acc)', cursor: 'pointer', textDecoration: 'underline' }}>Clear search</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '14px 18px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px' }}>FILE NAME</th>
                <th style={{ padding: '14px 18px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }} onClick={() => setSortBy(sortBy === 'largest' ? 'smallest' : 'largest')}>SIZE {sortBy === 'largest' ? '▼' : sortBy === 'smallest' ? '▲' : ''}</th>
                <th style={{ padding: '14px 18px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px' }}>SAVED</th>
                <th style={{ padding: '14px 18px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px' }}>VPS STATUS</th>
                <th style={{ padding: '14px 18px', color: 'var(--text3)', fontWeight: '600', fontSize: '12px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {visibleVideos.map((video) => {
                const job = jobs[video.key];
                const isProcessing = job?.status === 'processing';
                const isPending = job?.status === 'pending';
                const isDone = job?.status === 'completed';

                return (
                  <tr key={video.key} style={{
                    borderTop: '1px solid var(--border)',
                    background: isProcessing ? 'rgba(99,102,241,0.05)' : 'transparent',
                    transition: 'background 0.3s'
                  }}>
                    <td style={{ padding: '14px 18px', fontWeight: '500', wordBreak: 'break-all', maxWidth: '300px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎥</span>
                        <span>{video.key}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 18px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {formatBytes(video.size)}
                    </td>
                    <td style={{ padding: '14px 18px', whiteSpace: 'nowrap' }}>
                      {isDone && job?.original_size && job?.compressed_size ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--text3)', fontSize: '11px', textDecoration: 'line-through' }}>{formatBytes(job.original_size)}</span>
                          <span style={{ color: '#46b450', fontSize: '12px', fontWeight: '700' }}>
                            ↓ {formatBytes(job.compressed_size)}
                          </span>
                          <span style={{ fontSize: '11px', fontWeight: '800', color: '#46b450' }}>
                            {Math.round((1 - job.compressed_size / job.original_size) * 100)}% saved
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text3)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      {job ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <StatusBadge status={job.status} progress={job.progress} />
                          <ProgressBar progress={job.progress} status={job.status} />
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Raw File</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => setPreviewUrl(video.url)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: '#fff',
                            borderRadius: '5px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          👁 Preview
                        </button>
                        <button
                          onClick={() => handleCompress(video.key)}
                          disabled={isProcessing || isPending || loadingKey === video.key}
                          style={{
                            padding: '6px 14px',
                            background: isDone ? 'rgba(70,180,80,0.15)' : 'var(--acc)',
                            border: isDone ? '1px solid #46b450' : 'none',
                            color: '#fff',
                            borderRadius: '5px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: (isProcessing || isPending || loadingKey === video.key) ? 'not-allowed' : 'pointer',
                            opacity: (isProcessing || isPending || loadingKey === video.key) ? 0.6 : 1,
                          }}
                        >
                          {loadingKey === video.key ? 'Queueing...' : isDone ? 'Re-compress' : isProcessing ? 'Compressing...' : '🗜 Squeeze'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {sortedVideos.length > visibleCount && (
          <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid var(--border)' }}>
            <button
              onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
              style={{
                padding: '10px 24px', background: 'var(--bg3)', border: '1px solid var(--border)',
                color: '#fff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600'
              }}
            >
              Load more ({sortedVideos.length - visibleCount} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Video Preview Modal */}
      {previewUrl && (
        <div
          onClick={() => setPreviewUrl(null)}
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
              <h4 style={{ margin: 0, fontSize: '16px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Video Preview
              </h4>
              <button
                onClick={() => setPreviewUrl(null)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <video
              src={previewUrl}
              controls
              autoPlay
              style={{ width: '100%', maxHeight: '480px', borderRadius: '8px', background: '#000' }}
            />
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text2)', wordBreak: 'break-all' }}>
              <strong>URL:</strong> <a href={previewUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--acc)' }}>{previewUrl}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
