import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
import NavbarClient from './NavbarClient';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const activeProfile = await getActiveProfile();

  let isActive = false;
  let daysLeft = 0;

  if (user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_end_date')
      .eq('email', user.email)
      .single();

    if (profile?.subscription_end_date) {
      const end = new Date(profile.subscription_end_date);
      const now = new Date();
      if (end > now) {
        isActive = true;
        daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      }
    }
  }

  return <NavbarClient user={user} activeProfile={activeProfile} isActive={isActive} daysLeft={daysLeft} />;
}

