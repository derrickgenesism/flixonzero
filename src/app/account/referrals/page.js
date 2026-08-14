import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { applyForAffiliate, convertToWatchDays, requestPayout } from './actions';
import crypto from 'crypto';

export const metadata = {
  title: 'Affiliate Portal — Flixon',
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', user.email)
    .single();

  if (!profile) redirect('/');

  // Get Affiliate Account
  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle();

  // STATE 1: No Record (Needs to Apply)
  if (!affiliate) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '600px', margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🤝</div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', color: '#fff' }}>Join the Affiliate Program</h1>
          <p style={{ color: 'var(--text2)', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
            Partner with Flixon and start earning! Get paid for every unique visitor you bring to our platform, plus huge commissions when they subscribe. 
          </p>
          <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Why Join?</h3>
            <ul style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px', margin: 0 }}>
              <li>Instant cash for unique link clicks.</li>
              <li>High commissions on daily and monthly passes.</li>
              <li>Convert earnings to free Watch Days or withdraw cash directly to Mobile Money.</li>
              <li>Real-time tracking dashboard.</li>
            </ul>
          </div>
          <form action={applyForAffiliate}>
            <button type="submit" className="gms-btn gms-btn--primary" style={{ width: '100%', padding: '16px', fontSize: '16px' }}>
              Apply Now
            </button>
          </form>
        </main>
      </div>
    );
  }

  // STATE 2: Pending Approval
  if (affiliate.status === 'pending') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '600px', margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⏳</div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', color: '#fff' }}>Application Under Review</h1>
          <p style={{ color: 'var(--text2)', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
            Thanks for applying! Our team is currently reviewing your application. You will receive an in-app message once you are approved and your tracking link is ready.
          </p>
          <Link href="/account" className="gms-btn" style={{ background: 'var(--bg2)' }}>
            Return to Account
          </Link>
        </main>
      </div>
    );
  }

  // STATE 3: Rejected
  if (affiliate.status === 'rejected') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '600px', margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>❌</div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', color: '#fff' }}>Application Denied</h1>
          <p style={{ color: 'var(--text2)', fontSize: '16px', marginBottom: '32px', lineHeight: '1.6' }}>
            Unfortunately, your affiliate application was not approved at this time.
          </p>
          <Link href="/account" className="gms-btn" style={{ background: 'var(--bg2)' }}>
            Return to Account
          </Link>
        </main>
      </div>
    );
  }

  // STATE 4: Approved (Dashboard)
  const availableBalance = Number(affiliate?.balance || 0);

  // Get stats: Total Signups
  const { count: totalSignups } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('referred_by', affiliate?.id);

  // Get stats: Total Clicks
  const { count: totalClicks } = await supabase
    .from('affiliate_clicks')
    .select('*', { count: 'exact', head: true })
    .eq('affiliate_id', affiliate?.id);

  const referralLink = `https://flixon.com/?ref=${affiliate?.referral_code || ''}`; // Replace with env base URL in production

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
              {availableBalance.toLocaleString()} UGX
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '8px' }}>
              Total Earned: {Number(affiliate?.total_earned || 0).toLocaleString()} UGX
            </div>
          </div>
          
          <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '8px' }}>Total Signups</div>
            <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff' }}>
              {totalSignups || 0}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text3)', marginTop: '8px' }}>
              Unique Link Clicks: {totalClicks || 0}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '32px', marginBottom: '32px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: 'var(--text2)' }}>Your Referral Link</h2>
          <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '16px' }}>
            Share this link everywhere! You instantly earn money for every unique visitor who clicks it, plus a big commission if they subscribe!
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
