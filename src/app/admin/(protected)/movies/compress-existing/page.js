import { listR2Videos } from './actions';
import ExistingClient from './ExistingClient';

export const metadata = { title: 'Compress Existing Videos — Admin' };
export const dynamic = 'force-dynamic';

export default async function CompressExistingPage() {
  const { videos, error } = await listR2Videos('');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 10px' }}>Compress Existing Cloudflare Videos</h1>
          <p style={{ color: 'var(--text2)', margin: 0, maxWidth: '600px' }}>
            This page lists all the raw video files currently sitting in your Cloudflare R2 bucket. 
            Click "Compress" to queue them for your local background compressor.
          </p>
        </div>
      </div>

      {error ? (
        <div style={{ padding: '20px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', borderRadius: '4px', color: '#fff' }}>
          <strong>Error fetching R2 videos:</strong> {error}
        </div>
      ) : (
        <ExistingClient initialVideos={videos} />
      )}
    </div>
  );
}
