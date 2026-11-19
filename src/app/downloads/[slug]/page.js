import { createAdminClient } from '@/utils/supabase/admin';
import PublicDownloadsClient from '../PublicDownloadsClient';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: setting } = await admin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'shared_apps_list')
    .maybeSingle();

  let appName = 'Premium Android App';
  if (setting?.setting_value) {
    try {
      const apps = JSON.parse(setting.setting_value);
      const found = apps.find(a => a.id === slug);
      if (found) appName = found.name;
    } catch (_) {}
  }

  return {
    title: `Download ${appName} — Fast Direct APK Download | FlixOn`,
    description: `Download ${appName} verified clean APK with fast direct download, plus stream free Luganda translated movies by VJ Junior, VJ Emmy, VJ Ice P on FlixOn.`
  };
}

export default async function DownloadSlugPage({ params }) {
  const { slug } = await params;
  const admin = createAdminClient();

  // 1. Fetch Shared Apps
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

  const activeApps = (apps || []).filter(a => a.is_active !== false);

  // 2. Fetch Free & Trending Movies
  const { data: freeDbMovies } = await admin
    .from('movies')
    .select('id, title, description, thumbnail_url, type, categories, release_year')
    .contains('categories', ['Free to Watch'])
    .limit(6);

  const { data: trendingMovies } = await admin
    .from('movies')
    .select('id, title, description, thumbnail_url, type, categories, release_year')
    .neq('type', 'broken_quarantine')
    .order('created_at', { ascending: false })
    .limit(8);

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
      initialAppKey={slug} 
    />
  );
}
