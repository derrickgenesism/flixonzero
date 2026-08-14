import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', background: 'var(--bg2)', padding: '20px', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <img src="/logo.png" alt="FlixOn" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
          <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--acc)', opacity: 0.7 }}>ADMIN PANEL</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>Content</div>
          <Link href="/admin" style={{ color: '#fff', fontSize: '14px' }}>📊 Dashboard</Link>
          <Link href="/admin/movies/add" style={{ color: '#fff', fontSize: '14px' }}>🎬 Add Movie</Link>
          <Link href="/admin/movies" style={{ color: '#fff', fontSize: '14px' }}>📋 Manage Movies</Link>
          <Link href="/admin/series" style={{ color: '#fff', fontSize: '14px' }}>📺 Manage Series</Link>
          <Link href="/admin/collections" style={{ color: '#fff', fontSize: '14px' }}>🗂️ Collections</Link>
          <Link href="/admin/tmdb" style={{ color: '#fff', fontSize: '14px' }}>🔍 TMDB Importer</Link>
          <Link href="/admin/movies/cloudflare-import" style={{ color: '#fff', fontSize: '14px' }}>☁️ Cloudflare Import</Link>
          <Link href="/admin/movies/upload" style={{ color: '#fff', fontSize: '14px' }}>⬆️ Direct Upload</Link>
          <Link href="/admin/movies/compress-existing" style={{ color: '#fff', fontSize: '14px' }}>🗜️ Compress Existing</Link>

          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text3)', textTransform: 'uppercase', margin: '12px 0 4px' }}>Revenue</div>
          <Link href="/admin/plans" style={{ color: '#fff', fontSize: '14px' }}>💳 Subscription Plans</Link>
          <Link href="/admin/transactions" style={{ color: '#fff', fontSize: '14px' }}>💰 Transactions</Link>
          <Link href="/admin/payouts" style={{ color: '#fff', fontSize: '14px' }}>💸 Payout Requests</Link>
          <Link href="/admin/affiliates" style={{ color: '#fff', fontSize: '14px' }}>🤝 Affiliates & Referrals</Link>
          <Link href="/admin/promo-codes" style={{ color: '#fff', fontSize: '14px' }}>🎁 Promo & Gift Codes</Link>

          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text3)', textTransform: 'uppercase', margin: '12px 0 4px' }}>Users</div>
          <Link href="/admin/users" style={{ color: '#fff', fontSize: '14px' }}>👥 User Management</Link>
          <Link href="/admin/users/migrate-manually" style={{ color: '#fff', fontSize: '14px' }}>📥 Migrate Users</Link>
          <Link href="/admin/notifications" style={{ color: '#fff', fontSize: '14px' }}>🔔 Send Notifications</Link>
          <Link href="/admin/support" style={{ color: '#fff', fontSize: '14px' }}>💬 Support Tickets</Link>

          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text3)', textTransform: 'uppercase', margin: '12px 0 4px' }}>Config</div>
          <Link href="/admin/homepage" style={{ color: '#fff', fontSize: '14px' }}>🏠 Homepage Layout</Link>
          <Link href="/admin/settings" style={{ color: '#fff', fontSize: '14px' }}>⚙️ Settings & API Keys</Link>
          <Link href="/admin/cache-warmer" style={{ color: '#fff', fontSize: '14px' }}>🔥 Cache Warmer</Link>
          <Link href="/" style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '20px' }}>← Back to Site</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px' }}>
        {children}
      </main>
    </div>
  )
}
