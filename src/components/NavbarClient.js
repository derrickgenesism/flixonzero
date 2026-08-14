'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchInput from './SearchInput';
import NotificationBell from './NotificationBell';
import { logoutAndClearProfile } from '@/app/profiles/actions';

import { createClient } from '@/utils/supabase/client';

export default function NavbarClient({ user, activeProfile, isActive, daysLeft }) {
  const [scrolled, setScrolled] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', user.email)
        .single();
      
      if (!profile) return;

      const { data: thread } = await supabase
        .from('support_threads')
        .select('id')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (!thread) return;

      const { count } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', thread.id)
        .eq('sender_role', 'admin')
        .eq('is_read', false);

      setUnreadCount(count || 0);

      // Subscribe to new messages
      const channel = supabase
        .channel('desktop_support_unread_badge')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `thread_id=eq.${thread.id}`
        }, (payload) => {
          if (payload.new.sender_role === 'admin' && !payload.new.is_read) {
            setUnreadCount(prev => prev + 1);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'support_messages',
          filter: `thread_id=eq.${thread.id}`
        }, (payload) => {
          if (payload.new.is_read && !payload.old.is_read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchUnread();
  }, [user, supabase]);

  return (
    <nav className={`flx-nav${scrolled ? ' flx-nav--scrolled' : ''}`}>
      {/* Left: Logo + Links */}
      <Link href="/" className="flx-nav__logo" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo.png" alt="FlixOn" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
      </Link>
      <div className="flx-nav__links">
        <Link href="/" className={`flx-nav__link${pathname === '/' ? ' flx-nav__link--active' : ''}`}>Home</Link>
        <Link href="/movies" className={`flx-nav__link${pathname === '/movies' ? ' flx-nav__link--active' : ''}`}>Movies</Link>
        <Link href="/my-list" className={`flx-nav__link${pathname === '/my-list' ? ' flx-nav__link--active' : ''}`}>My List</Link>
      </div>

      {/* Center: Search */}
      <div className="flx-nav__search">
        <SearchInput />
      </div>

      {/* Right: User area */}
      <div className="flx-nav__right">
        {user ? (
          <>
            <Link href="/support" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)', cursor: 'pointer', marginRight: '8px' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: '-4px', right: '-6px',
                  background: '#e50914', color: '#fff',
                  width: '16px', height: '16px', borderRadius: '50%',
                  fontSize: '10px', fontWeight: 'bold',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <Link href="/profiles" style={{ cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }} title="Switch Profile">
              <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                {activeProfile ? activeProfile.name.charAt(0).toUpperCase() : '?'}
              </div>
            </Link>
            <form action={logoutAndClearProfile}>
              <button type="submit" className="gms-btn gms-btn--ghost" style={{ padding: '8px 14px', fontSize: '13px' }}>
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="gms-btn gms-btn--ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
