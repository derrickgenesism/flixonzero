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
  if (status === 'pending') return <span style={{ color: 'var(--text3)', fontSize: '13px' }}>Waiting in queue...</span>;
  if (status === 'completed') return <span style={{ color: '#46b450', fontSize: '13px' }}>Compression complete!</span>;
  if (status === 'failed') return null;
  
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

export default function ExistingClient({ initialVideos }) {
  const [videos] = useState(initialVideos || []);
  const [jobs, setJobs] = useState({});   // keyed by video_key
  const [loadingKey, setLoadingKey] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const sortedVideos = useMemo(() => {
    let list = [...videos];
    if (search.trim()) {
      list = list.filter(v => v.key.toLowerCase().includes(search.toLowerCase()));
    }
    switch (sortBy) {
      case 'largest':  list.sort((a, b) => (b.size || 0) - (a.size || 0)); break;
      case 'smallest': list.sort((a, b) => (a.size || 0) - (b.size || 0)); break;
      case 'newest':   list.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)); break;
      case 'oldest':   list.sort((a, b) => new Date(a.lastModified) - new Date(b.lastModified)); break;
    }
    setVisibleCount(PAGE_SIZE); // reset on sort/search change
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
        // Keep the most recent job per key
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
    const res = await queueExistingJob(key);
    if (res.error) {
      alert(res.error);
    } else {
      fetchJobs(); // Immediately refresh
    }
    setLoadingKey(null);
  };

  return (
    <div>
      {/* Active Job Banner */}
      {Object.values(jobs).filter(j => j.status === 'processing').map(job => (
        <div key={job.id} style={{
          marginBottom: '20px', padding: '16px 20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.08))',
          border: '1px solid rgba(99,102,241,0.4)', borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div style={{ fontSize: '24px', animation: 'spin 2s linear infinite' }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', color: '#fff', marginBottom: '6px', fontSize: '14px' }}>
              Currently compressing: <span style={{ color: '#818cf8' }}>{job.video_key}</span>
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
        </div>
      ))}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '14px', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '9px 12px 9px 36px', boxSizing: 'border-box',
              background: 'var(--bg2)', border: '1px solid var(--border)',
              color: '#fff', borderRadius: '8px', fontSize: '13px', outline: 'none',
            }}
          />
        </div>

        {/* Sort buttons */}
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

        {/* Count */}
        <span style={{ color: 'var(--text3)', fontSize: '13px', flexShrink: 0 }}>
          {sortedVideos.length} of {videos.length} videos
        </span>
      </div>

      <div style={{ background: 'var(--bg2)', borderRadius: '8px', overflow: 'hidden' }}>
        {videos.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text2)' }}>
            No videos found in your Cloudflare R2 bucket.
          </div>
        ) : sortedVideos.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text2)' }}>
            No videos match your search. <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: 'var(--acc)', cursor: 'pointer', textDecoration: 'underline' }}>Clear search</button>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '15px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px' }}>VIDEO NAME</th>
                <th style={{ padding: '15px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }} onClick={() => setSortBy(sortBy === 'largest' ? 'smallest' : 'largest')}>SIZE {sortBy === 'largest' ? '▼' : sortBy === 'smallest' ? '▲' : ''}</th>
                <th style={{ padding: '15px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px' }}>SAVED</th>
                <th style={{ padding: '15px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px' }}>PROGRESS</th>
                <th style={{ padding: '15px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px' }}>STATUS</th>
                <th style={{ padding: '15px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {visibleVideos.map((video, i) => {
                const job = jobs[video.key];
                const isQueued = job && ['pending', 'processing', 'completed'].includes(job.status);

                return (
                  <tr key={video.key} style={{
                    borderTop: '1px solid var(--border)',
                    background: job?.status === 'processing' ? 'rgba(99,102,241,0.05)' : 'transparent',
                    transition: 'background 0.3s'
                  }}>
                    <td style={{ padding: '15px 20px', fontWeight: '500', wordBreak: 'break-all', maxWidth: '260px' }}>
                      {video.key}
                    </td>
                    <td style={{ padding: '15px 20px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {formatBytes(video.size)}
                    </td>
                    {/* Space saved column */}
                    <td style={{ padding: '15px 20px', whiteSpace: 'nowrap' }}>
                      {job?.status === 'completed' && job.original_size && job.compressed_size ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: 'var(--text3)', fontSize: '11px', textDecoration: 'line-through' }}>{formatBytes(job.original_size)}</span>
                          <span style={{ color: '#46b450', fontSize: '12px', fontWeight: '700' }}>
                            ↓ {formatBytes(job.compressed_size)}
                          </span>
                          <span style={{
                            fontSize: '11px', fontWeight: '800',
                            color: '#46b450',
                          }}>
                            {Math.round((1 - job.compressed_size / job.original_size) * 100)}% saved
                          </span>
                        </div>
                      ) : job?.status === 'completed' && job.original_size && !job.compressed_size ? (
                        <span style={{ color: 'var(--text3)', fontSize: '12px' }}>Already optimal</span>
                      ) : (
                        <span style={{ color: 'var(--text3)', fontSize: '13px' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '15px 20px', minWidth: '180px' }}>
                      {job ? <ProgressBar progress={job.progress} status={job.status} /> : <span style={{ color: 'var(--text3)', fontSize: '13px' }}>—</span>}
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      {job ? <StatusBadge status={job.status} progress={job.progress} /> : <span style={{ color: 'var(--text3)', fontSize: '13px' }}>Not queued</span>}
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      {job?.status === 'completed' ? (
                        <span style={{ color: '#46b450', fontSize: '13px' }}>✅ Done</span>
                      ) : (job?.status === 'processing' || job?.status === 'pending' || job?.status === 'failed') ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <span style={{ color: job?.status === 'processing' ? '#818cf8' : job?.status === 'pending' ? '#ffb700' : '#e50914', fontSize: '13px', marginRight: '8px' }}>
                            {job?.status === 'processing' ? 'Running...' : job?.status === 'pending' ? 'In Queue' : 'Failed'}
                          </span>
                          <button
                            onClick={() => handleCancel(job.id)}
                            style={{
                              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text2)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.borderColor = '#e50914'; e.currentTarget.style.color = '#e50914'; }}
                            onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCompress(video.key)}
                          disabled={loadingKey === video.key}
                          style={{
                            padding: '8px 16px', fontSize: '13px', fontWeight: '600',
                            background: 'var(--acc)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px', cursor: 'pointer',
                          }}
                        >
                          {loadingKey === video.key ? 'Queuing...' : 'Compress'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Load More */}
      {visibleCount < sortedVideos.length && (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
            style={{
              padding: '12px 32px', background: 'var(--bg2)',
              border: '1px solid var(--border)', color: '#fff',
              borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.color = 'var(--acc)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = '#fff'; }}
          >
            Load {Math.min(PAGE_SIZE, sortedVideos.length - visibleCount)} More Videos
          </button>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '10px' }}>
            Showing {Math.min(visibleCount, sortedVideos.length)} of {sortedVideos.length} videos
          </p>
        </div>
      )}

      {visibleCount >= sortedVideos.length && sortedVideos.length > 0 && (
        <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '12px', textAlign: 'right' }}>
          All {sortedVideos.length} videos shown
        </p>
      )}
    </div>
  );
}
