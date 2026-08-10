import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { convertToWatchDays, requestPayout } from './actions';

export const metadata = {
  title: 'Affiliate Portal — Flixon',
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if referrals are enabled globally
  const { data: settings } = await supabase.from('admin_settings').select('*');
  const isEnabled = settings?.find(s => s.setting_key === 'referrals_enabled')?.setting_value === 'true';

  if (!isEnabled) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '900px', margin: '0 auto', padding: '100px 24px 60px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '20px' }}>Affiliate Program Disabled</h1>
          <p style={{ color: 'var(--text2)' }}>The referral program is currently disabled by administrators.</p>
          <Link href="/account" className="gms-btn gms-btn--ghost" style={{ marginTop: '20px' }}>← Back to Account</Link>
        </main>
      </div>
    );
  }

  // Get user profile (for ref code)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', user.email)
    .single();

  // Get earnings
  let earnings = { amount_earned: 0, amount_withdrawn: 0, amount_converted: 0 };
  const { data: earningsData } = await supabase
    .from('referral_earnings')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();
  if (earningsData) earnings = earningsData;

  const availableBalance = earnings.amount_earned - earnings.amount_withdrawn - earnings.amount_converted;

  // Get stats
  const { count: totalReferrals } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id);

  const { count: paidReferrals } = await supabase
    .from('referrals')
    .select('*', { count: 'exact', head: true })
    .eq('referrer_id', user.id)
    .eq('status', 'converted');

  const referralLink = `https://flixon.com/signup?ref=${profile?.ref_code || ''}`; // Replace with env base URL in production

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '900px', margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Link href="/account" className="gms-btn gms-btn--ghost" style={{ padding: '8px', width: '36px', height: '36px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0 }}>Affiliate Portal</h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px' }}>Available Balance</div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#4ade80' }}>
              {Number(availableBalance).toLocaleString()} UGX
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '8px' }}>
              Total Earned: {Number(earnings.amount_earned).toLocaleString()}
            </div>
          </div>
          
          <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px' }}>Total Signups</div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff' }}>
              {totalReferrals || 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '8px' }}>
              Paid Conversions: {paidReferrals || 0}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '32px', marginBottom: '32px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: 'var(--text2)' }}>Your Referral Link</h2>
          <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '16px' }}>
            Share this link with friends. When they sign up and pay for a subscription, you earn a commission!
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              readOnly 
              value={referralLink} 
              style={{ flex: 1, padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '15px' }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {/* Convert to Watch Days */}
          <div style={{ background: 'rgba(59,130,246,0.05)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#60a5fa' }}>Convert to Watch Days</h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Don't want to withdraw cash? Convert your earnings into active subscription days instantly! (Assuming 10,000 UGX = 30 Days)
            </p>
            <form action={convertToWatchDays}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input 
                  type="number" 
                  name="amount"
                  placeholder="Amount to convert"
                  required
                  max={availableBalance}
                  min={1000}
                  style={{ flex: 1, padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                />
                <button type="submit" className="gms-btn gms-btn--primary" style={{ background: '#3b82f6' }} disabled={availableBalance < 1000}>
                  Convert
                </button>
              </div>
            </form>
          </div>

          {/* Request Cash Payout */}
          <div style={{ background: 'rgba(74,222,128,0.05)', borderRadius: '16px', padding: '32px', border: '1px solid rgba(74,222,128,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#4ade80' }}>Request Payout</h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
              Withdraw your earnings to your Mobile Money account. Minimum withdrawal is 5,000 UGX.
            </p>
            <form action={requestPayout}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input 
                  type="number" 
                  name="amount"
                  placeholder="Amount to withdraw"
                  required
                  max={availableBalance}
                  min={5000}
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                />
                <input 
                  type="text" 
                  name="phone"
                  placeholder="Mobile Money Number (e.g. 077...)"
                  required
                  style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
                />
                <button type="submit" className="gms-btn gms-btn--primary" style={{ background: '#22c55e', width: '100%' }} disabled={availableBalance < 5000}>
                  Request Payout
                </button>
              </div>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
