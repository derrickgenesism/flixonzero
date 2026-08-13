import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ConvertToWatchDaysButton from './ConvertToWatchDaysButton';

export const metadata = { title: 'My Account — Flixon' };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Navbar />
        <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '900px', margin: '0 auto', padding: '100px 24px 60px' }}>
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

  const { data: profile } = await supabase.from('user_profiles').select('*').eq('email', user.email).single();
  const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);

  // PPV rentals
  const { data: ppvPurchases } = await supabase
    .from('ppv_purchases')
    .select('*, movies(id, title, thumbnail_url)')
    .eq('user_id', user.id)
    .eq('status', 'successful')
    .order('created_at', { ascending: false });

  // Referral earnings
  const { data: earnings } = await supabase.from('referral_earnings').select('*').eq('user_id', user.id).maybeSingle();
  const totalEarned    = Number(earnings?.amount_earned || 0);
  const totalWithdrawn = Number(earnings?.amount_withdrawn || 0);
  const totalConverted = Number(earnings?.amount_converted || 0);
  const availableBalance = Math.max(0, totalEarned - totalWithdrawn - totalConverted);

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
  // Conversion rate from settings
  const { data: convSetting } = await supabase.from('admin_settings').select('setting_value').eq('setting_key', 'referral_ugx_per_day').maybeSingle();
  const ugxPerDay = Number(convSetting?.setting_value || 500);
  const convertibleDays = Math.floor(availableBalance / ugxPerDay);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '900px', margin: '0 auto', padding: '100px 24px 60px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '32px' }}>My Account</h1>

        {/* Quick Links */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
          {[
            { href: '/my-list', label: '❤️ My List' },
            { href: '/account/referrals', label: '💰 Referrals' },
            { href: '/checkout', label: '💳 Subscribe' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="gms-btn gms-btn--ghost" style={{ padding: '10px 18px', fontSize: '14px' }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Subscription Card */}
        <div style={{ background: isSubscribed ? 'rgba(74,222,128,0.05)' : 'var(--bg2)', borderRadius: '16px', padding: '32px', marginBottom: '24px', border: `1px solid ${isSubscribed ? 'rgba(74,222,128,0.25)' : 'var(--border)'}` }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text2)' }}>Subscription</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              {isSubscribed ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 8px #4ade80' }} />
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>Premium Active</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text2)', fontSize: '15px' }}>
                    <strong style={{ color: '#fff' }}>{remainingText}</strong> remaining · Expires {new Date(profile.subscription_end_date).toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--text3)', display: 'inline-block' }} />
                    <span style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>No Active Plan</span>
                  </div>
                  <p style={{ margin: 0, color: 'var(--text2)', fontSize: '15px' }}>Subscribe to unlock unlimited movies and series.</p>
                </>
              )}
            </div>
            <Link href="/checkout" className={`gms-btn ${isSubscribed ? 'gms-btn--ghost' : 'gms-btn--primary'}`}>
              {isSubscribed ? 'Extend Subscription' : 'View Plans'}
            </Link>
          </div>
        </div>

        {/* Referral Balance — Convert to Watch Days */}
        {availableBalance > 0 && (
          <div style={{ background: 'rgba(251,191,36,0.06)', borderRadius: '16px', padding: '28px', marginBottom: '24px', border: '1px solid rgba(251,191,36,0.2)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'var(--text2)' }}>💰 Referral Balance</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: '#fbbf24', marginBottom: '4px' }}>
                  {Number(availableBalance).toLocaleString()} UGX
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text2)' }}>
                  Available to withdraw or convert to watch days
                  {convertibleDays > 0 && <strong style={{ color: '#fff' }}> ({convertibleDays} days @ {ugxPerDay.toLocaleString()} UGX/day)</strong>}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <ConvertToWatchDaysButton availableBalance={availableBalance} ugxPerDay={ugxPerDay} convertibleDays={convertibleDays} />
                <Link href="/account/referrals" className="gms-btn gms-btn--ghost" style={{ padding: '10px 18px', fontSize: '14px' }}>
                  View Details
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* PPV Rentals */}
        {ppvPurchases && ppvPurchases.length > 0 && (
          <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '28px', marginBottom: '24px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text2)' }}>🎬 My Rentals</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ppvPurchases.map(ppv => {
                const isActive = ppv.expires_at && new Date(ppv.expires_at) > new Date();
                const hoursLeft = isActive ? Math.max(0, Math.ceil((new Date(ppv.expires_at) - new Date()) / (1000 * 60 * 60))) : 0;
                return (
                  <div key={ppv.id} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border)' }}>
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

        {/* Account Details */}
        <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '28px', marginBottom: '24px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text2)' }}>Account Details</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Link href="/account/profile" className="gms-btn gms-btn--ghost" style={{ padding: '6px 14px', fontSize: '13px' }}>
                Edit Profile
              </Link>
              <form action="/auth/signout" method="POST">
                <button type="submit" className="gms-btn gms-btn--ghost" style={{ padding: '6px 14px', fontSize: '13px', color: '#ff6b6b', borderColor: 'rgba(255,107,107,0.2)' }}>
                  Sign Out
                </button>
              </form>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px', fontSize: '15px' }}>
            <div style={{ color: 'var(--text3)' }}>Email</div>
            <div style={{ color: '#fff' }}>{user.email}</div>
            <div style={{ color: 'var(--text3)' }}>Username</div>
            <div style={{ color: '#fff' }}>{profile?.username || 'Not set'}</div>
            <div style={{ color: 'var(--text3)' }}>Joined</div>
            <div style={{ color: '#fff' }}>{new Date(user.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            <div style={{ color: 'var(--text3)' }}>Genres</div>
            <div style={{ color: '#fff', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {profile?.genre_preferences?.length > 0
                ? profile.genre_preferences.map(g => (
                    <span key={g} style={{ padding: '2px 8px', background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.25)', borderRadius: '12px', fontSize: '12px', color: 'var(--acc)' }}>{g}</span>
                  ))
                : <span style={{ color: 'var(--text3)' }}>None set · <Link href="/onboarding" style={{ color: 'var(--text2)' }}>Set preferences</Link></span>
              }
            </div>
            <div style={{ color: 'var(--text3)' }}>Ref Code</div>
            <div style={{ color: '#fff', fontFamily: 'monospace', fontWeight: '700', letterSpacing: '2px' }}>{profile?.ref_code || '—'}</div>
          </div>
        </div>

        {/* Billing History */}
        <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '28px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', color: 'var(--text2)' }}>Billing History</h2>
          {transactions && transactions.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text3)' }}>
                    <th style={{ padding: '10px 0', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '10px 0', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '10px 0', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '10px 0', fontWeight: '600' }}>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 0', color: '#fff' }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: '14px 0', color: '#fff' }}>{Number(tx.amount).toLocaleString()} UGX</td>
                      <td style={{ padding: '14px 0' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', background: tx.status === 'successful' ? 'rgba(74,222,128,0.1)' : 'rgba(229,9,20,0.1)', color: tx.status === 'successful' ? '#4ade80' : '#ff6b6b' }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 0', color: 'var(--text3)', fontFamily: 'monospace', fontSize: '12px' }}>{tx.tx_ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: '15px' }}>No billing history yet.</div>
          )}
        </div>
      </main>
    </div>
  );
}
