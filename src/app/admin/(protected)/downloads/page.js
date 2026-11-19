import DownloadsAdminClient from './DownloadsAdminClient';
import { createAdminClient } from '@/utils/supabase/admin';
import { getDownloadsAnalytics } from '@/lib/downloadsAnalytics';

export const metadata = {
  title: 'App Downloads & Storage — FlixOn Admin',
};

export default async function DownloadsPage() {
  const admin = createAdminClient();
  
  // Fetch initial shared apps, storage config, and live visitor analytics in parallel
  const [settingRes, storageSettingsRes, analytics] = await Promise.all([
    admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_apps_list')
      .maybeSingle(),
    admin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['storage_provider', 'b2_bucket_name', 'r2_bucket_name', 'cdn_domain']),
    getDownloadsAnalytics(admin)
  ]);

  let initialApps = [];
  if (settingRes.data?.setting_value) {
    try {
      initialApps = JSON.parse(settingRes.data.setting_value);
    } catch (_) {}
  }

  const storageSettings = storageSettingsRes.data;
  const getVal = (k, fb) => storageSettings?.find(s => s.setting_key === k)?.setting_value || fb;
  const storageInfo = {
    provider: getVal('storage_provider', 'b2'),
    b2Bucket: getVal('b2_bucket_name', 'flixonvideos'),
    r2Bucket: getVal('r2_bucket_name', 'movies'),
    cdnDomain: getVal('cdn_domain', 'cdn.flixon.net')
  };

  return (
    <DownloadsAdminClient
      initialApps={initialApps}
      storageInfo={storageInfo}
      initialAnalytics={analytics}
    />
  );
}
