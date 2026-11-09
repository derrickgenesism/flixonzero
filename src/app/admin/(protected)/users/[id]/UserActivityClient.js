'use client';

import { useState } from 'react';
import Link from 'next/link';

function fmtDate(d) {
  if (!d) return 'Never';
  return new Date(d).toLocaleString('en-UG', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: 'var(--bg2)', padding: '18px 20px', borderRadius: '10px', border: '1px solid var(--border)' }}>
      <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '24px', fontWeight: '900', color: color || '#fff' }}>{value}</div>
      {sub && <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

export default function UserActivityClient({
  userProfile,
  authData,
  activityStatus,
  statusColor,
  stats,
  topPages,
  timeline,
  watchHistory,
  transactions,
  affiliateData,
}) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'activity', label: '⏱ Activity Timeline' },
    { key: 'watching', label: '🎬 Watch History' },
    { key: 'payments', label: '💳 Payments' },
  ];

  return (
    <div>
      {/* Back link */}
      <div style={{ marginBottom: '20px' }}>
        <Link href="/admin/users" style={{ color: 'var(--text2)', textDecoration: 'none', fontSize: '14px' }}>
          ← Back to User Management
        </Link>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 4px' }}>User Analytics</h1>
          <p style={{ color: 'var(--text2)', margin: 0, fontSize: '14px' }}>
            {userProfile.email}
            {userProfile.username ? ` (@${userProfile.username})` : ''}
            {' · '}
            <span style={{ color: userProfile.role === 'administrator' ? '#fbbf24' : 'var(--text3)' }}>
              {userProfile.role || 'user'}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{
            background: 'var(--bg2)', padding: '12px 20px', borderRadius: '8px',
            borderLeft: `4px solid ${statusColor}`
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Activity Status</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: statusColor }}>{activityStatus}</div>
          </div>
          <Link href={`/admin/users/${userProfile.id}/edit`} style={{
            padding: '10px 18px', background: 'var(--acc)', color: '#fff',
            borderRadius: '8px', textDecoration: 'none', fontSize: '13px', fontWeight: '700'
          }}>
            ✏ Edit User
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              background: activeTab === t.key ? 'var(--acc)' : 'transparent',
              color: activeTab === t.key ? '#fff' : 'var(--text2)',
              border: 'none', padding: '8px 16px', borderRadius: '7px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div>
          {/* Account Info Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Account Created" value={authData.created_at ? new Date(authData.created_at).toLocaleDateString() : 'Unknown'} />
            <StatCard label="Last Login" value={authData.last_sign_in_at ? new Date(authData.last_sign_in_at).toLocaleDateString() : 'Never'} sub={authData.last_sign_in_at ? new Date(authData.last_sign_in_at).toLocaleTimeString() : ''} />
            <StatCard
              label="Subscription"
              value={userProfile.subscription_end_date ? new Date(userProfile.subscription_end_date).toLocaleDateString() : 'None'}
              color={(userProfile.subscription_end_date && new Date(userProfile.subscription_end_date) > new Date()) ? '#4ade80' : '#e50914'}
              sub={(userProfile.subscription_end_date && new Date(userProfile.subscription_end_date) > new Date()) ? 'Active' : 'Expired / No sub'}
            />
            <StatCard label="Plan" value={userProfile.plan_name || userProfile.subscription_tier || '—'} />
          </div>

          {/* Activity Stats */}
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Activity Stats</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '28px' }}>
            <StatCard label="Movies Started" value={stats.totalWatched} sub={`${stats.recentWatches7d} in last 7d`} color="#e50914" />
            <StatCard label="Total Watch Time" value={stats.totalWatchTime} sub={`${stats.recentWatches30d} films last 30d`} color="#f97316" />
            <StatCard label="Site Visits Tracked" value={stats.totalVisits} sub={`${stats.recentVisits30d} in last 30d`} color="#3b82f6" />
            <StatCard label="Payments Made" value={stats.totalTransactions} sub={`${stats.successfulTxs} successful`} color="#4ade80" />
            <StatCard label="Total Spent" value={`${Number(stats.totalSpent).toLocaleString()} UGX`} color="#4ade80" />
            {affiliateData && (
              <StatCard label="Affiliate Balance" value={`${Number(affiliateData.balance || 0).toLocaleString()} UGX`} sub={`Code: ${affiliateData.referral_code}`} color="#fbbf24" />
            )}
          </div>

          {/* Top Pages */}
          {topPages.length > 0 && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Most Visited Pages</h2>
              <div style={{ background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '28px' }}>
                {topPages.map((p, i) => (
                  <div key={p.path} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: i < topPages.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    background: i === 0 ? 'rgba(229,9,20,0.05)' : 'transparent'
                  }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: i === 0 ? '#fff' : 'var(--text2)' }}>{p.path}</span>
                    <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', padding: '2px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                      {p.count}×
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Affiliate Section */}
          {affiliateData && (
            <>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Affiliate Account</h2>
              <div style={{ background: 'var(--bg2)', borderRadius: '10px', border: '1px solid var(--border)', padding: '20px 24px', marginBottom: '28px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase' }}>Status</div>
                    <span style={{
                      background: affiliateData.status === 'approved' ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                      color: affiliateData.status === 'approved' ? '#4ade80' : '#fbbf24',
                      padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '700'
                    }}>
                      {affiliateData.status || 'approved'}
                    </span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase' }}>Referral Code</div>
                    <span style={{ fontFamily: 'monospace', color: 'var(--acc)', fontWeight: '700' }}>{affiliateData.referral_code}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase' }}>Balance</div>
                    <span style={{ color: '#4ade80', fontWeight: '700' }}>{Number(affiliateData.balance || 0).toLocaleString()} UGX</span>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px', textTransform: 'uppercase' }}>Total Earned</div>
                    <span style={{ color: '#fff', fontWeight: '700' }}>{Number(affiliateData.total_earned || 0).toLocaleString()} UGX</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ACTIVITY TIMELINE TAB ── */}
      {activeTab === 'activity' && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Activity Timeline (Last 50 Events)</h2>
          {timeline.length === 0 ? (
            <div style={{ background: 'var(--bg2)', padding: '48px', borderRadius: '10px', textAlign: 'center', color: 'var(--text3)' }}>
              No activity recorded for this user yet.
            </div>
          ) : (
            <div style={{ position: 'relative', paddingLeft: '28px' }}>
              {/* Timeline line */}
              <div style={{ position: 'absolute', left: '10px', top: '8px', bottom: '8px', width: '2px', background: 'rgba(255,255,255,0.08)' }} />
              {timeline.map((e, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: '14px' }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: '-24px', top: '14px',
                    width: '10px', height: '10px', borderRadius: '50%',
                    background: e.color, border: '2px solid var(--bg2)',
                    boxShadow: `0 0 6px ${e.color}50`
                  }} />
                  <div style={{
                    background: 'var(--bg2)', borderRadius: '8px', padding: '12px 16px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderLeft: `3px solid ${e.color}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '13px', marginRight: '8px' }}>{e.icon}</span>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{e.label}</span>
                        {e.sub && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>{e.sub}</div>}
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text3)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {fmtDate(e.at)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── WATCH HISTORY TAB ── */}
      {activeTab === 'watching' && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>Watch History ({watchHistory.length} titles)</h2>
          {watchHistory.length === 0 ? (
            <div style={{ background: 'var(--bg2)', padding: '48px', borderRadius: '10px', textAlign: 'center', color: 'var(--text3)' }}>
              This user hasn&apos;t watched any movies yet.
            </div>
          ) : (
            <div style={{ background: 'var(--bg2)', borderRadius: '10px', overflowX: 'auto', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '580px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text3)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: '600' }}>Movie</th>
                    <th style={{ padding: '14px 16px', fontWeight: '600' }}>Progress</th>
                    <th style={{ padding: '14px 16px', fontWeight: '600' }}>Last Watched</th>
                    <th style={{ padding: '14px 16px', fontWeight: '600' }}>Started</th>
                  </tr>
                </thead>
                <tbody>
                  {watchHistory.map(w => {
                    const mins = Math.floor((w.progress_seconds || 0) / 60);
                    return (
                      <tr key={w.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {w.movies?.thumbnail_url && (
                              <img src={w.movies.thumbnail_url} alt="" style={{ width: '44px', height: '28px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                            )}
                            <span style={{ fontWeight: '600', color: '#fff' }}>{w.movies?.title || `Movie #${w.movie_id}`}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text2)' }}>
                          {mins > 0 ? `${mins}m watched` : '< 1m'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px' }}>{fmtDate(w.updated_at)}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text3)' }}>{new Date(w.created_at).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PAYMENTS TAB ── */}
      {activeTab === 'payments' && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            Payment History ({transactions.length} transactions)
            {stats.successfulTxs > 0 && (
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#4ade80', marginLeft: '12px' }}>
                Total: {Number(stats.totalSpent).toLocaleString()} UGX
              </span>
            )}
          </h2>
          {transactions.length === 0 ? (
            <div style={{ background: 'var(--bg2)', padding: '48px', borderRadius: '10px', textAlign: 'center', color: 'var(--text3)' }}>
              No transactions found for this user.
            </div>
          ) : (
            <div style={{ background: 'var(--bg2)', borderRadius: '10px', overflowX: 'auto', border: '1px solid var(--border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '540px' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text3)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <th style={{ padding: '14px 16px', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '14px 16px', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '14px 16px', fontWeight: '600' }}>Reference</th>
                    <th style={{ padding: '14px 16px', fontWeight: '600' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => {
                    const isOk = t.status === 'successful' || t.status === 'success';
                    return (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: '700', color: isOk ? '#4ade80' : '#fff' }}>
                          {Number(t.amount || 0).toLocaleString()} UGX
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            background: isOk ? 'rgba(74,222,128,0.15)' : t.status === 'pending' ? 'rgba(251,191,36,0.15)' : 'rgba(248,113,113,0.15)',
                            color: isOk ? '#4ade80' : t.status === 'pending' ? '#fbbf24' : '#f87171',
                            padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700'
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '11px', color: 'var(--text3)' }}>
                          {t.tx_ref || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text2)' }}>{fmtDate(t.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
