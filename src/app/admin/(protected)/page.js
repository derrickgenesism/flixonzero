import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import DashboardClient from './DashboardClient';

export const metadata = {
  title: 'Analytics Dashboard — Flixon Admin',
};

// Helper to calculate percentage growth
function calcGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return (((current - previous) / previous) * 100).toFixed(1);
}

export default async function AdminDashboardPage() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const now = new Date();
  
  // Time boundaries
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  const thisWeekStart = new Date(todayStart);
  thisWeekStart.setDate(todayStart.getDate() - todayStart.getDay()); // Sunday as start of week
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const lastMonthStart = new Date(thisMonthStart);
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  // ── 1. Users & Signups ──────────────────────────────────────────────────────────────
  const { data: usersData } = await supabase
    .from('user_profiles')
    .select('id, email, subscription_end_date, created_at, username, role')
    .order('created_at', { ascending: false });

  const totalUsers = usersData?.length || 0;
  const activeSubscribers = usersData?.filter(u => u.subscription_end_date && new Date(u.subscription_end_date) > now).length || 0;
  const conversionRate = totalUsers > 0 ? ((activeSubscribers / totalUsers) * 100).toFixed(1) : '0';
  const recentSignups = usersData?.slice(0, 10) || [];

  // Signup Analytics
  let signupsToday = 0, signupsYesterday = 0;
  let signupsThisWeek = 0, signupsLastWeek = 0;
  let signupsThisMonth = 0, signupsLastMonth = 0;

  usersData?.forEach(u => {
    const d = new Date(u.created_at);
    if (d >= todayStart) signupsToday++;
    else if (d >= yesterdayStart) signupsYesterday++;

    if (d >= thisWeekStart) signupsThisWeek++;
    else if (d >= lastWeekStart) signupsLastWeek++;

    if (d >= thisMonthStart) signupsThisMonth++;
    else if (d >= lastMonthStart) signupsLastMonth++;
  });

  const signupGrowthDaily = calcGrowth(signupsToday, signupsYesterday);
  const signupGrowthWeekly = calcGrowth(signupsThisWeek, signupsLastWeek);
  const signupGrowthMonthly = calcGrowth(signupsThisMonth, signupsLastMonth);

  // Build email → subscription_end_date lookup map
  const userEmailMap = {};
  usersData?.forEach(u => { userEmailMap[u.id] = u; });

  // ── 2. Transactions ───────────────────────────────────────────────────────
  const { data: txData } = await supabase
    .from('transactions')
    .select('id, tx_ref, amount, status, created_at, user_id')
    .order('created_at', { ascending: false });

  const enrichedTxs = (txData || []).map(tx => ({
    ...tx,
    user_email: userEmailMap[tx.user_id]?.email || tx.user_id || 'Unknown',
  }));

  let totalTxs = enrichedTxs.length;
  let successfulTxs = 0, pendingTxs = 0, failedTxs = 0;
  
  let txsToday = { tried: 0, successful: 0, pending: 0 };
  let txsThisWeek = { tried: 0, successful: 0, pending: 0 };
  let txsThisMonth = { tried: 0, successful: 0, pending: 0 };
  let txsLastMonth = { tried: 0, successful: 0, pending: 0 };
  
  let totalRevenue = 0, monthlyRevenue = 0, lastMonthRevenue = 0;

  enrichedTxs.forEach(tx => {
    const d = new Date(tx.created_at);
    const amt = Number(tx.amount || 0);
    const isSuccess = tx.status === 'successful' || tx.status === 'success';
    const isPending = tx.status === 'pending';
    const isFailed = !isSuccess && !isPending;

    if (isSuccess) successfulTxs++;
    else if (isPending) pendingTxs++;
    else failedTxs++;

    if (isSuccess) totalRevenue += amt;

    // Time-based
    if (d >= todayStart) {
      txsToday.tried++;
      if (isSuccess) txsToday.successful++;
      if (isPending) txsToday.pending++;
    } 
    
    if (d >= thisWeekStart) {
      txsThisWeek.tried++;
      if (isSuccess) txsThisWeek.successful++;
      if (isPending) txsThisWeek.pending++;
    }

    if (d >= thisMonthStart) {
      txsThisMonth.tried++;
      if (isSuccess) {
        txsThisMonth.successful++;
        monthlyRevenue += amt;
      }
      if (isPending) txsThisMonth.pending++;
    } else if (d >= lastMonthStart) {
      txsLastMonth.tried++;
      if (isSuccess) {
        txsLastMonth.successful++;
        lastMonthRevenue += amt;
      }
      if (isPending) txsLastMonth.pending++;
    }
  });

  const revenueGrowth = calcGrowth(monthlyRevenue, lastMonthRevenue);
  const txConversionOverall = totalTxs > 0 ? ((successfulTxs / totalTxs) * 100).toFixed(1) : 0;
  const txConversionToday = txsToday.tried > 0 ? ((txsToday.successful / txsToday.tried) * 100).toFixed(1) : 0;
  const txConversionThisWeek = txsThisWeek.tried > 0 ? ((txsThisWeek.successful / txsThisWeek.tried) * 100).toFixed(1) : 0;

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
    .filter(p => new Date(p.created_at) >= thisMonthStart)
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
  const { data: historyRaw } = await supabase
    .from('watch_history')
    .select('user_id, movie_id, movies(title, type, thumbnail_url)')
    .limit(5000);

  const totalViews = historyRaw?.length || 0;

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

  let totalPageViews = 0;
  let uniqueToday = new Set(), uniqueYesterday = new Set();
  let uniqueThisWeek = new Set(), uniqueLastWeek = new Set();
  let uniqueThisMonth = new Set(), uniqueLastMonth = new Set();
  
  // Also track total non-unique visits for these time periods to answer "how many old visitors that are not unique that are using"
  let nonUniqueToday = 0, nonUniqueYesterday = 0;
  let nonUniqueThisWeek = 0, nonUniqueThisMonth = 0;

  const visitorCounts = {};

  visitsRaw?.forEach(v => {
    totalPageViews++;
    const vDate = new Date(v.created_at);
    const vid = v.visitor_id;

    if (!visitorCounts[vid]) visitorCounts[vid] = 0;
    visitorCounts[vid]++;

    if (vDate >= todayStart) {
      if (uniqueToday.has(vid)) nonUniqueToday++;
      uniqueToday.add(vid);
    } else if (vDate >= yesterdayStart) {
      if (uniqueYesterday.has(vid)) nonUniqueYesterday++;
      uniqueYesterday.add(vid);
    }
    
    if (vDate >= thisWeekStart) {
      if (uniqueThisWeek.has(vid)) nonUniqueThisWeek++;
      uniqueThisWeek.add(vid);
    } else if (vDate >= lastWeekStart) {
      uniqueLastWeek.add(vid);
    }

    if (vDate >= thisMonthStart) {
      if (uniqueThisMonth.has(vid)) nonUniqueThisMonth++;
      uniqueThisMonth.add(vid);
    } else if (vDate >= lastMonthStart) {
      uniqueLastMonth.add(vid);
    }
  });

  const totalUniqueVisitors = Object.keys(visitorCounts).length;
  const returningVisitors = Object.values(visitorCounts).filter(c => c > 1).length;

  const visitorsGrowthDaily = calcGrowth(uniqueToday.size, uniqueYesterday.size);
  const visitorsGrowthWeekly = calcGrowth(uniqueThisWeek.size, uniqueLastWeek.size);
  const visitorsGrowthMonthly = calcGrowth(uniqueThisMonth.size, uniqueLastMonth.size);

  return (
    <DashboardClient
      stats={{
        totalUsers, activeSubscribers, conversionRate,
        totalRevenue: totalRevenue + ppvRevenue,
        monthlyRevenue: monthlyRevenue + ppvMonthly,
        lastMonthRevenue, revenueGrowth,
        totalViews, librarySize: librarySize || 0,
        freeCount: freeCount || 0, premiumCount,
        
        // Detailed Transaction Stats
        totalTxs, successfulTxs, pendingTxs, failedTxs, txConversionOverall,
        txsToday, txConversionToday,
        txsThisWeek, txConversionThisWeek,
        txsThisMonth,
        
        // Detailed Signup Stats
        signupsToday, signupsYesterday, signupGrowthDaily,
        signupsThisWeek, signupsLastWeek, signupGrowthWeekly,
        signupsThisMonth, signupsLastMonth, signupGrowthMonthly,

        expiringIn7, expiringIn30,
        ppvRevenue, ppvCount, ppvMonthly,
        activePromos: activePromos || 0,
        comingSoonCount: comingSoonCount || 0,
        
        // Detailed Web Analytics
        totalPageViews, totalUniqueVisitors, returningVisitors,
        uniqueToday: uniqueToday.size, uniqueYesterday: uniqueYesterday.size, visitorsGrowthDaily,
        uniqueThisWeek: uniqueThisWeek.size, uniqueLastWeek: uniqueLastWeek.size, visitorsGrowthWeekly,
        uniqueThisMonth: uniqueThisMonth.size, uniqueLastMonth: uniqueLastMonth.size, visitorsGrowthMonthly,
        
        // Non-unique (returning usage in the period)
        nonUniqueToday, nonUniqueYesterday, nonUniqueThisWeek, nonUniqueThisMonth,
      }}
      transactions={enrichedTxs.slice(0, 50)}
      recentSignups={recentSignups}
      topMovies={topMovies}
      topUsers={topUsers}
    />
  );
}
