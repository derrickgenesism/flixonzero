import { createClient } from '@/utils/supabase/server';
import { getStorageConfig } from '@/utils/storage';
import WarmerClient from './WarmerClient';

export const metadata = { title: '🔥 Storage Hub & Video Warmer — Admin' };
export const dynamic = 'force-dynamic';

export default async function CacheWarmerPage() {
  const supabase = await createClient();

  // Fetch all active movies with video URLs
  const { data: movies } = await supabase
    .from('movies')
    .select('id, title, video_url')
    .not('video_url', 'is', null)
    .neq('video_url', '')
    .order('created_at', { ascending: false });

  let defaultProvider = 'b2';
  try {
    const config = await getStorageConfig();
    defaultProvider = config.provider;
  } catch (_) {}

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '28px', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🔥</span> Storage Hub & Video Warmer
          </h1>
          <p style={{ color: 'var(--text2)', margin: 0, maxWidth: '800px', lineHeight: '1.5' }}>
            Comprehensive storage management across <strong>Backblaze B2</strong> and <strong>Cloudflare R2</strong>.
            Warm videos on the CDN edge for 0 buffering, search and preview bucket files, scan and clean duplicate raw videos, and stream batch external URLs directly into storage!
          </p>
        </div>
      </div>

      <WarmerClient dbMovies={movies || []} initialProvider={defaultProvider} />
    </div>
  );
}
