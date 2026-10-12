'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// ============================================================================
// 1. Module-Scoped State (Survives React 19 Concurrent Remounts & Strict Mode)
// ============================================================================
let globalLastTracked = {
  path: '',
  time: 0
};
let previousSpaUrl = null;
let cachedUserId = null;
let authListenerInitialized = false;

// Strict RFC 4122 UUID v4 regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CLIENT_BOT_REGEX = /bot|crawl|spider|slurp|headless|facebookexternalhit|twitterbot|bytespider|googlebot/i;

// ============================================================================
// 2. Multi-Tier Resilient Storage Engine (Storage -> Cookie -> Memory)
// ============================================================================
const memoryStore = new Map();

function safeGetStorage(storageType, key) {
  try {
    if (typeof window !== 'undefined' && window[storageType]) {
      return window[storageType].getItem(key);
    }
  } catch (_) {}
  return null;
}

function safeSetStorage(storageType, key, value) {
  try {
    if (typeof window !== 'undefined' && window[storageType]) {
      window[storageType].setItem(key, value);
      return true;
    }
  } catch (_) {}
  return false;
}

function safeGetCookie(name) {
  try {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^|;\\s*)' + encodeURIComponent(name) + '=([^;]*)'));
    return match ? decodeURIComponent(match[2]) : null;
  } catch (_) {
    return null;
  }
}

function safeSetCookie(name, value, maxAgeSeconds) {
  try {
    if (typeof document === 'undefined') return;
    let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
    if (maxAgeSeconds) {
      cookieStr += `; max-age=${maxAgeSeconds}`;
    }
    document.cookie = cookieStr;
  } catch (_) {}
}

// RFC 4122 compliant UUID v4 generator (guaranteed valid for PostgreSQL UUID columns)
function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Resilient Visitor ID (Persistent ~ 1 Year, falls back to cookie/memory in Safari Private)
function getOrCreateVisitorId() {
  const KEY = 'flx_vid';
  let vid = safeGetStorage('localStorage', KEY) || safeGetCookie(KEY) || memoryStore.get(KEY);

  if (!vid || !UUID_REGEX.test(vid)) {
    vid = generateUUID();
    safeSetStorage('localStorage', KEY, vid);
    safeSetCookie(KEY, vid, 31536000); // 365 days
    memoryStore.set(KEY, vid);
  } else {
    // Keep layers in sync
    safeSetStorage('localStorage', KEY, vid);
    safeSetCookie(KEY, vid, 31536000);
    memoryStore.set(KEY, vid);
  }
  return vid;
}

// Resilient Session ID (Session-scoped, falls back to cookie/memory)
function getOrCreateSessionId() {
  const KEY = 'flx_sid';
  let sid = safeGetStorage('sessionStorage', KEY) || safeGetCookie(KEY) || memoryStore.get(KEY);

  if (!sid || !UUID_REGEX.test(sid)) {
    sid = generateUUID();
    safeSetStorage('sessionStorage', KEY, sid);
    safeSetCookie(KEY, sid, null); // Session cookie (no max-age, cleared on browser close)
    memoryStore.set(KEY, sid);
  } else {
    safeSetStorage('sessionStorage', KEY, sid);
    safeSetCookie(KEY, sid, null);
    memoryStore.set(KEY, sid);
  }
  return sid;
}

// Dynamic Supabase Project Ref resolution
function getSupabaseProjectRef() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (url) {
      return new URL(url).hostname.split('.')[0];
    }
  } catch (_) {}
  return null;
}

// Synchronous extraction for Supabase user ID from Cookie / LocalStorage
function getSynchronousUserId() {
  if (cachedUserId) return cachedUserId;

  const projectRef = getSupabaseProjectRef();
  const tokenKey = projectRef ? `sb-${projectRef}-auth-token` : null;

  // 1. Check @supabase/ssr cookies (primary storage for Next.js SSR)
  if (tokenKey) {
    const rawCookie = safeGetCookie(tokenKey) || safeGetCookie(`${tokenKey}.0`);
    if (rawCookie) {
      try {
        let parsed = rawCookie;
        if (parsed.startsWith('base64-')) {
          parsed = atob(parsed.slice(7));
        }
        const obj = JSON.parse(parsed);
        const uid = obj?.user?.id || obj?.[0]?.user?.id;
        if (uid && UUID_REGEX.test(uid)) return uid;
      } catch (_) {}
    }
  }

  // 2. Check localStorage fallback
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const storageKey = tokenKey && window.localStorage.getItem(tokenKey)
        ? tokenKey
        : Object.keys(window.localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

      if (storageKey) {
        const raw = window.localStorage.getItem(storageKey);
        if (raw) {
          const obj = JSON.parse(raw);
          const uid = obj?.user?.id;
          if (uid && UUID_REGEX.test(uid)) return uid;
        }
      }
    }
  } catch (_) {}

  return null;
}

// ============================================================================
// 3. AnalyticsTracker Component
// ============================================================================
export default function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initializedRef = useRef(false);

  // Initialize Supabase Auth state listener
  useEffect(() => {
    if (authListenerInitialized) return;
    authListenerInitialized = true;

    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.user?.id && UUID_REGEX.test(data.session.user.id)) {
          cachedUserId = data.session.user.id;
        }
      }).catch(() => {});

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        cachedUserId = (session?.user?.id && UUID_REGEX.test(session.user.id)) ? session.user.id : null;
      });

      return () => {
        subscription?.unsubscribe?.();
      };
    } catch (_) {}
  }, []);

  // Tracking function with deduplication and bfcache support
  const trackVisit = (isBfCacheRestore = false) => {
    // 1. Skip crawler bots and headless drivers
    if (typeof navigator !== 'undefined') {
      if (navigator.webdriver) return;
      if (CLIENT_BOT_REGEX.test(navigator.userAgent || '')) return;
    }

    // 2. Skip background prerender states
    if (typeof document !== 'undefined' && document.visibilityState === 'prerender') {
      return;
    }

    // 3. Canonical path resolution
    const currentPath = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
    if (!currentPath || currentPath.startsWith('/admin') || currentPath.startsWith('/api')) {
      return;
    }

    const queryString = searchParams ? searchParams.toString() : (typeof window !== 'undefined' ? window.location.search.replace(/^\?/, '') : '');
    const fullPath = queryString ? `${currentPath}?${queryString}` : currentPath;

    // 4. Strict Deduplication
    const now = Date.now();
    const isSamePath = globalLastTracked.path === fullPath;

    if (!isBfCacheRestore) {
      // If path hasn't changed, never fire duplicate (regardless of idle time)
      if (isSamePath) return;
      // Rapid bounce guard: at least 600ms between different paths
      if (now - globalLastTracked.time < 600) return;
    } else {
      // For bfcache restores, require at least 1500ms since last recorded visit
      if (now - globalLastTracked.time < 1500) return;
    }

    // Update module-level tracking state
    globalLastTracked = { path: fullPath, time: now };

    // 5. Accurate SPA Referrer Resolution
    let referrer = null;
    if (previousSpaUrl) {
      referrer = previousSpaUrl;
    } else if (typeof document !== 'undefined' && document.referrer) {
      referrer = document.referrer;
    }
    if (typeof window !== 'undefined') {
      previousSpaUrl = window.location.href;
    }

    // 6. Multi-tier ID retrieval (never throws or drops user)
    const visitorId = getOrCreateVisitorId();
    const sessionId = getOrCreateSessionId();
    const userId = getSynchronousUserId();

    const payload = JSON.stringify({
      visitor_id: visitorId,
      session_id: sessionId,
      user_id: userId,
      path: fullPath,
      referrer: referrer ? referrer.slice(0, 500) : null,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null
    });

    // 7. Non-blocking beacon or keepalive fetch
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && isBfCacheRestore) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/v1/track', blob);
      } else {
        fetch('/api/v1/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (_) {}
  };

  // Main React Navigation Effect
  useEffect(() => {
    trackVisit(false);
  }, [pathname, searchParams]);

  // BfCache & Native History Listeners
  useEffect(() => {
    if (initializedRef.current || typeof window === 'undefined') return;
    initializedRef.current = true;

    // Handle Back/Forward Cache (bfcache) restore
    const handlePageShow = (event) => {
      if (event.persisted) {
        trackVisit(true);
      }
    };

    // Monkey-patch pushState and replaceState to catch imperative navigations
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    const handleHistoryChange = () => {
      setTimeout(() => trackVisit(false), 50);
    };

    window.history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      handleHistoryChange();
      return result;
    };

    window.history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      handleHistoryChange();
      return result;
    };

    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handleHistoryChange);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handleHistoryChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return null;
}
