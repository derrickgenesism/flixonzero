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
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const thisWeekStart = new Date(todayStart); thisWeekStart.setDate(todayStart.getDate() - todayStart.getDay());
  const lastWeekStart = new Date(thisWeekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(thisMonthStart); lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
  const in7Days = new Date(now); in7Days.setDate(in7Days.getDate() + 7);
  const in30Days = new Date(now); in30Days.setDate(in30Days.getDate() + 30);

  // ── 1. PARALLEL DATA FETCHING ─────────────────────────────────────────────
  const [
    { count: totalUsers },
    { count: activeSubscribers },
    { count: expiringIn7 },
    { count: expiringIn30 },
    { count: librarySize },
    { count: freeCount },
    { count: activePromos },
    { count: comingSoonCount },
    { count: totalViews },
    { count: totalPageViews },
    { data: recentSignupsRaw },
    { data: txDataLight },
    { data: last50Txs },
    { data: ppvData },
    { data: historyRaw },
    { data: visitsRaw }
  ] = await Promise.all([
    // Counts
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gt('subscription_end_date', now.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gt('subscription_end_date', now.toISOString()).lte('subscription_end_date', in7Days.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gt('subscription_end_date', now.toISOString()).lte('subscription_end_date', in30Days.toISOString()),
    supabase.from('movies').select('id', { count: 'exact', head: true }),
    supabase.from('movies').select('id', { count: 'exact', head: true }).eq('type', 'genesis_free_movie'),
    supabase.from('promo_codes').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('movies').select('id', { count: 'exact', head: true }).eq('is_coming_soon', true),
    supabase.from('watch_history').select('id', { count: 'exact', head: true }),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }),
    
    // Datasets
    supabase.from('user_profiles').select('id, email, username, created_at, role').gte('created_at', lastMonthStart.toISOString()).order('created_at', { ascending: false }),
    supabase.from('transactions').select('amount, status, created_at'), // Light fetch
    supabase.from('transactions').select('id, tx_ref, amount, status, created_at, user_id').order('created_at', { ascending: false }).limit(50),
    supabase.from('ppv_purchases').select('amount, status, created_at').in('status', ['success', 'successful']),
    supabase.from('watch_history').select('user_id, movie_id, movies(title, type, thumbnail_url)').order('created_at', { ascending: false }).limit(1000),
    supabase.from('site_visits').select('visitor_id, created_at') // Light fetch of all for accurate unique tracking
  ]);

  // ── 2. AGGREGATE LOGIC ──────────────────────────────────────────────────
  
  // Users & Signups
  const conversionRate = totalUsers > 0 ? ((activeSubscribers / totalUsers) * 100).toFixed(1) : '0';
  const recentSignups = recentSignupsRaw?.slice(0, 10) || [];

  let signupsToday = 0, signupsYesterday = 0, signupsThisWeek = 0, signupsLastWeek = 0, signupsThisMonth = 0, signupsLastMonth = 0;
  recentSignupsRaw?.forEach(u => {
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

  // Transactions
  let totalTxs = txDataLight?.length || 0;
  let successfulTxs = 0, pendingTxs = 0, failedTxs = 0;
  let txsToday = { tried: 0, successful: 0, pending: 0 };
  let txsThisWeek = { tried: 0, successful: 0, pending: 0 };
  let txsThisMonth = { tried: 0, successful: 0, pending: 0 };
  let txsLastMonth = { tried: 0, successful: 0, pending: 0 };
  let totalRevenue = 0, monthlyRevenue = 0, lastMonthRevenue = 0;

  txDataLight?.forEach(tx => {
    const d = new Date(tx.created_at);
    const amt = Number(tx.amount || 0);
    const isSuccess = tx.status === 'successful' || tx.status === 'success';
    const isPending = tx.status === 'pending';

    if (isSuccess) { successfulTxs++; totalRevenue += amt; }
    else if (isPending) pendingTxs++;
    else failedTxs++;

    if (d >= todayStart) { txsToday.tried++; if (isSuccess) txsToday.successful++; if (isPending) txsToday.pending++; }
    if (d >= thisWeekStart) { txsThisWeek.tried++; if (isSuccess) txsThisWeek.successful++; if (isPending) txsThisWeek.pending++; }
    if (d >= thisMonthStart) { txsThisMonth.tried++; if (isSuccess) { txsThisMonth.successful++; monthlyRevenue += amt; } if (isPending) txsThisMonth.pending++; }
    else if (d >= lastMonthStart) { txsLastMonth.tried++; if (isSuccess) { txsLastMonth.successful++; lastMonthRevenue += amt; } if (isPending) txsLastMonth.pending++; }
  });

  const revenueGrowth = calcGrowth(monthlyRevenue, lastMonthRevenue);
  const txConversionOverall = totalTxs > 0 ? ((successfulTxs / totalTxs) * 100).toFixed(1) : 0;
  const txConversionToday = txsToday.tried > 0 ? ((txsToday.successful / txsToday.tried) * 100).toFixed(1) : 0;
  const txConversionThisWeek = txsThisWeek.tried > 0 ? ((txsThisWeek.successful / txsThisWeek.tried) * 100).toFixed(1) : 0;

  // PPV Stats
  const ppvRevenue = (ppvData || []).reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const ppvCount = ppvData?.length || 0;
  const ppvMonthly = (ppvData || []).filter(p => new Date(p.created_at) >= thisMonthStart).reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Watch History & UUID Resolution
  const movieCounts = {};
  const userViewCounts = {};
  const uuidSet = new Set();
  
  last50Txs?.forEach(tx => { if (tx.user_id) uuidSet.add(tx.user_id); });
  historyRaw?.forEach(h => {
    if (h.movies) {
      if (!movieCounts[h.movie_id]) movieCounts[h.movie_id] = { ...h.movies, id: h.movie_id, views: 0 };
      movieCounts[h.movie_id].views += 1;
    }
    if (h.user_id) {
      uuidSet.add(h.user_id);
      if (!userViewCounts[h.user_id]) userViewCounts[h.user_id] = { id: h.user_id, watchCount: 0 };
      userViewCounts[h.user_id].watchCount += 1;
    }
  });

  const topMovies = Object.values(movieCounts).sort((a, b) => b.views - a.views).slice(0, 20);
  const topUsersRaw = Object.values(userViewCounts).sort((a, b) => b.watchCount - a.watchCount).slice(0, 10);

  // Fetch emails only for the unique UUIDs we actually need to display
  const uuidMap = {};
  const uniqueUuids = Array.from(uuidSet);
  if (uniqueUuids.length > 0) {
    const emailPromises = uniqueUuids.map(id => supabase.auth.admin.getUserById(id));
    const authResponses = await Promise.allSettled(emailPromises);
    authResponses.forEach((res, idx) => {
      if (res.status === 'fulfilled' && res.value.data?.user) {
        uuidMap[uniqueUuids[idx]] = res.value.data.user.email;
      }
    });
  }

  const enrichedTxs = (last50Txs || []).map(tx => ({
    ...tx,
    user_email: uuidMap[tx.user_id] || tx.user_id || 'Unknown',
  }));

  const topUsers = topUsersRaw.map(u => ({
    ...u,
    email: uuidMap[u.id] || u.id,
    isSubscribed: false, // In a real deeper join we could verify subscription
  }));

  // Analytics (Site Visits)
  let uniqueToday = new Set(), uniqueYesterday = new Set(), uniqueThisWeek = new Set(), uniqueLastWeek = new Set(), uniqueThisMonth = new Set(), uniqueLastMonth = new Set();
  let nonUniqueToday = 0, nonUniqueYesterday = 0, nonUniqueThisWeek = 0, nonUniqueThisMonth = 0;
  const visitorCounts = {};

  visitsRaw?.forEach(v => {
    const vDate = new Date(v.created_at);
    const vid = v.visitor_id;

    if (!visitorCounts[vid]) visitorCounts[vid] = 0;
    visitorCounts[vid]++;

    if (vDate >= todayStart) { if (uniqueToday.has(vid)) nonUniqueToday++; uniqueToday.add(vid); }
    else if (vDate >= yesterdayStart) { if (uniqueYesterday.has(vid)) nonUniqueYesterday++; uniqueYesterday.add(vid); }
    
    if (vDate >= thisWeekStart) { if (uniqueThisWeek.has(vid)) nonUniqueThisWeek++; uniqueThisWeek.add(vid); }
    else if (vDate >= lastWeekStart) uniqueLastWeek.add(vid);

    if (vDate >= thisMonthStart) { if (uniqueThisMonth.has(vid)) nonUniqueThisMonth++; uniqueThisMonth.add(vid); }
    else if (vDate >= lastMonthStart) uniqueLastMonth.add(vid);
  });

  const totalUniqueVisitors = Object.keys(visitorCounts).length;
  const returningVisitors = Object.values(visitorCounts).filter(c => c > 1).length;

  const visitorsGrowthDaily = calcGrowth(uniqueToday.size, uniqueYesterday.size);
  const visitorsGrowthWeekly = calcGrowth(uniqueThisWeek.size, uniqueLastWeek.size);
  const visitorsGrowthMonthly = calcGrowth(uniqueThisMonth.size, uniqueLastMonth.size);

  return (
    <DashboardClient
      stats={{
        totalUsers: totalUsers || 0, activeSubscribers: activeSubscribers || 0, conversionRate,
        totalRevenue: totalRevenue + ppvRevenue,
        monthlyRevenue: monthlyRevenue + ppvMonthly,
        lastMonthRevenue, revenueGrowth,
        totalViews: totalViews || 0, librarySize: librarySize || 0,
        freeCount: freeCount || 0, premiumCount: premiumCount || 0,
        
        totalTxs, successfulTxs, pendingTxs, failedTxs, txConversionOverall,
        txsToday, txConversionToday, txsThisWeek, txConversionThisWeek, txsThisMonth,
        
        signupsToday, signupsYesterday, signupGrowthDaily,
        signupsThisWeek, signupsLastWeek, signupGrowthWeekly,
        signupsThisMonth, signupsLastMonth, signupGrowthMonthly,

        expiringIn7: expiringIn7 || 0, expiringIn30: expiringIn30 || 0,
        ppvRevenue, ppvCount, ppvMonthly,
        activePromos: activePromos || 0, comingSoonCount: comingSoonCount || 0,
        
        totalPageViews: totalPageViews || 0, totalUniqueVisitors, returningVisitors,
        uniqueToday: uniqueToday.size, uniqueYesterday: uniqueYesterday.size, visitorsGrowthDaily,
        uniqueThisWeek: uniqueThisWeek.size, uniqueLastWeek: uniqueLastWeek.size, visitorsGrowthWeekly,
        uniqueThisMonth: uniqueThisMonth.size, uniqueLastMonth: uniqueLastMonth.size, visitorsGrowthMonthly,
        nonUniqueToday, nonUniqueYesterday, nonUniqueThisWeek, nonUniqueThisMonth,
      }}
      transactions={enrichedTxs}
      recentSignups={recentSignups}
      topMovies={topMovies}
      topUsers={topUsers}
    />
  );
}
