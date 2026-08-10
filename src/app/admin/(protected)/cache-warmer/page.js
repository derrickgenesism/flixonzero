import { createClient } from '@/utils/supabase/server';
import WarmerClient from './WarmerClient';

export const metadata = { title: 'Cache Warmer — Admin' };

export default async function CacheWarmerPage() {
  const supabase = await createClient();

  // Fetch all video URLs
  const { data: movies } = await supabase
    .from('movies')
    .select('title, video_url')
    .not('video_url', 'is', null)
    .neq('video_url', '');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', margin: 0 }}>Video Cache Warmer</h1>
      </div>
      
      <p style={{ color: 'var(--text2)', marginBottom: '30px', maxWidth: '800px', lineHeight: '1.6' }}>
        Use this tool to automatically load and play a few seconds of your videos in the background. 
        This forces Cloudflare and CDN edge servers to cache the video segments, ensuring real users 
        experience zero buffering when they start watching.
      </p>

      <WarmerClient dbMovies={movies || []} />
    </div>
  );
}
