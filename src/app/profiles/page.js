import { getProfiles } from './actions';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import ProfilesClient from './ProfilesClient';

export const metadata = { title: 'Who is watching? — Flixon' };

export default async function ProfilesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const { data: adminSettings } = await supabase.from('admin_settings').select('*');
  const getSetting = (key, defaultVal) => adminSettings?.find(s => s.setting_key === key)?.setting_value || defaultVal;

  if (getSetting('profiles_enabled', 'true') === 'false') {
    redirect('/');
  }

  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('extra_profile_slots')
    .eq('email', user.email)
    .single();

  const freeLimit = parseInt(getSetting('free_profiles_limit', '2')) || 2;
  const extraSlots = userProfile?.extra_profile_slots || 0;
  let maxAllowed = freeLimit + extraSlots;
  if (maxAllowed > 5) maxAllowed = 5;

  const extraProfilePrice = parseInt(getSetting('extra_profile_price', '5000')) || 5000;

  const profiles = await getProfiles();

  return (
    <div style={{ minHeight: '100vh', background: '#141414', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px' }}>
        <img src="/logo.png" alt="FlixOn" style={{ height: '56px', objectFit: 'contain' }} />
      </div>
      
      <main style={{ padding: '40px', maxWidth: '800px', width: '100%' }}>
        <ProfilesClient 
          initialProfiles={profiles} 
          maxAllowed={maxAllowed} 
          extraProfilePrice={extraProfilePrice} 
        />
      </main>
    </div>
  );
}
