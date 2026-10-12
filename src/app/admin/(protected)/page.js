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

  // ── 1. PARALLEL DATA FETCHING (Ultra-light, zero-waste database queries) ────
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
    { count: visitsTodayCount },
    { count: visitsYesterdayCount },
    { count: visitsThisWeekCount },
    { count: visitsThisMonthCount },
    { data: recentSignupsRaw },
    { data: txDataLight },
    { data: last50Txs },
    { data: ppvData },
    { data: historyRaw },
    { data: recentVisitsRaw },
    { count: freeVisitsAllTimeCount },
    { count: freeVisitsTodayCount },
    { count: freeVisitsYesterdayCount },
    { count: freeVisitsThisWeekCount },
    { count: freeVisitsThisMonthCount },
    { count: freeVisitsLastMonthCount },
    { data: freeVisitsRaw }
  ] = await Promise.all([
    // Counts (Zero row data transferred — microsecond header counts)
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gt('subscription_end_date', now.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gt('subscription_end_date', now.toISOString()).lte('subscription_end_date', in7Days.toISOString()),
    supabase.from('user_profiles').select('id', { count: 'exact', head: true }).gt('subscription_end_date', now.toISOString()).lte('subscription_end_date', in30Days.toISOString()),
    supabase.from('movies').select('id', { count: 'exact', head: true }),
    supabase.from('movies').select('id', { count: 'exact', head: true }).eq('type', 'genesis_free_movie'),
    supabase.from('promo_codes').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('movies').select('id', { count: 'exact', head: true }).eq('is_coming_soon', true),
    supabase.from('watch_history').select('id', { count: 'exact', head: true }),
    
    // Exact Total Visits (All Time, Today, Yesterday, Week, Month) — 0 row transfer!
    supabase.from('site_visits').select('id', { count: 'exact', head: true }),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', yesterdayStart.toISOString()).lt('created_at', todayStart.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', thisWeekStart.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart.toISOString()),
    
    // Datasets
    supabase.from('user_profiles').select('id, email, username, created_at, role').gte('created_at', lastMonthStart.toISOString()).order('created_at', { ascending: false }),
    supabase.from('transactions').select('amount, status, created_at'),
    supabase.from('transactions').select('id, tx_ref, amount, status, created_at, user_id').order('created_at', { ascending: false }).limit(50),
    supabase.from('ppv_purchases').select('amount, status, created_at').in('status', ['success', 'successful']),
    supabase.from('watch_history').select('user_id, movie_id, movies(title, type, thumbnail_url)').order('created_at', { ascending: false }).limit(1000),
    
    // Fetch only the latest visits ordered descending (fast unique calculation, tiny payload)
    supabase.from('site_visits').select('visitor_id, created_at').order('created_at', { ascending: false }).limit(3000),

    // Free Movies Total Visits (All Time, Today, Yesterday, Week, Month, Last Month) — 0 row transfer!
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).ilike('path', '%free%'),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).ilike('path', '%free%').gte('created_at', todayStart.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).ilike('path', '%free%').gte('created_at', yesterdayStart.toISOString()).lt('created_at', todayStart.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).ilike('path', '%free%').gte('created_at', thisWeekStart.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).ilike('path', '%free%').gte('created_at', thisMonthStart.toISOString()),
    supabase.from('site_visits').select('id', { count: 'exact', head: true }).ilike('path', '%free%').gte('created_at', lastMonthStart.toISOString()).lt('created_at', thisMonthStart.toISOString()),

    // Recent Free Visits Dataset (Tiny payload: 2 string fields)
    supabase.from('site_visits').select('visitor_id, created_at').ilike('path', '%free%').order('created_at', { ascending: false }).limit(1000)
  ]);

  // ── 2. AGGREGATE LOGIC ──────────────────────────────────────────────────
  
  const premiumCount = (librarySize || 0) - (freeCount || 0);

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

  // Fetch emails only for displayed UUIDs
  const displayUuids = new Set();
  topUsersRaw.forEach(u => displayUuids.add(u.id));
  last50Txs?.forEach(tx => { if (tx.user_id) displayUuids.add(tx.user_id); });
  const uuidMap = {};
  const uniqueUuids = Array.from(displayUuids);
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
    isSubscribed: false,
  }));

  // ── 3. VISITOR ANALYTICS & TOTAL VISITS CALCULATION ─────────────────────
  const visitsToday = visitsTodayCount || 0;
  const visitsYesterday = visitsYesterdayCount || 0;
  const visitsThisWeek = visitsThisWeekCount || 0;
  const visitsThisMonth = visitsThisMonthCount || 0;
  const visitsGrowthDaily = calcGrowth(visitsToday, visitsYesterday);

  // Unique Visitors from recent visits (descending)
  const uniqueToday = new Set();
  const uniqueYesterday = new Set();
  const uniqueThisWeek = new Set();
  const uniqueThisMonth = new Set();

  recentVisitsRaw?.forEach(v => {
    const vDate = new Date(v.created_at);
    const vid = v.visitor_id;
    if (!vid) return;

    if (vDate >= todayStart) {
      uniqueToday.add(vid);
    } else if (vDate >= yesterdayStart) {
      uniqueYesterday.add(vid);
    }
    
    if (vDate >= thisWeekStart) {
      uniqueThisWeek.add(vid);
    }
    if (vDate >= thisMonthStart) {
      uniqueThisMonth.add(vid);
    }
  });

  const uniqueTodayCount = uniqueToday.size;
  const uniqueYesterdayCount = uniqueYesterday.size;
  const uniqueThisWeekCount = uniqueThisWeek.size;
  const uniqueThisMonthCount = uniqueThisMonth.size;
  const uniqueGrowthDaily = calcGrowth(uniqueTodayCount, uniqueYesterdayCount);

  // Average pages per visitor
  const pagesPerVisitorToday = uniqueTodayCount > 0 ? (visitsToday / uniqueTodayCount).toFixed(1) : '1.0';
  const pagesPerVisitorThisWeek = uniqueThisWeekCount > 0 ? (visitsThisWeek / uniqueThisWeekCount).toFixed(1) : '1.0';
  const pagesPerVisitorThisMonth = uniqueThisMonthCount > 0 ? (visitsThisMonth / uniqueThisMonthCount).toFixed(1) : '1.0';

  // ── 4. FREE MOVIES TRAFFIC & AUDIENCE ANALYTICS ──────────────────────────
  const freeVisitsToday = freeVisitsTodayCount || 0;
  const freeVisitsYesterday = freeVisitsYesterdayCount || 0;
  const freeVisitsThisWeek = freeVisitsThisWeekCount || 0;
  const freeVisitsThisMonth = freeVisitsThisMonthCount || 0;
  const freeVisitsLastMonth = freeVisitsLastMonthCount || 0;
  const freeVisitsAllTime = freeVisitsAllTimeCount || 0;

  const freeVisitsGrowthDaily = calcGrowth(freeVisitsToday, freeVisitsYesterday);
  const freeVisitsGrowthMonthly = calcGrowth(freeVisitsThisMonth, freeVisitsLastMonth);

  const freeUniqueToday = new Set();
  const freeUniqueYesterday = new Set();
  const freeUniqueThisWeek = new Set();
  const freeUniqueThisMonth = new Set();

  const freeFreqToday = {};
  const freeFreqThisWeek = {};
  const freeFreqThisMonth = {};

  const priorToTodayFree = new Set();
  const priorToWeekFree = new Set();
  const priorToMonthFree = new Set();

  // First pass: identify visitor history prior to respective boundaries
  freeVisitsRaw?.forEach(v => {
    const vid = v.visitor_id;
    if (!vid) return;
    const vDate = new Date(v.created_at);
    if (vDate < todayStart) priorToTodayFree.add(vid);
    if (vDate < thisWeekStart) priorToWeekFree.add(vid);
    if (vDate < thisMonthStart) priorToMonthFree.add(vid);
  });

  // Second pass: analyze current periods
  freeVisitsRaw?.forEach(v => {
    const vid = v.visitor_id;
    if (!vid) return;
    const vDate = new Date(v.created_at);

    if (vDate >= todayStart) {
      freeUniqueToday.add(vid);
      freeFreqToday[vid] = (freeFreqToday[vid] || 0) + 1;
    } else if (vDate >= yesterdayStart) {
      freeUniqueYesterday.add(vid);
    }

    if (vDate >= thisWeekStart) {
      freeUniqueThisWeek.add(vid);
      freeFreqThisWeek[vid] = (freeFreqThisWeek[vid] || 0) + 1;
    }

    if (vDate >= thisMonthStart) {
      freeUniqueThisMonth.add(vid);
      freeFreqThisMonth[vid] = (freeFreqThisMonth[vid] || 0) + 1;
    }
  });

  const freeUniqueTodayCount = freeUniqueToday.size;
  const freeUniqueYesterdayCount = freeUniqueYesterday.size;
  const freeUniqueThisWeekCount = freeUniqueThisWeek.size;
  const freeUniqueThisMonthCount = freeUniqueThisMonth.size;
  const freeUniqueGrowthDaily = calcGrowth(freeUniqueTodayCount, freeUniqueYesterdayCount);

  // Returning visitors: active in period who had prior visits OR visited >1 time
  let freeReturningToday = 0;
  freeUniqueToday.forEach(vid => {
    if (priorToTodayFree.has(vid) || freeFreqToday[vid] > 1) freeReturningToday++;
  });

  let freeReturningThisWeek = 0;
  freeUniqueThisWeek.forEach(vid => {
    if (priorToWeekFree.has(vid) || freeFreqThisWeek[vid] > 1) freeReturningThisWeek++;
  });

  let freeReturningThisMonth = 0;
  freeUniqueThisMonth.forEach(vid => {
    if (priorToMonthFree.has(vid) || freeFreqThisMonth[vid] > 1) freeReturningThisMonth++;
  });

  const freeNewToday = Math.max(0, freeUniqueTodayCount - freeReturningToday);
  const freeNewThisWeek = Math.max(0, freeUniqueThisWeekCount - freeReturningThisWeek);
  const freeNewThisMonth = Math.max(0, freeUniqueThisMonthCount - freeReturningThisMonth);

  const freeReturnRateToday = freeUniqueTodayCount > 0 ? ((freeReturningToday / freeUniqueTodayCount) * 100).toFixed(1) : '0';
  const freeReturnRateThisWeek = freeUniqueThisWeekCount > 0 ? ((freeReturningThisWeek / freeUniqueThisWeekCount) * 100).toFixed(1) : '0';
  const freeReturnRateThisMonth = freeUniqueThisMonthCount > 0 ? ((freeReturningThisMonth / freeUniqueThisMonthCount) * 100).toFixed(1) : '0';

  const freePagesPerVisitorToday = freeUniqueTodayCount > 0 ? (freeVisitsToday / freeUniqueTodayCount).toFixed(1) : '1.0';
  const freePagesPerVisitorThisWeek = freeUniqueThisWeekCount > 0 ? (freeVisitsThisWeek / freeUniqueThisWeekCount).toFixed(1) : '1.0';
  const freePagesPerVisitorThisMonth = freeUniqueThisMonthCount > 0 ? (freeVisitsThisMonth / freeUniqueThisMonthCount).toFixed(1) : '1.0';

  const freeTrafficShareToday = visitsToday > 0 ? ((freeVisitsToday / visitsToday) * 100).toFixed(1) : '0';
  const freeTrafficShareThisMonth = visitsThisMonth > 0 ? ((freeVisitsThisMonth / visitsThisMonth) * 100).toFixed(1) : '0';

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
        
        // Web Traffic & Total Visits
        totalPageViews: totalPageViews || 0,
        visitsToday,
        visitsYesterday,
        visitsGrowthDaily,
        visitsThisWeek,
        visitsThisMonth,
        uniqueToday: uniqueTodayCount,
        uniqueYesterday: uniqueYesterdayCount,
        uniqueGrowthDaily,
        uniqueThisWeek: uniqueThisWeekCount,
        uniqueThisMonth: uniqueThisMonthCount,
        pagesPerVisitorToday,
        pagesPerVisitorThisWeek,
        pagesPerVisitorThisMonth,

        // Free Movies Traffic & Audience Analytics
        freeVisitsToday,
        freeVisitsYesterday,
        freeVisitsGrowthDaily,
        freeVisitsThisWeek,
        freeVisitsThisMonth,
        freeVisitsLastMonth,
        freeVisitsGrowthMonthly,
        freeVisitsAllTime,
        freeUniqueToday: freeUniqueTodayCount,
        freeUniqueYesterday: freeUniqueYesterdayCount,
        freeUniqueGrowthDaily,
        freeUniqueThisWeek: freeUniqueThisWeekCount,
        freeUniqueThisMonth: freeUniqueThisMonthCount,
        freeReturningToday,
        freeReturningThisWeek,
        freeReturningThisMonth,
        freeNewToday,
        freeNewThisWeek,
        freeNewThisMonth,
        freeReturnRateToday,
        freeReturnRateThisWeek,
        freeReturnRateThisMonth,
        freePagesPerVisitorToday,
        freePagesPerVisitorThisWeek,
        freePagesPerVisitorThisMonth,
        freeTrafficShareToday,
        freeTrafficShareThisMonth,
      }}
      transactions={enrichedTxs}
      recentSignups={recentSignups}
      topMovies={topMovies}
      topUsers={topUsers}
    />
  );
}
