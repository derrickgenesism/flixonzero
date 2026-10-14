import { headers } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { applyForAffiliate } from './actions';
import ReferralsClient from './ReferralsClient';

export const metadata = {
  title: 'Affiliate & Referral Portal — FlixOn',
};

export default async function ReferralsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const admin = createAdminClient();

  // Get user profile
  const { data: profile } = await admin
    .from('user_profiles')
    .select('*')
    .eq('email', user.email)
    .maybeSingle();

  if (!profile) redirect('/');

  // Get Affiliate Account
  const { data: affiliate } = await admin
    .from('affiliates')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle();

  // STATE 1: No Record (Needs to Apply)
  if (!affiliate) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ maxWidth: '640px', margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🤝</div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', color: '#fff' }}>Join the FlixOn Partner Program</h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
            Earn real cash by inviting friends, followers, and movie lovers! Get paid for every unique visitor who checks out FlixOn, plus earn high commissions whenever they subscribe.
          </p>

          <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>Partner Benefits:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>💰</span>
                <div>
                  <strong style={{ color: '#fff', fontSize: '14px' }}>Pay-Per-Click Cash</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text3)' }}>Earn money automatically for every unique person who visits FlixOn through your link.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>🎯</span>
                <div>
                  <strong style={{ color: '#fff', fontSize: '14px' }}>Generous Subscription Commissions</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text3)' }}>Earn instant cash commissions whenever someone purchases daily, weekly, or monthly VIP passes.</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <div>
                  <strong style={{ color: '#fff', fontSize: '14px' }}>Instant VIP Days or Mobile Money</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text3)' }}>Withdraw your earnings directly to MTN/Airtel Mobile Money or convert to free VIP movie days.</p>
                </div>
              </div>
            </div>
          </div>

          <form action={applyForAffiliate}>
            <button type="submit" className="gms-btn gms-btn--primary" style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700' }}>
              Apply to Become a Partner
            </button>
          </form>
        </main>
      </div>
    );
  }

  // STATE 2: Pending Approval
  if (affiliate.status === 'pending') {
    const submittedDate = affiliate.created_at ? new Date(affiliate.created_at) : null;
    const formattedDate = submittedDate ? (
      submittedDate.toLocaleDateString('en-UG', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Africa/Kampala'
      }) + ' at ' + submittedDate.toLocaleTimeString('en-UG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Kampala'
      }) + ' EAT'
    ) : 'Recently';

    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>⏳</div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', color: '#fff' }}>Application Under Review</h1>

          <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '12px', padding: '16px 20px', margin: '0 auto 24px', maxWidth: '380px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Date Submitted</div>
            <div style={{ color: '#fbbf24', fontSize: '15px', fontWeight: '700' }}>📅 {formattedDate}</div>
            <div style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '4px' }}>Status: Pending Admin Review</div>
          </div>

          <p style={{ color: 'var(--text2)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
            Thanks for applying! Our team reviews partner applications promptly. Once approved by admin, your custom tracking link, social sharing, and payout controls will automatically unlock here.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/account" className="gms-btn" style={{ background: 'var(--bg2)' }}>
              Return to Account
            </Link>
            <Link href="/support" className="gms-btn gms-btn--primary">
              Contact Support
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // STATE 3: Rejected
  if (affiliate.status === 'rejected') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ maxWidth: '600px', margin: '0 auto', padding: '120px 24px 60px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px', color: '#fff' }}>Application Status</h1>
          <p style={{ color: 'var(--text2)', fontSize: '15px', marginBottom: '32px', lineHeight: '1.6' }}>
            Your partner application is not active at this time. If you believe this is an error or would like to appeal, please contact support.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <Link href="/account" className="gms-btn" style={{ background: 'var(--bg2)' }}>
              Return to Account
            </Link>
            <Link href="/support" className="gms-btn gms-btn--primary">
              Contact Support
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // STATE 4: Approved (Dashboard)
  // Dynamically resolve real website origin from request headers
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const proto = headersList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const siteUrl = `${proto}://${host}`;
  const referralLink = `${siteUrl}/?ref=${affiliate.referral_code}`;

  // Get stats: Total Signups
  const { count: totalSignups } = await admin
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by', affiliate.id);

  // Get stats: Total Unique Clicks
  const { count: totalClicks } = await admin
    .from('affiliate_clicks')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliate.id);

  // Get recent commissions / activity ledger
  const { data: commissions } = await admin
    .from('affiliate_commissions')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      <main style={{ maxWidth: '960px', margin: '0 auto', padding: '100px 24px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <Link href="/account" className="gms-btn gms-btn--ghost" style={{ padding: '8px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
            </svg>
          </Link>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '900', margin: '0 0 4px' }}>Affiliate Partner Portal</h1>
            <p style={{ color: 'var(--text3)', fontSize: '14px', margin: 0 }}>Track referrals, view earnings, and withdraw cash</p>
          </div>
        </div>

        <ReferralsClient 
          affiliate={affiliate}
          referralLink={referralLink}
          totalSignups={totalSignups || 0}
          totalClicks={totalClicks || 0}
          commissions={commissions || []}
        />
      </main>
    </div>
  );
}
