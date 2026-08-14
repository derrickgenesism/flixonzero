'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        .channel('support_unread_badge')
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
  }, [supabase]);

  return (
    <div className="mobile-bottom-nav">
      <Link href="/" className={`mbn-link ${pathname === '/' ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Home</span>
      </Link>
      
      <Link href="/movies" className={`mbn-link ${pathname === '/movies' ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <line x1="2" y1="7" x2="7" y2="7" />
          <line x1="2" y1="17" x2="7" y2="17" />
          <line x1="17" y1="17" x2="22" y2="17" />
          <line x1="17" y1="7" x2="22" y2="7" />
        </svg>
        <span>Movies</span>
      </Link>

      <Link href="/search" className={`mbn-link ${pathname === '/search' ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <span>Search</span>
      </Link>

      <Link href="/support" className={`mbn-link ${pathname === '/support' ? 'active' : ''}`} style={{ position: 'relative' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '25%',
            background: '#e50914',
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '10px',
            padding: '2px 6px',
            minWidth: '16px',
            textAlign: 'center',
            border: '2px solid var(--bg)'
          }}>
            {unreadCount}
          </div>
        )}
        <span>Support</span>
      </Link>

      <Link href="/account" className={`mbn-link ${pathname === '/account' ? 'active' : ''}`}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>Profile</span>
      </Link>
    </div>
  );
}
