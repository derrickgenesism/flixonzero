import { createAdminClient } from '@/utils/supabase/admin';
import PublicDownloadsClient from './PublicDownloadsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Downloaders Premium & Watch Free Movies — FlixOn Uganda',
  description: 'Download premium Android APKs with zero ads, high-speed video downloaders, and stream free Luganda translated movies by VJ Junior, VJ Emmy, VJ Ice P & all VJs.',
  openGraph: {
    title: 'Downloaders Premium & Free Luganda Movies — FlixOn',
    description: 'High-speed Android apps & 100% free Luganda translated movies online. Direct storage download.'
  }
};

export default async function DownloadsPublicPage({ searchParams }) {
  const admin = createAdminClient();
  const params = await searchParams;
  const initialAppKey = params?.app || '';

  // 1. Fetch Shared Apps from admin_settings
  const { data: setting } = await admin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'shared_apps_list')
    .maybeSingle();

  let apps = [];
  if (setting?.setting_value) {
    try {
      apps = JSON.parse(setting.setting_value);
    } catch (_) {}
  }

  // Filter only active apps
  const activeApps = (apps || []).filter(a => a.is_active !== false);

  // 2. Fetch Free Movies from database
  const { data: freeDbMovies } = await admin
    .from('movies')
    .select('id, title, description, thumbnail_url, type, categories, release_year')
    .contains('categories', ['Free to Watch'])
    .limit(6);

  // 3. Also fetch recent trending movies to ensure a full, rich 8-movie grid
  const { data: trendingMovies } = await admin
    .from('movies')
    .select('id, title, description, thumbnail_url, type, categories, release_year')
    .neq('type', 'broken_quarantine')
    .order('created_at', { ascending: false })
    .limit(8);

  // Merge and deduplicate by movie ID
  const movieMap = new Map();
  (freeDbMovies || []).forEach(m => movieMap.set(m.id, { ...m, isFreeHighlight: true }));
  (trendingMovies || []).forEach(m => {
    if (!movieMap.has(m.id)) {
      movieMap.set(m.id, { ...m, isFreeHighlight: false });
    }
  });

  const displayMovies = Array.from(movieMap.values()).slice(0, 8);

  return (
    <PublicDownloadsClient 
      apps={activeApps} 
      movies={displayMovies} 
      initialAppKey={initialAppKey} 
    />
  );
}
