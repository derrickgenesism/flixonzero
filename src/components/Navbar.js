import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const activeProfile = await getActiveProfile();

  const admin = createAdminClient();
  const { data: settings } = await admin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'series_enabled')
    .maybeSingle();

  const seriesEnabled = settings?.setting_value === 'true';

  return (
    <NavbarClient
      user={user}
      activeProfile={activeProfile}
      seriesEnabled={seriesEnabled}
    />
  );
}
