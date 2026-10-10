'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedRef = useRef({ path: '', time: 0 });

  useEffect(() => {
    // 1. Skip if automated browser / crawler bot
    if (typeof navigator !== 'undefined' && navigator.webdriver) {
      return;
    }

    // 2. Skip admin pages and API calls — saves Vercel compute & prevents inflating stats with admin visits
    if (!pathname || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return;
    }

    // 3. Debounce rapid identical navigation (prevent double pings within 1 second)
    const now = Date.now();
    if (lastTrackedRef.current.path === pathname && (now - lastTrackedRef.current.time) < 1000) {
      return;
    }
    lastTrackedRef.current = { path: pathname, time: now };

    try {
      // Get or create persistent visitor ID (365 days / localStorage)
      let visitorId = localStorage.getItem('flx_vid');
      if (!visitorId) {
        visitorId = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : 'vid_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('flx_vid', visitorId);
      }

      // Get or create session ID (expires on browser close)
      let sessionId = sessionStorage.getItem('flx_sid');
      if (!sessionId) {
        sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : 'sid_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('flx_sid', sessionId);
      }

      // Optional: check if user ID is cached from Supabase client in localStorage
      let userId = null;
      try {
        const rawAuth = localStorage.getItem('sb-fplxydnvdmslyrkgshme-auth-token') 
          || Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
        if (rawAuth) {
          const authObj = typeof rawAuth === 'string' && rawAuth.startsWith('{') 
            ? JSON.parse(rawAuth) 
            : JSON.parse(localStorage.getItem(rawAuth) || '{}');
          userId = authObj?.user?.id || null;
        }
      } catch (_) {}

      // Fast non-blocking tracking ping with keepalive
      fetch('/api/v1/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitor_id: visitorId,
          session_id: sessionId,
          user_id: userId,
          path: pathname,
          referrer: document.referrer || null,
          user_agent: navigator.userAgent
        }),
        keepalive: true
      }).catch(() => {}); // Fire and forget
    } catch (e) {
      // Silent error handling for analytics
    }
  }, [pathname]);

  return null;
}
