const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import CheckoutClient from './CheckoutClient';
import { OFFER_SETTING_KEYS, parseOfferSettings } from '@/lib/offer';

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

  // One query for promo + limited-time offer settings (no extra DB round-trip)
  const { data: checkoutSettings } = await _injectedAdminClient().from('admin_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['promo_enabled', ...OFFER_SETTING_KEYS]);
  
  const promoEnabled = checkoutSettings?.find(s => s.setting_key === 'promo_enabled')?.setting_value === 'true';
  const offer = parseOfferSettings(checkoutSettings);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div style={{ padding: '0 24px' }}>
          <CheckoutClient plans={plans || []} promoEnabled={promoEnabled} offer={offer} />
        </div>
      </main>
    </div>
  );
}
