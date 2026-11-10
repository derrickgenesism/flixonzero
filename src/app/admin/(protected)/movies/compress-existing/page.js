import { listStorageVideos } from './actions';
import ExistingClient from './ExistingClient';

export const metadata = { title: '🗜 Squeeze VPS Compressor — Admin' };
export const dynamic = 'force-dynamic';

export default async function CompressExistingPage({ searchParams }) {
  const params = await searchParams;
  const currentProvider = (params?.provider || 'b2').toLowerCase();
  const { videos, error, provider, bucket } = await listStorageVideos(currentProvider, '');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🗜</span> Squeeze VPS Video Compressor
          </h1>
          <p style={{ color: 'var(--text2)', margin: 0, maxWidth: '700px', lineHeight: '1.5' }}>
            Powered by your unconstrained VPS with FFmpeg & Squeeze encoding (CRF 28, FastStart, smart 720p scaling).
            Queue videos to compress and close your browser — the VPS compressor runs 24/7 in the background!
          </p>
        </div>

        {/* Storage Provider Selector */}
        <div style={{ display: 'flex', background: 'var(--bg2)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <a
            href="?provider=b2"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              background: currentProvider === 'b2' ? '#ff3b30' : 'transparent',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📦</span> Backblaze B2 (flixonvideos)
          </a>
          <a
            href="?provider=r2"
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              textDecoration: 'none',
              background: currentProvider === 'r2' ? '#f38020' : 'transparent',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>☁️</span> Cloudflare R2 (movies)
          </a>
        </div>
      </div>

      {error ? (
        <div style={{ padding: '20px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', borderRadius: '8px', color: '#fff' }}>
          <strong>Error listing storage files:</strong> {error}
        </div>
      ) : (
        <ExistingClient
          initialVideos={videos || []}
          currentProvider={currentProvider}
          bucketName={bucket}
        />
      )}
    </div>
  );
}
