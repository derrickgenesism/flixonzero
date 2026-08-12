'use client';

import { useState } from 'react';
import Link from 'next/link';
import { updateSeries, deleteSeries, addEpisode, removeEpisode } from '../actions';
import { useRouter } from 'next/navigation';

export default function ManageSeriesClient({ series, initialEpisodes, tmdbApiKey }) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('episodes'); // 'episodes' or 'settings'
  
  // Series Settings State
  const [formData, setFormData] = useState({
    title: series.title || '',
    description: series.description || '',
    thumbnail_url: series.thumbnail_url || '',
    backdrop_url: series.backdrop_url || '',
    release_year: series.release_year || '',
    categories: series.categories || [],
    status: series.status || 'ongoing'
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // New Episode State
  const [showAddForm, setShowAddForm] = useState(false);
  const [epData, setEpData] = useState({
    season_number: 1,
    episode_number: initialEpisodes.length > 0 ? Math.max(...initialEpisodes.map(e => e.episode_number)) + 1 : 1,
    title: '',
    video_url: '',
    type: 'gsm_series', // premium episode
  });
  const [addingEp, setAddingEp] = useState(false);

  const handleUpdateSeries = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    const fd = new FormData();
    Object.entries(formData).forEach(([k, v]) => {
      fd.append(k, k === 'categories' ? v.join(', ') : v);
    });
    await updateSeries(series.id, fd);
    setSavingSettings(false);
    alert('Series updated!');
  };

  const handleDeleteSeries = async () => {
    if (confirm('Delete this series? All episodes will be unlinked (but not deleted).')) {
      await deleteSeries(series.id);
      router.push('/admin/series');
    }
  };

  const handleAddEpisode = async (e) => {
    e.preventDefault();
    setAddingEp(true);
    const fd = new FormData();
    fd.append('series_id', series.id);
    Object.entries(epData).forEach(([k, v]) => fd.append(k, v));
    
    // Auto-generate title if empty
    if (!epData.title) {
      fd.set('title', `${series.title} - S${epData.season_number}E${epData.episode_number}`);
    }
    // Inherit thumbnail
    fd.append('thumbnail_url', series.thumbnail_url);

    await addEpisode(fd);
    setAddingEp(false);
    setShowAddForm(false);
    setEpData({ ...epData, episode_number: epData.episode_number + 1, title: '', video_url: '' });
  };

  const handleRemoveEpisode = async (epId) => {
    if (confirm('Unlink this episode from the series?')) {
      await removeEpisode(epId, series.id);
    }
  };

  // Group episodes by season
  const seasons = {};
  initialEpisodes.forEach(ep => {
    const s = ep.season_number || 1;
    if (!seasons[s]) seasons[s] = [];
    seasons[s].push(ep);
  });

  return (
    <div style={{ padding: '8px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-end', marginBottom: '32px' }}>
        {series.thumbnail_url ? (
          <img src={series.thumbnail_url} alt={series.title} style={{ width: '120px', height: '180px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} />
        ) : (
          <div style={{ width: '120px', height: '180px', background: '#111', borderRadius: '12px' }} />
        )}
        <div style={{ flex: 1 }}>
          <Link href="/admin/series" style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: '13px', display: 'block', marginBottom: '8px' }}>← Back to Series</Link>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 8px' }}>{series.title}</h1>
          <div style={{ display: 'flex', gap: '12px', color: 'var(--text2)', fontSize: '14px' }}>
            <span>{series.release_year}</span>
            <span>·</span>
            <span style={{ textTransform: 'uppercase', color: series.status === 'completed' ? '#4ade80' : '#facc15' }}>{series.status}</span>
            <span>·</span>
            <span>{initialEpisodes.length} Episodes</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid var(--border)', marginBottom: '24px' }}>
        <button onClick={() => setActiveTab('episodes')} style={{ background: 'none', border: 'none', padding: '10px 0', color: activeTab === 'episodes' ? 'var(--acc)' : 'var(--text2)', borderBottom: activeTab === 'episodes' ? '2px solid var(--acc)' : '2px solid transparent', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Episodes</button>
        <button onClick={() => setActiveTab('settings')} style={{ background: 'none', border: 'none', padding: '10px 0', color: activeTab === 'settings' ? 'var(--acc)' : 'var(--text2)', borderBottom: activeTab === 'settings' ? '2px solid var(--acc)' : '2px solid transparent', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>Series Settings</button>
      </div>

      {/* EPISODES TAB */}
      {activeTab === 'episodes' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Seasons & Episodes</h2>
            <button onClick={() => setShowAddForm(!showAddForm)} className="gms-btn gms-btn--primary">
              {showAddForm ? 'Cancel' : '+ Add Episode'}
            </button>
          </div>

          {/* Quick Add Form */}
          {showAddForm && (
            <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px' }}>Quick Add Episode</h3>
              <form onSubmit={handleAddEpisode} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '0 0 80px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Season</label>
                  <input type="number" min="1" required value={epData.season_number} onChange={e => setEpData({...epData, season_number: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                </div>
                <div style={{ flex: '0 0 80px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Episode</label>
                  <input type="number" min="1" required value={epData.episode_number} onChange={e => setEpData({...epData, episode_number: parseInt(e.target.value)})} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Title (Optional)</label>
                  <input type="text" placeholder="Auto-generates if empty" value={epData.title} onChange={e => setEpData({...epData, title: e.target.value})} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                </div>
                <div style={{ flex: '2 1 300px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text2)' }}>Cloudflare Video URL</label>
                  <input type="url" required placeholder="https://..." value={epData.video_url} onChange={e => setEpData({...epData, video_url: e.target.value})} style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
                </div>
                <button type="submit" disabled={addingEp} className="gms-btn gms-btn--primary" style={{ padding: '12px 24px' }}>
                  {addingEp ? 'Saving...' : 'Add'}
                </button>
              </form>
            </div>
          )}

          {Object.keys(seasons).length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
              No episodes added yet.
            </div>
          ) : (
            Object.keys(seasons).sort((a,b) => a-b).map(seasonNum => (
              <div key={seasonNum} style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)', marginBottom: '16px', color: 'var(--acc)' }}>Season {seasonNum}</h3>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {seasons[seasonNum].map(ep => (
                    <div key={ep.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid transparent' }} onMouseEnter={e => e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.borderColor='transparent'}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ color: 'var(--text3)', fontWeight: 'bold', width: '40px' }}>E{ep.episode_number}</div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{ep.title}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text2)' }}>ID: {ep.id}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link href={`/movie/${ep.id}`} className="gms-btn gms-btn--ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>View</Link>
                        <button onClick={() => handleRemoveEpisode(ep.id)} className="gms-btn gms-btn--ghost" style={{ padding: '6px 12px', fontSize: '12px', color: '#ff6b6b' }}>Unlink</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: '600px' }}>
          <form onSubmit={handleUpdateSeries} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Series Title</label>
              <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Release Year</label>
                <input type="text" value={formData.release_year} onChange={e => setFormData({...formData, release_year: e.target.value})} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }}>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Genres (Comma separated)</label>
              <input type="text" value={formData.categories.join(', ')} onChange={e => setFormData({...formData, categories: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>VJ (Translator)</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark'].map(vj => {
                  const isSelected = formData.categories.includes(vj);
                  return (
                    <button
                      key={vj}
                      type="button"
                      onClick={() => {
                        let cats = [...formData.categories];
                        if (isSelected) {
                          cats = cats.filter(c => c !== vj);
                        } else {
                          cats.push(vj);
                        }
                        setFormData({...formData, categories: cats});
                      }}
                      style={{
                        padding: '6px 12px', borderRadius: '20px', border: '1px solid #444', 
                        background: isSelected ? 'var(--acc)' : '#222',
                        color: '#fff', cursor: 'pointer', fontSize: '12px'
                      }}
                    >
                      {vj}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Description</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows="4" style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px', resize: 'vertical' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>Poster URL</label>
              <input type="text" value={formData.thumbnail_url} onChange={e => setFormData({...formData, thumbnail_url: e.target.value})} style={{ width: '100%', padding: '12px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '6px' }} />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
              <button type="submit" disabled={savingSettings} className="gms-btn gms-btn--primary" style={{ flex: 1 }}>
                {savingSettings ? 'Saving...' : 'Save Settings'}
              </button>
              <button type="button" onClick={handleDeleteSeries} className="gms-btn gms-btn--ghost" style={{ color: '#ff6b6b', border: '1px solid rgba(255,107,107,0.3)' }}>
                Delete Series
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
