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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px', padding: '0 24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.25)', borderRadius: '20px', padding: '6px 16px', marginBottom: '20px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--acc)', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--acc)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Premium Membership</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: '900', margin: '0 0 14px', letterSpacing: '-1px', lineHeight: 1.05 }}>
            Choose Your Plan
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '16px', maxWidth: '400px', margin: '0 auto', lineHeight: '1.6' }}>
            Unlock unlimited streaming of premium movies and series. Cancel anytime.
          </p>
        </div>

        <div style={{ padding: '0 24px' }}>
          <CheckoutClient plans={plans || []} promoEnabled={promoEnabled} />
        </div>

        {/* Trust badges */}
        <div style={{ textAlign: 'center', marginTop: '48px', display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', padding: '0 24px' }}>
          {['Secure payments via Mobile Money', 'Cancel anytime', 'Instant activation'].map(text => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text3)', fontSize: '13px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {text}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
