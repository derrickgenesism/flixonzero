const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');
import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AffiliateEarnCard from './AffiliateEarnCard';
import { checkTransactionStatus } from '@/app/checkout/actions';
import { parseAffiliateSettings } from '@/lib/affiliateCalculations';

export const metadata = { title: 'My Account — Flixon' };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 24px 60px', boxSizing: 'border-box' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '32px' }}>Profile Dashboard</h1>
          
          <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '32px', marginBottom: '24px', border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '24px' }}>👤</div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>Free Access</h2>
            <p style={{ margin: '0 auto 24px', color: 'var(--text2)', fontSize: '15px', maxWidth: '400px', lineHeight: '1.6' }}>
              You are currently browsing with guest access. Sign in or upgrade to a premium plan to unlock unlimited HD movies, series, and downloads.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/login" className="gms-btn gms-btn--ghost" style={{ padding: '12px 24px', fontSize: '15px' }}>
                Sign In
              </Link>
              <Link href="/checkout" className="gms-btn gms-btn--primary" style={{ padding: '12px 24px', fontSize: '15px' }}>
                Upgrade to Premium
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Background Verification of Recent Pending Transactions (Skip manual transfers)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: pendingTxs } = await supabase
    .from('transactions')
    .select('tx_ref')
    .eq('user_id', user.id)
    .eq('status', 'pending')
    .gte('created_at', twoHoursAgo);
    
  if (pendingTxs && pendingTxs.length > 0) {
    for (const tx of pendingTxs) {
      if (!tx.tx_ref.includes('extra_profile') && !tx.tx_ref.includes('PPV') && !tx.tx_ref.startsWith('MAN_')) {
        await checkTransactionStatus(tx.tx_ref);
      }
    }
  }

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('email', user.email).single();
  const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);

  // PPV rentals
  const { data: ppvPurchases } = await supabase
    .from('ppv_purchases')
    .select('*, movies(id, title, thumbnail_url)')
    .eq('user_id', user.id)
    .eq('status', 'successful')
    .order('created_at', { ascending: false });

  // Referral earnings / Affiliate balance
  let availableBalance = 0;
  let affiliateCode = null;
  let affiliateStatus = null;
  if (profile?.id) {
    const { data: aff } = await _injectedAdminClient()
      .from('affiliates')
      .select('referral_code, balance, status')
      .eq('user_id', profile.id)
      .maybeSingle();
    availableBalance = Math.max(0, Number(aff?.balance || 0));
    affiliateCode = aff?.referral_code || null;
    affiliateStatus = aff?.status || null;
  }

  const isSubscribed = profile?.subscription_end_date && new Date(profile.subscription_end_date) > new Date();
  
  let remainingText = '';
  if (isSubscribed) {
    const diffMs = new Date(profile.subscription_end_date) - new Date();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      remainingText = `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      remainingText = `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      remainingText = `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    }
  }

  // Fetch active plans and affiliate settings
  const { data: plans } = await _injectedAdminClient()
    .from('subscription_plans')
    .select('id, name, price, duration_days')
    .eq('is_active', true)
    .order('price', { ascending: true });

  const { data: affiliateSettingsRows } = await _injectedAdminClient()
    .from('admin_settings')
    .select('setting_key, setting_value')
    .like('setting_key', 'affiliate%');

  const affiliateConfig = parseAffiliateSettings(affiliateSettingsRows || []);
  const boostData = affiliateConfig.isBoostActive ? {
    multiplier: String(affiliateConfig.boostMultiplier),
    name: affiliateConfig.boostName
  } : null;

  const hasPendingManual = transactions?.some(t => t.status === 'pending');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '100px 20px 60px', boxSizing: 'border-box', width: '100%' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '24px' }}>My Account</h1>

        {hasPendingManual && (
          <div style={{ background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '14px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>⏳</span>
            <div>
              <strong style={{ color: '#fff', fontSize: '14px', display: 'block', marginBottom: '2px' }}>
                Payment Verification in Progress
              </strong>
              <span style={{ color: '#bae6fd', fontSize: '13px', lineHeight: '1.5' }}>
                We received your payment submission. An administrator will verify the transfer and activate your subscription shortly.
              </span>
            </div>
          </div>
        )}

        {/* Quick Navigation Links */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
          {[
            { href: '/my-list', label: '❤️ My List' },
            { href: '/account/referrals', label: '💰 Partner Dashboard' },
            { href: '/checkout', label: '💳 View VIP Plans' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="gms-btn gms-btn--ghost" style={{ padding: '9px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Subscription Status Card */}
        <div style={{ background: isSubscribed ? 'rgba(74,222,128,0.05)' : 'var(--bg2)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', border: `1px solid ${isSubscribed ? 'rgba(74,222,128,0.25)' : 'var(--border)'}`, boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subscription Status</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ minWidth: 0, flex: '1 1 240px' }}>
              {isSubscribed ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80', flexShrink: 0 }} />
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>VIP Pass Active</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text2)', fontSize: '14px', lineHeight: '1.5' }}>
                    <strong style={{ color: '#4ade80' }}>{remainingText}</strong> remaining · Expires {new Date(profile.subscription_end_date).toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text3)', display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>Free Account</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text2)', fontSize: '14px' }}>Subscribe to unlock unlimited movies, series, and downloads.</p>
                </>
              )}
            </div>
            <Link href="/checkout" className={`gms-btn ${isSubscribed ? 'gms-btn--ghost' : 'gms-btn--primary'}`} style={{ whiteSpace: 'nowrap' }}>
              {isSubscribed ? 'Extend Subscription' : 'Upgrade to VIP Pass'}
            </Link>
          </div>
        </div>

        {/* Affiliate & Earning Card */}
        <AffiliateEarnCard
          affiliateCode={affiliateCode}
          affiliateStatus={affiliateStatus}
          availableBalance={availableBalance}
          subscriptionEndDate={profile?.subscription_end_date}
          plans={plans || []}
          boostData={boostData}
          affiliateConfig={affiliateConfig}
          siteUrl="https://flixon.net"
        />

        {/* PPV Rentals */}
        {ppvPurchases && ppvPurchases.length > 0 && (
          <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎬 My Active Rentals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ppvPurchases.map(ppv => {
                const isActive = ppv.expires_at && new Date(ppv.expires_at) > new Date();
                const hoursLeft = isActive ? Math.max(0, Math.ceil((new Date(ppv.expires_at) - new Date()) / (1000 * 60 * 60))) : 0;
                return (
                  <div key={ppv.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
                    {ppv.movies?.thumbnail_url && (
                      <img src={ppv.movies.thumbnail_url} alt={ppv.movies?.title} style={{ width: '52px', height: '78px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', color: '#fff', marginBottom: '4px', fontSize: '15px' }}>{ppv.movies?.title}</div>
                      <div style={{ fontSize: '13px', color: isActive ? '#4ade80' : 'var(--text3)' }}>
                        {isActive ? `⏱ ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} remaining` : 'Rental expired'}
                      </div>
                    </div>
                    {isActive && (
                      <Link href={`/movie/${ppv.movie_id}`} className="gms-btn gms-btn--primary" style={{ padding: '8px 16px', fontSize: '13px', flexShrink: 0 }}>
                        Watch
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Account Details (Fully Responsive Layout with zero overflow) */}
        <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '24px 28px', marginBottom: '24px', border: '1px solid var(--border)', boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', margin: 0, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account Information</h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <Link href="/account/profile" className="gms-btn gms-btn--ghost" style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                ✏️ Edit Profile
              </Link>
              <form action="/auth/signout" method="POST" style={{ margin: 0 }}>
                <button type="submit" className="gms-btn gms-btn--ghost" style={{ padding: '6px 14px', fontSize: '12px', color: '#f87171', borderColor: 'rgba(239,68,68,0.25)', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                  Sign Out
                </button>
              </form>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
            {/* Email Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '8px', minWidth: 0 }}>
              <span style={{ color: 'var(--text3)', fontSize: '13px', fontWeight: '500' }}>Email Address</span>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', wordBreak: 'break-all', overflowWrap: 'anywhere', maxWidth: '100%' }}>
                {user.email}
              </span>
            </div>

            {/* Username Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '8px', minWidth: 0 }}>
              <span style={{ color: 'var(--text3)', fontSize: '13px', fontWeight: '500' }}>Username</span>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600', wordBreak: 'break-all' }}>
                @{profile?.username || 'Not set'}
              </span>
            </div>

            {/* Joined Date Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '8px', minWidth: 0 }}>
              <span style={{ color: 'var(--text3)', fontSize: '13px', fontWeight: '500' }}>Member Since</span>
              <span style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                {new Date(user.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Partner Code Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(251,191,36,0.04)', borderRadius: '10px', border: '1px solid rgba(251,191,36,0.15)', flexWrap: 'wrap', gap: '8px', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '14px' }}>🤝</span>
                <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: '600' }}>Partner Code</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{ color: '#fff', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '1px', fontSize: '14px', background: 'rgba(0,0,0,0.4)', padding: '2px 8px', borderRadius: '6px' }}>
                  {affiliateCode || 'None'}
                </span>
                <Link href="/account/referrals" style={{ fontSize: '12px', color: '#fbbf24', textDecoration: 'underline', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  {affiliateCode ? 'Open Partner Portal →' : 'Join Program →'}
                </Link>
              </div>
            </div>

            {/* Genre Preferences Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.06)', flexWrap: 'wrap', gap: '8px', minWidth: 0 }}>
              <span style={{ color: 'var(--text3)', fontSize: '13px', fontWeight: '500' }}>Favorite Genres</span>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '100%' }}>
                {profile?.genre_preferences?.length > 0
                  ? profile.genre_preferences.map(g => (
                      <span key={g} style={{ padding: '2px 8px', background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: '12px', fontSize: '11px', color: '#ff6b6b', fontWeight: '600' }}>{g}</span>
                    ))
                  : <span style={{ color: 'var(--text3)', fontSize: '13px' }}>None set · <Link href="/onboarding" style={{ color: 'var(--text2)', textDecoration: 'underline' }}>Set preferences</Link></span>
                }
              </div>
            </div>
          </div>
        </div>

        {/* Billing History (Smoothly scrollable, zero word clipping) */}
        <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '24px 28px', border: '1px solid var(--border)', boxSizing: 'border-box', width: '100%', maxWidth: '100%' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Billing History</h2>
          {transactions && transactions.length > 0 ? (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '480px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '10px 12px', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '10px 12px', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '10px 12px', fontWeight: '600' }}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 12px', color: '#fff', whiteSpace: 'nowrap' }}>
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '12px 12px', color: '#fff', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {Number(tx.amount).toLocaleString()} {tx.currency || 'UGX'}
                      </td>
                      <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          background: tx.status === 'successful' 
                            ? 'rgba(74,222,128,0.15)' 
                            : (tx.status === 'pending' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(239,68,68,0.15)'), 
                          color: tx.status === 'successful' 
                            ? '#4ade80' 
                            : (tx.status === 'pending' ? '#facc15' : '#f87171'),
                          border: `1px solid ${tx.status === 'successful' ? 'rgba(74,222,128,0.3)' : (tx.status === 'pending' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)')}`
                        }}>
                          {tx.status === 'pending' ? 'Pending Approval' : (tx.status === 'successful' ? 'Paid' : tx.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 12px', color: 'var(--text3)', fontFamily: 'monospace', fontSize: '11px', wordBreak: 'break-all' }}>
                        {tx.tx_ref}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text3)', fontSize: '14px' }}>
              No billing transactions recorded yet.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
