'use client';

import { useState, useMemo } from 'react';

// ── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n) { return Number(n || 0).toLocaleString(); }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' }); }

function KpiCard({ label, value, unit, sub, subColor, accent, icon }) {
  return (
    <div style={{
      background: 'var(--bg2)', padding: '22px 24px', borderRadius: '16px',
      border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ color: 'var(--text2)', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px' }}>{label}</div>
        <div style={{ fontSize: '20px', opacity: 0.4 }}>{icon}</div>
      </div>
      <div style={{ fontSize: '30px', fontWeight: '900', color: accent || '#fff', lineHeight: 1 }}>
        {value} {unit && <span style={{ fontSize: '13px', color: 'var(--text2)', fontWeight: '600' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: '12px', color: subColor || 'var(--text3)', fontWeight: '500' }}>{sub}</div>}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: accent || 'transparent', opacity: 0.4 }} />
    </div>
  );
}

function SortableTable({ columns, data, defaultSort, defaultDir = 'desc' }) {
  const [sort, setSort] = useState(defaultSort || columns[0].key);
  const [dir, setDir] = useState(defaultDir);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const PAGE = 10;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      columns.some(col => String(row[col.key] ?? '').toLowerCase().includes(q))
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sort]; const bv = b[sort];
      if (av == null) return 1; if (bv == null) return -1;
      const diff = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
      return dir === 'asc' ? diff : -diff;
    });
  }, [filtered, sort, dir]);

  const paged = sorted.slice(page * PAGE, (page + 1) * PAGE);
  const totalPages = Math.ceil(sorted.length / PAGE);

  const toggle = (key) => {
    if (sort === key) setDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSort(key); setDir('desc'); }
    setPage(0);
  };

  return (
    <div>
      <div style={{ padding: '12px 16px 12px', borderBottom: '1px solid var(--border)' }}>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0); }}
          placeholder="Search..."
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)',
            borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '13px', outline: 'none',
          }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggle(col.key)}
                  style={{
                    padding: '12px 16px', color: sort === col.key ? 'var(--acc)' : 'var(--text2)',
                    fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none',
                    fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px',
                  }}
                >
                  {col.label} {sort === col.key ? (dir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 && (
              <tr><td colSpan={columns.length} style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)' }}>No data found</td></tr>
            )}
            {paged.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '12px 16px', color: '#fff' }}>
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text2)' }}>
          <span>{sorted.length} results · Page {page + 1} of {totalPages}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: 'pointer', opacity: page === 0 ? 0.4 : 1 }}>Prev</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', cursor: 'pointer', opacity: page === totalPages - 1 ? 0.4 : 1 }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Panel({ title, badge, children }) {
  return (
    <div style={{ background: 'var(--bg2)', borderRadius: '16px', border: '1px solid var(--border)', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(0,0,0,0.25)' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', margin: 0 }}>{title}</h2>
        {badge && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: 'var(--text2)' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

// ── Main Client Component ─────────────────────────────────────────────────────
export default function DashboardClient({ stats, transactions, recentSignups, topMovies, topUsers }) {
  const {
    totalUsers, activeSubscribers, conversionRate,
    totalRevenue, monthlyRevenue, lastMonthRevenue, revenueGrowth,
    totalViews, librarySize, freeCount, premiumCount,
    totalTxs, successfulTxs, pendingTxs,
    expiringIn7, expiringIn30,
    ppvRevenue, ppvCount, ppvMonthly,
    activePromos, comingSoonCount,
    totalPageViews, totalUniqueVisitors, returningVisitors,
    uniqueToday, uniqueYesterday, uniqueMonth
  } = stats;

  const growthLabel = revenueGrowth !== null
    ? `${revenueGrowth >= 0 ? '+' : ''}${revenueGrowth}% vs last month`
    : `${fmt(lastMonthRevenue)} UGX last month`;

  const txColumns = [
    { key: 'created_at', label: 'Date', render: v => fmtDate(v) },
    { key: 'user_email', label: 'User' },
    { key: 'amount', label: 'Amount (UGX)', render: v => fmt(v) },
    {
      key: 'status', label: 'Status', render: v => (
        <span style={{
          padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
          background: v === 'successful' ? 'rgba(74,222,128,0.12)' : 'rgba(255,165,0,0.12)',
          color: v === 'successful' ? '#4ade80' : '#ffa500',
        }}>{v}</span>
      )
    },
    { key: 'tx_ref', label: 'Reference', render: v => <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text3)' }}>{v}</span> },
  ];

  const movieColumns = [
    { key: 'title', label: 'Title' },
    {
      key: 'type', label: 'Type', render: v => (
        <span style={{
          padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
          background: v === 'genesis_free_movie' ? 'rgba(74,222,128,0.1)' : 'rgba(229,9,20,0.1)',
          color: v === 'genesis_free_movie' ? '#4ade80' : 'var(--acc)',
        }}>{v === 'genesis_free_movie' ? 'Free' : 'Premium'}</span>
      )
    },
    { key: 'views', label: 'Total Views', render: v => <strong style={{ color: '#f472b6' }}>{fmt(v)}</strong> },
  ];

  const userColumns = [
    { key: 'email', label: 'Email' },
    { key: 'watchCount', label: 'Total Watches', render: v => <strong style={{ color: '#60a5fa' }}>{fmt(v)}</strong> },
    {
      key: 'isSubscribed', label: 'Plan', render: v => (
        <span style={{
          padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: '700',
          background: v ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)',
          color: v ? '#4ade80' : 'var(--text3)',
        }}>{v ? 'Premium' : 'Free'}</span>
      )
    },
  ];

  const signupColumns = [
    { key: 'email', label: 'Email' },
    { key: 'subscription_end_date', label: 'Sub Ends', render: v => v ? fmtDate(v) : <span style={{ color: 'var(--text3)' }}>No plan</span> },
    { key: 'created_at', label: 'Joined', render: v => fmtDate(v) },
  ];

  return (
    <div style={{ padding: '28px', maxWidth: '1500px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 4px' }}>Analytics Dashboard</h1>
        <p style={{ margin: 0, color: 'var(--text2)', fontSize: '14px' }}>Live business insights — refreshes on every page load.</p>
      </div>

      {/* Alerts Row */}
      {(expiringIn7 > 0 || pendingTxs > 0) && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {expiringIn7 > 0 && (
            <div style={{ background: 'rgba(255,165,0,0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '10px', padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
              ⚠️ <strong style={{ color: '#ffa500' }}>{expiringIn7}</strong> subscriptions expiring within 7 days
            </div>
          )}
          {expiringIn30 > 0 && (
            <div style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.2)', borderRadius: '10px', padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
              🔔 <strong style={{ color: '#60a5fa' }}>{expiringIn30}</strong> expiring within 30 days
            </div>
          )}
          {pendingTxs > 0 && (
            <div style={{ background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.2)', borderRadius: '10px', padding: '10px 16px', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
              💳 <strong style={{ color: 'var(--acc)' }}>{pendingTxs}</strong> pending transactions need attention
            </div>
          )}
        </div>
      )}

      {/* KPIs Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <KpiCard label="Total Revenue" value={fmt(totalRevenue)} unit="UGX" sub={growthLabel} subColor={revenueGrowth >= 0 ? '#4ade80' : '#ff6b6b'} accent="#4ade80" icon="💰" />
        <KpiCard label="This Month" value={fmt(monthlyRevenue)} unit="UGX" sub={`${successfulTxs} successful payments`} accent="#a78bfa" icon="📅" />
        <KpiCard label="Active Subscribers" value={fmt(activeSubscribers)} sub={`${conversionRate}% conversion rate`} accent="#60a5fa" icon="👥" />
        <KpiCard label="Total Users" value={fmt(totalUsers)} sub={`${totalUsers - activeSubscribers} on free tier`} accent="#fff" icon="👤" />
      </div>

      {/* KPIs Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard label="Total Views" value={fmt(totalViews)} sub="Across all content" accent="#f472b6" icon="👁️" />
        <KpiCard label="Content Library" value={fmt(librarySize)} sub={`${premiumCount} premium · ${freeCount} free`} accent="#fb923c" icon="🎬" />
        <KpiCard label="Expiring (7d)" value={expiringIn7} sub="Subscriptions need renewal" subColor={expiringIn7 > 0 ? '#ffa500' : 'var(--text3)'} accent="#ffa500" icon="⏳" />
        <KpiCard label="Transactions" value={fmt(totalTxs)} sub={`${successfulTxs} successful · ${pendingTxs} pending`} accent="#34d399" icon="💳" />
      </div>

      {/* KPIs Row 3 — Monetization */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard label="PPV Revenue" value={fmt(ppvRevenue)} unit="UGX" sub={`${ppvCount} total rentals`} accent="#f59e0b" icon="🎟️" />
        <KpiCard label="PPV This Month" value={fmt(ppvMonthly)} unit="UGX" sub="Pay-per-view income" accent="#fbbf24" icon="📽️" />
        <KpiCard label="Active Promo Codes" value={fmt(activePromos)} sub="In circulation" accent="#c084fc" icon="🎁" />
        <KpiCard label="Coming Soon" value={fmt(comingSoonCount)} sub="Upcoming titles" accent="#38bdf8" icon="🚀" />
      </div>

      {/* KPIs Row 4 — Web Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <KpiCard label="Unique Visitors" value={fmt(totalUniqueVisitors)} sub={`${returningVisitors} returning`} accent="#10b981" icon="🌐" />
        <KpiCard label="Page Views" value={fmt(totalPageViews)} sub="Total requests" accent="#14b8a6" icon="📊" />
        <KpiCard label="Active Today" value={fmt(uniqueToday)} sub="Unique visitors today" accent="#0ea5e9" icon="📈" />
        <KpiCard label="Active Yesterday" value={fmt(uniqueYesterday)} sub="Unique visitors yesterday" accent="#6366f1" icon="📉" />
      </div>

      {/* Tables Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <Panel title="All Transactions" badge={`${transactions.length} records`}>
          <SortableTable columns={txColumns} data={transactions} defaultSort="created_at" />
        </Panel>
        <Panel title="Most Active Viewers" badge={`${topUsers.length} users`}>
          <SortableTable columns={userColumns} data={topUsers} defaultSort="watchCount" />
        </Panel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '20px' }}>
        <Panel title="Trending Content" badge={`${topMovies.length} titles`}>
          <SortableTable columns={movieColumns} data={topMovies} defaultSort="views" />
        </Panel>
        <Panel title="User Sign-ups" badge={`${recentSignups.length} recent`}>
          <SortableTable columns={signupColumns} data={recentSignups} defaultSort="created_at" />
        </Panel>
      </div>
    </div>
  );
}
