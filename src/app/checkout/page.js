import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import CheckoutClient from './CheckoutClient';

export const metadata = {
  title: 'Subscribe — Flixon',
  description: 'Choose a Flixon plan and unlock unlimited premium movies and series.',
};

export default async function CheckoutPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  const { data: promoSetting } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'promo_enabled')
    .single();
  
  const promoEnabled = promoSetting?.setting_value === 'true';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div style={{ padding: '0 24px' }}>
          <CheckoutClient plans={plans || []} promoEnabled={promoEnabled} />
        </div>
      </main>
    </div>
  );
}
