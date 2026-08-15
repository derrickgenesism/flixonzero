import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Analytics Dashboard — Flixon Admin',
};

export default async function AdminDashboardPage() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // ── 1. Users ──────────────────────────────────────────────────────────────
  const { data: usersData } = await supabase
    .from('user_profiles')
    .select('id, email, subscription_end_date, created_at, username, role')
    .order('created_at', { ascending: false });

  const now = new Date();
  const totalUsers = usersData?.length || 0;
  const activeSubscribers = usersData?.filter(u => u.subscription_end_date && new Date(u.subscription_end_date) > now).length || 0;
  const conversionRate = totalUsers > 0 ? ((activeSubscribers / totalUsers) * 100).toFixed(1) : '0';
  const recentSignups = usersData?.slice(0, 10) || [];

  // Build email → subscription_end_date lookup map
  const userEmailMap = {};
  usersData?.forEach(u => { userEmailMap[u.id] = u; });

  // ── 2. Transactions ───────────────────────────────────────────────────────
  // Fetch transactions separately (no FK to user_profiles, only to auth.users)
  const { data: txData } = await supabase
    .from('transactions')
    .select('id, tx_ref, amount, status, created_at, user_id')
    .order('created_at', { ascending: false });

  // Enrich transactions with user email from usersData map
  const enrichedTxs = (txData || []).map(tx => ({
    ...tx,
    user_email: userEmailMap[tx.user_id]?.email || tx.user_id || 'Unknown',
  }));

  const successfulTxs = enrichedTxs.filter(t => t.status === 'successful');
  const pendingTxs = enrichedTxs.filter(t => t.status === 'pending');
  const totalRevenue = successfulTxs.reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // This month's revenue
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthlyRevenue = successfulTxs
    .filter(t => new Date(t.created_at) >= monthStart)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  // Last month's revenue
  const lastMonthStart = new Date(monthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const lastMonthRevenue = successfulTxs
    .filter(t => new Date(t.created_at) >= lastMonthStart && new Date(t.created_at) < monthStart)
    .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

  const revenueGrowth = lastMonthRevenue > 0
    ? (((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
    : null;

  // ── 3. Library Info ───────────────────────────────────────────────────────
  const { count: librarySize } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true });

  const { count: freeCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'genesis_free_movie');

  const premiumCount = (librarySize || 0) - (freeCount || 0);

  // ── PPV Stats ────────────────────────────────────────────────────────────
  const { data: ppvData } = await supabase
    .from('ppv_purchases')
    .select('amount, status, created_at')
    .in('status', ['success', 'successful']);

  const ppvRevenue = (ppvData || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const ppvCount   = ppvData?.length || 0;
  const ppvMonthly = (ppvData || [])
    .filter(p => new Date(p.created_at) >= monthStart)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // ── Active Promo Codes ───────────────────────────────────────────────────
  const { count: activePromos } = await supabase
    .from('promo_codes')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  // ── Coming Soon ──────────────────────────────────────────────────────────
  const { count: comingSoonCount } = await supabase
    .from('movies')
    .select('*', { count: 'exact', head: true })
    .eq('is_coming_soon', true);

  // ── 4. Watch History ──────────────────────────────────────────────────────
  // Fetch without user_profiles join (no FK) - fetch just movie join
  const { data: historyRaw } = await supabase
    .from('watch_history')
    .select('user_id, movie_id, movies(title, type, thumbnail_url)')
    .limit(5000);

  const totalViews = historyRaw?.length || 0;

  // Aggregate top movies
  const movieCounts = {};
  const userViewCounts = {};
  historyRaw?.forEach(h => {
    if (h.movies) {
      if (!movieCounts[h.movie_id]) movieCounts[h.movie_id] = { ...h.movies, id: h.movie_id, views: 0 };
      movieCounts[h.movie_id].views += 1;
    }
    if (h.user_id) {
      if (!userViewCounts[h.user_id]) {
        userViewCounts[h.user_id] = {
          email: userEmailMap[h.user_id]?.email || h.user_id,
          watchCount: 0,
          isSubscribed: !!(userEmailMap[h.user_id]?.subscription_end_date && new Date(userEmailMap[h.user_id].subscription_end_date) > now),
        };
      }
      userViewCounts[h.user_id].watchCount += 1;
    }
  });

  const topMovies = Object.values(movieCounts).sort((a, b) => b.views - a.views).slice(0, 20);
  const topUsers = Object.values(userViewCounts).sort((a, b) => b.watchCount - a.watchCount).slice(0, 10);

  // ── 5. Subscription Expiry Analysis ──────────────────────────────────────
  const in7Days = new Date(now); in7Days.setDate(in7Days.getDate() + 7);
  const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);
  const expiringIn7 = usersData?.filter(u => {
    if (!u.subscription_end_date) return false;
    const end = new Date(u.subscription_end_date);
    return end > now && end <= in7Days;
  }).length || 0;
  const expiringIn30 = usersData?.filter(u => {
    if (!u.subscription_end_date) return false;
    const end = new Date(u.subscription_end_date);
    return end > now && end <= in30Days;
  }).length || 0;

  // ── 6. Analytics (Site Visits) ───────────────────────────────────────────
  const { data: visitsRaw } = await supabase
    .from('site_visits')
    .select('visitor_id, created_at');

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let totalPageViews = 0;
  let uniqueToday = new Set();
  let uniqueYesterday = new Set();
  let uniqueMonth = new Set();
  const visitorCounts = {};

  visitsRaw?.forEach(v => {
    totalPageViews++;
    const vDate = new Date(v.created_at);
    const vid = v.visitor_id;

    if (!visitorCounts[vid]) visitorCounts[vid] = 0;
    visitorCounts[vid]++;

    if (vDate >= today) uniqueToday.add(vid);
    else if (vDate >= yesterday) uniqueYesterday.add(vid);
    
    if (vDate >= thisMonth) uniqueMonth.add(vid);
  });

  const totalUniqueVisitors = Object.keys(visitorCounts).length;
  const returningVisitors = Object.values(visitorCounts).filter(c => c > 1).length;

  return (
    <DashboardClient
      stats={{
        totalUsers,
        activeSubscribers,
        conversionRate,
        totalRevenue: totalRevenue + ppvRevenue,
        monthlyRevenue: monthlyRevenue + ppvMonthly,
        lastMonthRevenue,
        revenueGrowth,
        totalViews,
        librarySize: librarySize || 0,
        freeCount: freeCount || 0,
        premiumCount,
        totalTxs: enrichedTxs.length,
        successfulTxs: successfulTxs.length,
        pendingTxs: pendingTxs.length,
        expiringIn7,
        expiringIn30,
        ppvRevenue,
        ppvCount,
        ppvMonthly,
        activePromos: activePromos || 0,
        comingSoonCount: comingSoonCount || 0,
        totalPageViews,
        totalUniqueVisitors,
        returningVisitors,
        uniqueToday: uniqueToday.size,
        uniqueYesterday: uniqueYesterday.size,
        uniqueMonth: uniqueMonth.size,
      }}
      transactions={enrichedTxs.slice(0, 50)}
      recentSignups={recentSignups}
      topMovies={topMovies}
      topUsers={topUsers}
    />
  );
}
