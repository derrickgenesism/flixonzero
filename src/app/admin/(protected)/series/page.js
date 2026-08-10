import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import Link from 'next/link';

export const metadata = { title: 'Manage Series — Flixon Admin' };

export default async function SeriesIndexPage() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: seriesList } = await supabase
    .from('series')
    .select('id, title, thumbnail_url, status, release_year, created_at')
    .order('created_at', { ascending: false });

  // Count episodes per series
  const { data: episodeCounts } = await supabase
    .from('movies')
    .select('series_id')
    .not('series_id', 'is', null);

  const countMap = {};
  episodeCounts?.forEach(e => {
    countMap[e.series_id] = (countMap[e.series_id] || 0) + 1;
  });

  const inputStyle = {
    background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 14px', color: '#fff', fontSize: '14px', width: '100%', outline: 'none',
  };

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 4px' }}>Series Manager</h1>
          <p style={{ margin: 0, color: 'var(--text2)', fontSize: '14px' }}>{seriesList?.length || 0} series in library</p>
        </div>
        <Link href="/admin/series/add" className="gms-btn gms-btn--primary" style={{ gap: '8px' }}>
          + New Series
        </Link>
      </div>

      {!seriesList?.length ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
          <h2 style={{ color: '#fff', marginBottom: '8px' }}>No series yet</h2>
          <p>Create your first series to start adding episodes.</p>
          <Link href="/admin/series/add" className="gms-btn gms-btn--primary" style={{ marginTop: '20px', display: 'inline-flex' }}>
            + Create Series
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {seriesList.map(s => (
            <Link key={s.id} href={`/admin/series/${s.id}`} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)',
                overflow: 'hidden', transition: 'border-color 0.2s, transform 0.2s',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
              >
                {s.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.thumbnail_url} alt={s.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '160px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>📺</div>
                )}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#fff' }}>{s.title}</h3>
                    <span style={{
                      fontSize: '10px', fontWeight: '700', padding: '3px 8px', borderRadius: '20px', whiteSpace: 'nowrap',
                      background: s.status === 'completed' ? 'rgba(74,222,128,0.1)' : 'rgba(250,204,21,0.1)',
                      color: s.status === 'completed' ? '#4ade80' : '#facc15',
                    }}>{s.status}</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text3)', fontSize: '13px' }}>
                    {countMap[s.id] || 0} episode{(countMap[s.id] || 0) !== 1 ? 's' : ''} · {s.release_year || 'N/A'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
