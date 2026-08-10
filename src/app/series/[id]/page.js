import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import MovieRow from '@/components/MovieRow';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: series } = await supabase.from('series').select('title, description').eq('id', id).single();
  
  if (!series) return { title: 'Series Not Found' };
  
  return {
    title: `${series.title} — Flixon`,
    description: series.description,
  };
}

export default async function SeriesPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: series } = await supabase
    .from('series')
    .select('*')
    .eq('id', id)
    .single();

  if (!series) notFound();

  // Fetch episodes
  const { data: episodes } = await supabase
    .from('movies')
    .select('id, title, description, thumbnail_url, type, season_number, episode_number')
    .eq('series_id', id)
    .order('season_number', { ascending: true })
    .order('episode_number', { ascending: true });

  // Group into seasons
  const seasons = {};
  episodes?.forEach(ep => {
    const s = ep.season_number || 1;
    if (!seasons[s]) seasons[s] = [];
    seasons[s].push(ep);
  });

  const typeBadgeStyle = {
    background: series.status === 'completed' ? 'rgba(74,222,128,0.2)' : 'rgba(59,130,246,0.2)',
    color: series.status === 'completed' ? '#4ade80' : '#60a5fa',
    border: `1px solid ${series.status === 'completed' ? 'rgba(74,222,128,0.3)' : 'rgba(59,130,246,0.3)'}`
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* Hero Header */}
      <div style={{ 
        position: 'relative', 
        paddingTop: '68px', 
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        backgroundImage: series.backdrop_url ? `url(${series.backdrop_url})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to top, var(--bg) 0%, rgba(10,10,10,0.8) 50%, rgba(10,10,10,0.6) 100%)',
          zIndex: 1
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: '1100px', margin: '0 auto', width: '100%', padding: '40px 20px', display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center' }}>
          {series.thumbnail_url && (
            <img 
              src={series.thumbnail_url} 
              alt={series.title} 
              style={{ width: '220px', height: '330px', objectFit: 'cover', borderRadius: '12px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)', flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '900', margin: 0, lineHeight: 1.1, letterSpacing: '-1px' }}>
                {series.title}
              </h1>
              <span style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', padding: '6px 12px', borderRadius: '6px', ...typeBadgeStyle }}>
                {series.status}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '16px', color: 'var(--text2)', fontSize: '15px', fontWeight: '500', marginBottom: '24px' }}>
              {series.release_year && <span>{series.release_year}</span>}
              {series.categories?.length > 0 && <span>·</span>}
              {series.categories?.length > 0 && <span>{series.categories.join(', ')}</span>}
              <span>·</span>
              <span>{episodes?.length || 0} Episodes</span>
            </div>

            <p style={{ fontSize: '17px', lineHeight: 1.7, color: 'var(--text)', maxWidth: '700px', margin: '0 0 32px', opacity: 0.9 }}>
              {series.description}
            </p>

            {episodes?.[0] && (
              <Link href={`/movie/${episodes[0].id}`} className="gms-btn gms-btn--primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5V19L19 12L8 5Z" />
                </svg>
                Watch S1:E1
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Episodes List */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 20px 80px' }}>
        {Object.keys(seasons).length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text3)' }}>
            <h3 style={{ fontSize: '24px', color: '#fff', marginBottom: '8px' }}>Coming Soon</h3>
            <p>Episodes are being prepared for this series.</p>
          </div>
        ) : (
          Object.keys(seasons).sort((a,b) => a-b).map(seasonNum => (
            <div key={seasonNum} style={{ marginBottom: '60px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px', color: '#fff', display: 'flex', alignItems: 'center', gap: '16px' }}>
                Season {seasonNum}
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text3)', background: 'var(--bg2)', padding: '4px 12px', borderRadius: '20px' }}>
                  {seasons[seasonNum].length} Episodes
                </span>
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {seasons[seasonNum].map(ep => (
                  <Link href={`/movie/${ep.id}`} key={ep.id} style={{ textDecoration: 'none' }}>
                    <div style={{ 
                      background: 'var(--bg2)', borderRadius: '12px', overflow: 'hidden', 
                      border: '1px solid var(--border)', transition: 'transform 0.2s, border-color 0.2s',
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%'
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--acc)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '16/9', background: '#111' }}>
                        {ep.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={ep.thumbnail_url} alt={ep.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', opacity: 0.5 }}>📺</div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', transition: 'background 0.2s' }} />
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '700', color: '#fff' }}>
                          S{ep.season_number} E{ep.episode_number}
                        </div>
                      </div>
                      
                      <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '700', color: '#fff', lineHeight: 1.4 }}>
                          {ep.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {ep.description || 'Watch this episode now.'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
