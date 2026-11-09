import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import UserActivityClient from './UserActivityClient'

export default async function UserAnalyticsPage({ params }) {
  const { id } = await params;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .maybeSingle()

  if (profile?.role !== 'administrator') {
    return (
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text2)' }}>Only Administrators can access User Analytics.</p>
      </div>
    )
  }

  try {
    const supabaseAdmin = createAdminClient()

    // Fetch target user profile
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single()

    if (!userProfile) {
      return (
        <div>
          <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Error</h1>
          <p style={{ color: '#e50914' }}>User profile not found in database.</p>
          <Link href="/admin/users" style={{ color: 'var(--acc)' }}>&larr; Back to Users</Link>
        </div>
      )
    }

    // Find auth user by email
    let authUser = null;
    if (userProfile.email) {
      const targetEmail = userProfile.email.toLowerCase().trim();
      let page = 1;
      let found = false;
      while (!found && page <= 10) {
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
        if (listError || !listData?.users || listData.users.length === 0) break;
        const match = listData.users.find(u => u.email?.toLowerCase().trim() === targetEmail);
        if (match) { authUser = match; found = true; break; }
        if (listData.users.length < 1000) break;
        page++;
      }
    }

    // Parallel fetch: watch history + site visits (by auth UUID)
    const authUuid = authUser?.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyMinsAgo = new Date(now); thirtyMinsAgo.setMinutes(thirtyMinsAgo.getMinutes() - 30);
    const twentyFourHoursAgo = new Date(now); twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const [watchHistoryRes, siteVisitsRes, transactionsRes, affiliateRes] = await Promise.allSettled([
      authUuid
        ? supabaseAdmin.from('watch_history')
            .select('*, movies(id, title, thumbnail_url, type)')
            .eq('user_id', authUuid)
            .order('updated_at', { ascending: false })
            .limit(100)
        : Promise.resolve({ data: [] }),

      authUuid
        ? supabaseAdmin.from('site_visits')
            .select('id, path, referrer, created_at')
            .eq('user_id', authUuid)
            .order('created_at', { ascending: false })
            .limit(200)
        : Promise.resolve({ data: [] }),

      authUuid
        ? supabaseAdmin.from('transactions')
            .select('id, amount, status, tx_ref, created_at')
            .eq('user_id', authUuid)
            .order('created_at', { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] }),

      supabaseAdmin.from('affiliates')
        .select('id, referral_code, status, balance, total_earned, created_at')
        .eq('user_id', userProfile.id)
        .maybeSingle()
    ]);

    const watchHistory = watchHistoryRes.status === 'fulfilled' ? (watchHistoryRes.value.data || []) : [];
    const siteVisits = siteVisitsRes.status === 'fulfilled' ? (siteVisitsRes.value.data || []) : [];
    const transactions = transactionsRes.status === 'fulfilled' ? (transactionsRes.value.data || []) : [];
    const affiliateData = affiliateRes.status === 'fulfilled' ? affiliateRes.value.data : null;

    // Activity calculations
    const recentWatches30d = watchHistory.filter(w => new Date(w.updated_at) >= thirtyDaysAgo).length;
    const recentWatches7d = watchHistory.filter(w => new Date(w.updated_at) >= sevenDaysAgo).length;
    const totalWatchSeconds = watchHistory.reduce((sum, w) => sum + (w.progress_seconds || 0), 0);

    const recentVisits30d = siteVisits.filter(v => new Date(v.created_at) >= thirtyDaysAgo).length;
    const isOnlineNow = siteVisits.some(v => new Date(v.created_at) >= thirtyMinsAgo);
    const isActiveToday = siteVisits.some(v => new Date(v.created_at) >= twentyFourHoursAgo) ||
                          watchHistory.some(w => new Date(w.updated_at) >= twentyFourHoursAgo);

    let activityStatus = 'Inactive';
    let statusColor = '#e50914';
    if (isOnlineNow) {
      activityStatus = '🟢 Online Now';
      statusColor = '#10b981';
    } else if (isActiveToday) {
      activityStatus = '🟡 Active Today';
      statusColor = '#fbbf24';
    } else if (recentWatches30d > 10) {
      activityStatus = '🔵 Highly Active';
      statusColor = '#3b82f6';
    } else if (recentWatches30d > 0 || recentVisits30d > 0) {
      activityStatus = '⚪ Occasional';
      statusColor = '#94a3b8';
    }

    // Page frequency map from site visits
    const pageFreq = {};
    siteVisits.forEach(v => {
      const p = v.path?.split('?')[0] || '/';
      pageFreq[p] = (pageFreq[p] || 0) + 1;
    });
    const topPages = Object.entries(pageFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));

    // Build combined activity timeline (last 50 events)
    const timeline = [];
    watchHistory.slice(0, 25).forEach(w => {
      timeline.push({
        type: 'watch',
        icon: '▶',
        label: w.movies?.title || `Movie #${w.movie_id}`,
        sub: w.progress_seconds ? `${Math.floor(w.progress_seconds / 60)}m watched` : '',
        at: w.updated_at,
        color: '#e50914'
      });
    });
    siteVisits.slice(0, 25).forEach(v => {
      timeline.push({
        type: 'visit',
        icon: '👁',
        label: v.path,
        sub: v.referrer ? `from ${v.referrer.substring(0, 60)}` : '',
        at: v.created_at,
        color: '#3b82f6'
      });
    });
    transactions.slice(0, 10).forEach(t => {
      timeline.push({
        type: 'payment',
        icon: '💳',
        label: `Payment: ${Number(t.amount || 0).toLocaleString()} UGX`,
        sub: `Status: ${t.status} | Ref: ${t.tx_ref || '—'}`,
        at: t.created_at,
        color: t.status === 'successful' || t.status === 'success' ? '#4ade80' : '#f87171'
      });
    });
    timeline.sort((a, b) => new Date(b.at) - new Date(a.at));

    function fmtTime(seconds) {
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      if (h > 0) return `${h}h ${m}m`;
      return `${m}m`;
    }

    const authData = {
      created_at: authUser?.created_at,
      last_sign_in_at: authUser?.last_sign_in_at,
      email_confirmed_at: authUser?.email_confirmed_at,
    };

    return (
      <UserActivityClient
        userProfile={userProfile}
        authData={authData}
        activityStatus={activityStatus}
        statusColor={statusColor}
        stats={{
          totalWatched: watchHistory.length,
          recentWatches30d,
          recentWatches7d,
          totalWatchTime: fmtTime(totalWatchSeconds),
          totalVisits: siteVisits.length,
          recentVisits30d,
          totalTransactions: transactions.length,
          successfulTxs: transactions.filter(t => t.status === 'successful' || t.status === 'success').length,
          totalSpent: transactions.filter(t => t.status === 'successful' || t.status === 'success').reduce((s, t) => s + Number(t.amount || 0), 0),
          isOnlineNow,
          isActiveToday,
        }}
        topPages={topPages}
        timeline={timeline.slice(0, 50)}
        watchHistory={watchHistory.slice(0, 30)}
        transactions={transactions}
        affiliateData={affiliateData}
      />
    );
  } catch (error) {
    if (error?.digest?.startsWith('NEXT_REDIRECT') || error?.message === 'NEXT_REDIRECT') {
      throw error;
    }
    console.error('Error in /admin/users/[id]:', error);
    return (
      <div style={{ color: '#ff6b6b', padding: '20px', background: 'rgba(255,107,107,0.1)', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.2)' }}>
        <h2 style={{ margin: '0 0 10px' }}>Error loading user analytics</h2>
        <p style={{ color: 'var(--text2)', marginBottom: '15px' }}>{error.message || 'An unexpected error occurred.'}</p>
        <Link href="/admin/users" style={{ color: 'var(--acc)', textDecoration: 'none' }}>&larr; Back to Users</Link>
      </div>
    )
  }
}
