'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Generate or get visitor ID
    let visitorId = localStorage.getItem('flx_vid');
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem('flx_vid', visitorId);
    }

    // Generate or get session ID (expires when browser closes because it's sessionStorage)
    let sessionId = sessionStorage.getItem('flx_sid');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('flx_sid', sessionId);
    }

    // Send tracking ping
    fetch('/api/v1/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitor_id: visitorId,
        session_id: sessionId,
        path: pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent
      })
    }).catch(console.error); // Silent fail for analytics
  }, [pathname]);

  return null; // Invisible component
}
