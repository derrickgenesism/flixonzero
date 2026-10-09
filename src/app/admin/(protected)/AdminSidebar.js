'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AdminSidebar({ unreadSupportCount }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {isMobile && (
        <div style={{ background: 'var(--bg2)', padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.png" alt="FlixOn" style={{ height: '30px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '2px', color: 'var(--acc)', textTransform: 'uppercase' }}>ADMIN</span>
          </div>
          <button onClick={() => setIsOpen(!isOpen)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>
            {isOpen ? '✕ Close' : '☰ Menu'}
          </button>
        </div>
      )}

      <aside style={{ 
        width: isMobile ? '100%' : '250px', 
        background: 'var(--bg2)', 
        padding: '20px', 
        borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.1)',
        display: (!isMobile || isOpen) ? 'block' : 'none',
        flexShrink: 0
      }}>
        {!isMobile && (
          <div style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <img src="/logo.png" alt="FlixOn" style={{ height: '52px', width: 'auto', objectFit: 'contain' }} />
            <span style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--acc)', opacity: 0.7 }}>ADMIN PANEL</span>
          </div>
        )}
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text3)', textTransform: 'uppercase', marginBottom: '4px' }}>Content</div>
          <Link href="/admin" style={{ color: '#fff', fontSize: '14px' }}>📊 Dashboard</Link>
          <Link href="/admin/movies/add" style={{ color: '#fff', fontSize: '14px' }}>➕ Add Movie</Link>
          <Link href="/admin/movies" style={{ color: '#fff', fontSize: '14px' }}>🎬 Manage Movies</Link>
          <Link href="/admin/series" style={{ color: '#fff', fontSize: '14px' }}>📺 Manage Series</Link>
          <Link href="/admin/collections" style={{ color: '#fff', fontSize: '14px' }}>📁 Collections</Link>
          <Link href="/admin/tmdb" style={{ color: '#fff', fontSize: '14px' }}>☁ TMDB Importer</Link>
          <Link href="/admin/movies/cloudflare-import" style={{ color: '#fff', fontSize: '14px' }}>🌩 Cloudflare Import</Link>
          <Link href="/admin/movies/upload" style={{ color: '#fff', fontSize: '14px' }}>⬆ Direct Upload</Link>
          <Link href="/admin/movies/compress-existing" style={{ color: '#fff', fontSize: '14px' }}>🗜 Compress Existing</Link>

          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text3)', textTransform: 'uppercase', margin: '12px 0 4px' }}>Revenue</div>
          <Link href="/admin/plans" style={{ color: '#fff', fontSize: '14px' }}>💳 Subscription Plans</Link>
          <Link href="/admin/transactions" style={{ color: '#fff', fontSize: '14px' }}>💰 Transactions</Link>
          <Link href="/admin/payouts" style={{ color: '#fff', fontSize: '14px' }}>💸 Payout Requests</Link>
          <Link href="/admin/affiliates" style={{ color: '#fff', fontSize: '14px' }}>🤝 Affiliates & Referrals</Link>
          <Link href="/admin/promo-codes" style={{ color: '#fff', fontSize: '14px' }}>🎁 Promo Codes</Link>

          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text3)', textTransform: 'uppercase', margin: '12px 0 4px' }}>Users</div>
          <Link href="/admin/users" style={{ color: '#fff', fontSize: '14px' }}>👥 User Management</Link>
          <Link href="/admin/users/migrate-manually" style={{ color: '#fff', fontSize: '14px' }}>🔄 Migrate Users</Link>
          <Link href="/admin/notifications" style={{ color: '#fff', fontSize: '14px' }}>🔔 Send Notifications</Link>
          <Link href="/admin/support" style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>🎧 Support Tickets</span>
            {unreadSupportCount > 0 && (
              <span style={{ background: 'red', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px' }}>
                {unreadSupportCount}
              </span>
            )}
          </Link>

          <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '1px', color: 'var(--text3)', textTransform: 'uppercase', margin: '12px 0 4px' }}>Config</div>
          <Link href="/admin/homepage" style={{ color: '#fff', fontSize: '14px' }}>🏠 Homepage Layout</Link>
          <Link href="/admin/settings" style={{ color: '#fff', fontSize: '14px' }}>⚙ Settings & API Keys</Link>
          <Link href="/admin/backups" style={{ color: '#fff', fontSize: '14px' }}>💾 Database Backups</Link>
          <Link href="/admin/cache-warmer" style={{ color: '#fff', fontSize: '14px' }}>🔥 Cache Warmer</Link>
          <Link href="/admin/security-logs" style={{ color: '#fff', fontSize: '14px' }}>🛡 Security Center</Link>
          <Link href="/" style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '20px' }}>⬅ Back to Site</Link>
        </nav>
      </aside>
    </>
  );
}
