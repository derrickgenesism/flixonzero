import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const activeProfile = await getActiveProfile();

  let isActive = false;
  let isExpiringSoon = false;
  let hoursLeft = 0;
  let daysLeft = 0;
  let hasExpired = false;

  if (user) {
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('user_profiles')
      .select('subscription_end_date, subscription_plan')
      .eq('email', user.email)
      .maybeSingle();

    if (profile?.subscription_end_date) {
      const end = new Date(profile.subscription_end_date);
      const now = new Date();
      const diffMs = end - now;

      if (diffMs > 0) {
        isActive = true;
        const totalHours = Math.ceil(diffMs / (1000 * 60 * 60));
        if (totalHours <= 24) {
          isExpiringSoon = true;
          hoursLeft = totalHours;
        } else {
          daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }
      } else {
        hasExpired = true;
      }
    }
  }

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
      isActive={isActive}
      isExpiringSoon={isExpiringSoon}
      hoursLeft={hoursLeft}
      daysLeft={daysLeft}
      hasExpired={hasExpired}
      seriesEnabled={seriesEnabled}
    />
  );
}
