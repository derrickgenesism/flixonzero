'use client';

import { useState, useEffect, useCallback } from 'react';

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function QueueClient({ initialJobs }) {
  const [jobs, setJobs] = useState(initialJobs || []);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/compression-jobs');
      if (!res.ok) return;
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (_) {}
  }, []);

  useEffect(() => {
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', margin: 0 }}>Compression Queue</h3>
        <span style={{ fontSize: '12px', color: 'var(--text3)', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px' }}>
          🔄 Live — updates every 3s
        </span>
      </div>
      <div style={{ background: 'var(--bg2)', borderRadius: '8px', overflow: 'hidden' }}>
        {jobs.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text2)' }}>
            No compression jobs yet. Upload a video above to get started.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px' }}>FILE</th>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px' }}>STATUS</th>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px' }}>PROGRESS</th>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px' }}>QUEUED</th>
                <th style={{ padding: '14px 20px', color: 'var(--text3)', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(job => (
                <tr key={job.id} style={{
                  borderTop: '1px solid var(--border)',
                  background: job.status === 'processing' ? 'rgba(99,102,241,0.05)' : 'transparent',
                }}>
                  <td style={{ padding: '14px 20px', fontWeight: '500', wordBreak: 'break-all', maxWidth: '260px', fontSize: '13px' }}>
                    {job.video_key}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {job.status === 'pending' && <span style={{ color: '#ffb700', fontSize: '13px' }}>⏳ Pending</span>}
                    {job.status === 'processing' && <span style={{ color: '#818cf8', fontSize: '13px' }}>⚡ {job.progress || 0}%</span>}
                    {job.status === 'completed' && <span style={{ color: '#46b450', fontSize: '13px' }}>✅ Done</span>}
                    {job.status === 'failed' && <span style={{ color: '#e50914', fontSize: '12px', display: 'block', maxWidth: '180px' }}>❌ {job.error_message || 'Failed'}</span>}
                    {job.status === 'cancelled' && <span style={{ color: '#9ca3af', fontSize: '13px' }}>🛑 Cancelled</span>}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    {job.status === 'processing' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '120px', background: 'rgba(255,255,255,0.08)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${job.progress || 0}%`, height: '100%',
                            background: 'linear-gradient(90deg, #6366f1, #a78bfa)',
                            transition: 'width 0.5s ease',
                          }} />
                        </div>
                        <span style={{ fontSize: '12px', color: '#818cf8' }}>{job.progress || 0}%</span>
                      </div>
                    ) : job.status === 'completed' ? (
                      <div style={{ width: '120px', background: 'rgba(70,180,80,0.15)', height: '6px', borderRadius: '3px' }}>
                        <div style={{ width: '100%', height: '100%', background: '#46b450', borderRadius: '3px' }} />
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text3)', fontSize: '13px' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text3)', fontSize: '12px' }}>
                    {mounted ? new Date(job.created_at).toLocaleString() : ''}
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                    {(job.status === 'pending' || job.status === 'processing' || job.status === 'failed') && (
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
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
