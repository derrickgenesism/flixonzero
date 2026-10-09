import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebar from './AdminSidebar'

export default async function AdminLayout({ children }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single()

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
    redirect('/')
  }

  // Fetch unread support messages count
  const { count: unreadSupportCount } = await supabase
    .from('support_messages')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
    .eq('sender_role', 'user');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg)' }}>
      <style dangerouslySetInnerHTML={{
        __html: `
          @media (min-width: 769px) {
            .admin-layout-wrapper { flex-direction: row !important; }
          }
          .admin-main-content {
            flex: 1;
            padding: 40px;
            max-width: 100vw;
            overflow-x: hidden;
          }
          @media (max-width: 768px) {
            .admin-main-content { padding: 15px; }
          }
        `
      }} />
      <div className="admin-layout-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%' }}>
        <AdminSidebar unreadSupportCount={unreadSupportCount || 0} />
        
        {/* Main Content */}
        <main className="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
