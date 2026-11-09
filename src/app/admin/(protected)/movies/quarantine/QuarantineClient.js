'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function QuarantineClient({ movies, stats }) {
  const router = useRouter();
  const [list, setList] = useState(movies);
  const [restoring, setRestoring] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);

  const filtered = list.filter(m => {
    const matchSearch = !search || m.title?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'pearlpix' && m.source === 'pearlpix (deleted)') ||
      (filter === 'r2' && m.source === 'Cloudflare R2') ||
      (filter === 'nourl' && m.source === 'No URL');
    return matchSearch && matchFilter;
  });

  async function handleRestore(id) {
    if (!confirm('Are you sure you want to restore this movie? Only do this after updating its video_url to a valid cdn.flixon.net link.')) return;
    setRestoring(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/quarantine/${id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setList(prev => prev.filter(m => m.id !== id));
        setMsg({ type: 'success', text: `✅ Movie ID ${id} restored and is now visible to users.` });
        router.refresh();
      } else {
        setMsg({ type: 'error', text: data.error || 'Restore failed.' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Network error. Try again.' });
    } finally {
      setRestoring(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 6px' }}>🚫 Quarantined Movies</h1>
            <p style={{ color: 'var(--text3)', margin: 0, fontSize: '14px' }}>
              These movies are hidden from all users. Upload to Backblaze, update the video URL, then restore.
            </p>
          </div>
          <Link href="/admin/movies" style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            ← Back to Movies
          </Link>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { label: 'Total Quarantined', value: stats.total, color: '#fff' },
          { label: 'Deleted (pearlpix)', value: stats.pearlpix, color: '#e50914' },
          { label: 'Cloudflare R2', value: stats.r2, color: '#f97316' },
          { label: 'No URL', value: stats.noUrl, color: '#888' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--bg2)', padding: '18px 20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>{s.label}</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Alert */}
      <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: '8px', padding: '14px 18px', marginBottom: '24px', fontSize: '14px', color: '#fdba74', lineHeight: '1.6' }}>
        <strong>📋 Workflow:</strong> To restore a movie → Go to <Link href="/admin/movies" style={{ color: '#f97316' }}>Manage Movies</Link> → Find by ID → Edit → Update the <code>video_url</code> to <code>https://cdn.flixon.net/FILENAME.mp4</code> → Come back here and click <strong>Restore</strong>.
      </div>

      {/* Message */}
      {msg && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(255,107,107,0.1)',
          color: msg.type === 'success' ? '#4ade80' : '#ff6b6b',
          border: `1px solid ${msg.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(255,107,107,0.2)'}`,
          padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: '500'
        }}>
          {msg.text}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title..."
          style={{ flex: 1, minWidth: '200px', padding: '9px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '14px' }}
        />
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px' }}>
          {[
            { key: 'all', label: `All (${stats.total})` },
            { key: 'pearlpix', label: `Deleted (${stats.pearlpix})` },
            { key: 'r2', label: `R2 (${stats.r2})` },
            { key: 'nourl', label: `No URL (${stats.noUrl})` },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                background: filter === f.key ? 'var(--acc)' : 'transparent',
                color: filter === f.key ? '#000' : 'var(--text2)',
                border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Movie Table */}
      <div style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text3)' }}>
            {search ? `No quarantined movies match "${search}"` : 'No quarantined movies in this category.'}
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '700px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text3)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Movie</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Broken Source</th>
                <th style={{ padding: '14px 16px', fontWeight: '600' }}>Video URL</th>
                <th style={{ padding: '14px 16px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--text3)', fontFamily: 'monospace', fontSize: '12px' }}>{m.id}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {m.thumbnail_url && (
                        <img
                          src={m.thumbnail_url}
                          alt={m.title}
                          style={{ width: '48px', height: '32px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }}
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <span style={{ fontWeight: '600', color: '#fff' }}>{m.title || `Movie #${m.id}`}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      background: `${m.sourceBadge}20`,
                      color: m.sourceBadge,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700',
                      whiteSpace: 'nowrap'
                    }}>
                      {m.source}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                    {m.video_url ? (
                      <span style={{
                        fontSize: '11px',
                        color: 'var(--text3)',
                        fontFamily: 'monospace',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }} title={m.video_url}>
                        {m.video_url}
                      </span>
                    ) : (
                      <span style={{ color: '#666', fontSize: '11px' }}>— empty —</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <Link
                        href={`/admin/movies/${m.id}/edit`}
                        style={{
                          padding: '6px 12px',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ✏ Edit URL
                      </Link>
                      <button
                        onClick={() => handleRestore(m.id)}
                        disabled={restoring === m.id}
                        style={{
                          padding: '6px 12px',
                          background: restoring === m.id ? 'rgba(74,222,128,0.1)' : '#16a34a',
                          color: restoring === m.id ? '#4ade80' : '#fff',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: restoring === m.id ? 'wait' : 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {restoring === m.id ? 'Restoring…' : '✓ Restore'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '12px' }}>
        Showing {filtered.length} of {list.length} quarantined movies.
      </p>
    </div>
  );
}
