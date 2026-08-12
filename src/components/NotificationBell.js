'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

export default function NotificationBell({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (!userId) return;

    async function fetchNotifications() {
      const res = await fetch('/api/v1/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    }

    fetchNotifications();
  }, [userId]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function markAllRead() {
    await fetch('/api/v1/notifications', { method: 'PATCH' });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  const typeIcon = (type) => {
    switch (type) {
      case 'referral_earned':     return '💰';
      case 'payout_approved':     return '✅';
      case 'subscription_expiry': return '⏳';
      case 'new_content':         return '🎬';
      case 'new_episode':         return '📺';
      default:                    return '🔔';
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => { setOpen(!open); if (!open && unreadCount > 0) markAllRead(); }}
        style={{
          position: 'relative',
          width: '38px', height: '38px',
          borderRadius: '50%',
          background: open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          border: '1px solid var(--border)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        aria-label="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '2px', right: '2px',
            background: 'var(--acc)', color: '#fff',
            width: '16px', height: '16px', borderRadius: '50%',
            fontSize: '10px', fontWeight: '700',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: '340px',
          background: 'rgba(18,18,18,0.98)',
          border: '1px solid var(--border2)',
          borderRadius: '14px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          backdropFilter: 'blur(20px)',
          overflow: 'hidden',
          zIndex: 500,
          animation: 'fadeSlideDown 0.18s ease'
        }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#fff' }}>Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{ color: 'var(--acc)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', fontSize: '14px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => { setOpen(false); }}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid var(--border)',
                    background: n.is_read ? 'transparent' : 'rgba(229,9,20,0.05)',
                    cursor: n.link ? 'pointer' : 'default',
                    transition: 'background 0.15s'
                  }}
                >
                  <Link href={n.link || '#'} style={{ textDecoration: 'none', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{typeIcon(n.type)}</span>
                    <div>
                      <div style={{ fontWeight: n.is_read ? '500' : '700', color: '#fff', fontSize: '13px', marginBottom: '3px' }}>
                        {n.title}
                      </div>
                      {n.body && <div style={{ color: 'var(--text2)', fontSize: '12px', lineHeight: '1.4' }}>{n.body}</div>}
                      <div style={{ color: 'var(--text3)', fontSize: '11px', marginTop: '4px' }}>
                        {new Date(n.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {!n.is_read && (
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--acc)', flexShrink: 0, marginTop: '6px', marginLeft: 'auto' }} />
                    )}
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
