import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ searchParams }) {
  const supabase = await createClient()

  // Ensure they are an administrator
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .maybeSingle()

  if (profile?.role !== 'administrator') {
    return (
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text2)' }}>Only Administrators can access User Management.</p>
      </div>
    )
  }

  const query = (await searchParams)?.q || '';
  const filter = (await searchParams)?.filter || 'all';

  const now = new Date();
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  // 1. Fetch live activity data from site_visits
  const [
    { count: totalUsersCount },
    { count: activeSubscribersCount },
    { data: todayVisits }
  ] = await Promise.all([
    admin.from('user_profiles').select('id', { count: 'exact', head: true }),
    admin.from('user_profiles').select('id', { count: 'exact', head: true }).gt('subscription_end_date', now.toISOString()),
    admin.from('site_visits')
      .select('user_id, path, created_at')
      .not('user_id', 'is', null)
      .gte('created_at', todayStart)
      .order('created_at', { ascending: false })
      .limit(500)
  ]);

  // Map active user UUIDs to emails
  const uniqueUuids = [...new Set((todayVisits || []).map(v => v.user_id))];
  const authResponses = await Promise.allSettled(uniqueUuids.map(id => admin.auth.admin.getUserById(id)));
  
  const uuidToEmail = {};
  authResponses.forEach((res, idx) => {
    if (res.status === 'fulfilled' && res.value?.data?.user?.email) {
      uuidToEmail[uniqueUuids[idx]] = res.value.data.user.email.toLowerCase().trim();
    }
  });

  const activityMap = {};
  let onlineNowCount = 0;
  const activeTodayEmails = new Set();

  (todayVisits || []).forEach(v => {
    const email = uuidToEmail[v.user_id];
    if (!email) return;

    activeTodayEmails.add(email);
    const isOnline = new Date(v.created_at) >= new Date(thirtyMinAgo);

    if (!activityMap[email]) {
      if (isOnline) onlineNowCount++;
      activityMap[email] = {
        isOnline,
        lastActive: v.created_at,
        lastPath: v.path
      };
    }
  });

  // 2. Fetch user profiles (with server-side filter)
  let dbQuery = admin
    .from('user_profiles')
    .select('*')
    .order('id', { ascending: false })
    .limit(100);

  if (query) {
    dbQuery = dbQuery.or(`email.ilike.%${query}%,username.ilike.%${query}%`);
  }

  if (filter === 'active') {
    dbQuery = dbQuery.gt('subscription_end_date', now.toISOString());
  } else if (filter === 'expired') {
    dbQuery = dbQuery.lt('subscription_end_date', now.toISOString());
  } else if (filter === 'frozen') {
    dbQuery = dbQuery.eq('role', 'frozen');
  }

  const { data: rawUsers, error } = await dbQuery;

  if (error) {
    console.error('[AdminUsersPage] DB Error:', error);
  }

  // Enrich users with activity info
  let users = (rawUsers || []).map(u => {
    const emailKey = u.email?.toLowerCase().trim();
    const activity = activityMap[emailKey] || null;
    return {
      ...u,
      isOnline: activity?.isOnline || false,
      lastActive: activity?.lastActive || null,
      lastPath: activity?.lastPath || null,
      isActiveToday: activeTodayEmails.has(emailKey)
    };
  });

  // Apply memory filters if filtering by activity
  if (filter === 'online') {
    users = users.filter(u => u.isOnline);
  } else if (filter === 'today') {
    users = users.filter(u => u.isActiveToday);
  }

  const stats = {
    totalUsers: totalUsersCount || 0,
    activeSubscribers: activeSubscribersCount || 0,
    onlineNow: onlineNowCount,
    activeToday: activeTodayEmails.size
  };

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>User Management &amp; Activity</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '24px' }}>
        Track real-time active users, inspect activity status, manage accounts, and assign roles.
      </p>

      <UsersClient
        users={users}
        stats={stats}
        initialSearch={query}
        initialFilter={filter}
      />
    </div>
  )
}
