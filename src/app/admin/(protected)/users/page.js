import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import UsersClient from './UsersClient'

export default async function AdminUsersPage() {
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

  // Fetch all user profiles
  const { data: users } = await supabase
    .from('user_profiles')
    .select('*')
    .order('id', { ascending: false })

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>User Management</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Manage users, assign roles, or add new team members.
      </p>

      <UsersClient users={users || []} />
    </div>
  )
}
