import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function AdminUsersPage({ searchParams }) {
  const supabase = await createClient()

  // Ensure they are an administrator
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single()

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

  // Fetch user profiles (server-side search)
  let dbQuery = supabase
    .from('user_profiles')
    .select('*')
    .order('id', { ascending: false })
    .limit(100);

  if (query) {
    dbQuery = dbQuery.or(`email.ilike.%${query}%,username.ilike.%${query}%`);
  }

  if (filter === 'active') {
    dbQuery = dbQuery.gt('subscription_end_date', new Date().toISOString());
  } else if (filter === 'expired') {
    dbQuery = dbQuery.lt('subscription_end_date', new Date().toISOString());
  }

  const { data: users } = await dbQuery;

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>User Management</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Manage users, assign roles, or add new team members.
      </p>

      <UsersClient users={users || []} initialSearch={query} initialFilter={filter} />
    </div>
  )
}
