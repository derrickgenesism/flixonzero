const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import CheckoutClient from './CheckoutClient';
import { OFFER_SETTING_KEYS, parseOfferSettings } from '@/lib/offer';

// Plans/offers/subscription state must never be served from a cache.
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Subscribe â€” Flixon',
  description: 'Choose a Flixon plan and unlock unlimited premium movies and series.',
};

import { headers } from 'next/headers';
import { getClientIpFromHeaders, getSecuritySettings, checkVpnOrProxy } from '@/lib/ipShield';

export default async function CheckoutPage() {
  const supabase = await createClient();

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });

  // Query settings for promo, offers, manual payment, and gateway availability
  const { data: checkoutSettings } = await _injectedAdminClient().from('admin_settings')
    .select('setting_key, setting_value')
    .in('setting_key', [
      'promo_enabled',
      'flutterwave_secret_key',
      'manual_payment_enabled',
      'manual_payment_title',
      'manual_payment_instructions',
      'manual_payment_numbers',
      'platform_name',
      'platform_currency',
      ...OFFER_SETTING_KEYS
    ]);
  
  const promoEnabled = checkoutSettings?.find(s => s.setting_key === 'promo_enabled')?.setting_value === 'true';
  const flwSecret = checkoutSettings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value;
  const hasAutomatedPayment = Boolean(flwSecret && flwSecret.trim().length > 0);

  const manualPaymentSettings = {
    enabled: checkoutSettings?.find(s => s.setting_key === 'manual_payment_enabled')?.setting_value !== 'false',
    title: checkoutSettings?.find(s => s.setting_key === 'manual_payment_title')?.setting_value || 'Direct Mobile Money / Bank Transfer',
    instructions: checkoutSettings?.find(s => s.setting_key === 'manual_payment_instructions')?.setting_value || 'Send the exact plan amount to one of the numbers above. Enter the phone number you paid from below and click "I Have Sent Money".',
    numbers: checkoutSettings?.find(s => s.setting_key === 'manual_payment_numbers')?.setting_value || 'MTN Mobile Money: 0770000000\nAirtel Money: 0750000000',
  };

  const currency = checkoutSettings?.find(s => s.setting_key === 'platform_currency')?.setting_value || 'UGX';
  const platformName = checkoutSettings?.find(s => s.setting_key === 'platform_name')?.setting_value || 'FlixOn';
  const offer = parseOfferSettings(checkoutSettings);

  const h = await headers();
  const clientIp = getClientIpFromHeaders(h);
  const secSettings = await getSecuritySettings();
  let vpnDetected = false;

  if (secSettings.vpnBlockingEnabled) {
    const vpnInfo = await checkVpnOrProxy(clientIp);
    vpnDetected = vpnInfo.isVpn;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div style={{ padding: '0 24px' }}>
          <CheckoutClient
            plans={plans || []}
            promoEnabled={promoEnabled}
            offer={offer}
            vpnDetected={vpnDetected}
            clientIp={clientIp}
            hasAutomatedPayment={hasAutomatedPayment}
            manualPaymentSettings={manualPaymentSettings}
            currency={currency}
            platformName={platformName}
          />
        </div>
      </main>
    </div>
  );
}
