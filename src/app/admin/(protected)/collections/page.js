import { createClient } from '@/utils/supabase/server';
import { createCollection, deleteCollection } from './actions';

export const metadata = { title: 'Collections — Flixon Admin' };

export default async function CollectionsPage() {
  const supabase = await createClient();

  const { data: collections } = await supabase
    .from('collections')
    .select('*, collection_items(count)')
    .order('sort_order', { ascending: true });

  const { data: movies } = await supabase
    .from('movies')
    .select('id, title, thumbnail_url, type')
    .order('title', { ascending: true });

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Collections</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>Create curated collections to highlight specific content on your homepage.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        {/* Create Form */}
        <div style={{ background: 'var(--bg2)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--acc)' }}>Create Collection</h2>
          <form action={createCollection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Collection Name *</label>
              <input type="text" name="name" required placeholder="e.g. Staff Picks, Weekend Vibes" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Slug (URL-friendly)</label>
              <input type="text" name="slug" placeholder="e.g. staff-picks (auto-generated if blank)" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontFamily: 'monospace' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Description</label>
              <textarea name="description" rows={2} placeholder="Short description for this collection" style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', color: 'var(--text2)' }}>Movies (hold Ctrl/Cmd to select multiple)</label>
              <select name="movie_ids" multiple required style={{ width: '100%', height: '160px', padding: '10px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}>
                {movies?.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="gms-btn gms-btn--primary" style={{ width: '100%' }}>Create Collection</button>
          </form>
        </div>

        {/* Collections List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {collections?.length > 0 ? collections.map(col => (
            <div key={col.id} style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#fff' }}>{col.name}</h3>
                  <span style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>/collection/{col.slug}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{
                    padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                    background: col.is_active ? 'rgba(74,222,128,0.1)' : 'rgba(229,9,20,0.1)',
                    color: col.is_active ? '#4ade80' : '#ff6b6b'
                  }}>
                    {col.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <form action={deleteCollection} style={{ display: 'inline' }}>
                    <input type="hidden" name="id" value={col.id} />
                    <button type="submit" style={{ color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Delete</button>
                  </form>
                </div>
              </div>
              {col.description && <p style={{ fontSize: '13px', color: 'var(--text3)', margin: '0 0 8px' }}>{col.description}</p>}
              <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>
                {col.collection_items?.[0]?.count || 0} movies
              </p>
            </div>
          )) : (
            <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
              No collections yet. Create your first one!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
