import { NextResponse, after } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

// ── 0. RUNTIME CONFIG & SINGLETON CLIENT ────────────────────────────────────
let supabaseAdminInstance = null;
function getAdminClient() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createAdminClient();
  }
  return supabaseAdminInstance;
}

// ── 1. BOT & CRAWLER DETECTION ─────────────────────────────────────────────
// Compiled once at module scope — zero per-request compilation cost
const BOT_USER_AGENT_REGEX = new RegExp(
  [
    'bot', 'crawler', 'spider', 'scraper',
    'googlebot', 'bingbot', 'yandex', 'baiduspider', 'duckduckbot', 'slurp', 'sogou', 'exabot',
    'facebookexternalhit', 'facebot', 'twitterbot', 'linkedinbot', 'pinterestbot', 'slackbot', 'telegrambot', 'whatsapp', 'discordbot',
    'ahrefsbot', 'semrushbot', 'dotbot', 'mj12bot', 'petalbot', 'bytespider', 'dataforseobot', 'screaming frog', 'seokicks', 'blexbot',
    'headlesschrome', 'phantomjs', 'selenium', 'puppeteer', 'playwright', 'cypress', 'webdriver',
    'curl', 'wget', 'python-requests', 'python-urllib', 'aiohttp', 'httpx', 'axios', 'go-http-client', 'java/', 'libwww-perl', 'postmanruntime', 'insomnia', 'node-fetch', 'undici', 'scrapy', 'httpie',
    'uptimerobot', 'pingdom', 'better uptime', 'statuscake', 'site24x7', 'checkly', 'datadog', 'newrelicpinger',
    'gptbot', 'chatgpt-user', 'claudebot', 'anthropic-ai', 'ccbot', 'perplexitybot', 'applebot-extended', 'cohere-ai', 'omgilibot', 'diffbot'
  ].join('|'),
  'i'
);

function isBotRequest(request, bodyUserAgent) {
  const headerUa = request.headers.get('user-agent') || '';
  const candidateUa = headerUa || bodyUserAgent || '';

  // Suspiciously missing or stubbed user-agent
  if (!candidateUa || candidateUa.length < 10) return true;

  // Bot signature pattern match
  if (BOT_USER_AGENT_REGEX.test(candidateUa)) return true;

  // Check automated prefetch/prerender headers
  const purpose = request.headers.get('purpose') || request.headers.get('x-purpose') || '';
  if (purpose.toLowerCase() === 'preview' || purpose.toLowerCase() === 'prefetch') return true;

  // Check client automation hints if available
  const secChUa = request.headers.get('sec-ch-ua') || '';
  if (secChUa.includes('Headless') || secChUa.includes('Automation')) return true;

  return false;
}

// ── 2. IN-MEMORY SLIDING LRU DEDUPLICATION CACHE ──────────────────────────
const DEDUP_WINDOW_MS = 5000; // 5-second deduplication window
const MAX_DEDUP_CACHE_SIZE = 10000; // Keeps RAM consumption under 500KB
const visitDedupCache = new Map();

function isDuplicateVisit(visitorId, path) {
  const now = Date.now();
  const key = `${visitorId}:${path}`;
  const lastRecorded = visitDedupCache.get(key);

  if (lastRecorded && (now - lastRecorded) < DEDUP_WINDOW_MS) {
    return true;
  }

  // Refresh entry to maintain LRU eviction order
  visitDedupCache.delete(key);
  visitDedupCache.set(key, now);

  // Evict oldest entry in O(1) if capacity is reached
  if (visitDedupCache.size > MAX_DEDUP_CACHE_SIZE) {
    const oldestKey = visitDedupCache.keys().next().value;
    visitDedupCache.delete(oldestKey);
  }

  return false;
}

// ── 3. SANITIZATION & VALIDATION ───────────────────────────────────────────
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS_REGEX = /[\x00-\x1F\x7F]/g;
const MAX_PAYLOAD_BYTES = 8192; // Max 8 KB payload guard

function cleanString(val, maxLength = 500) {
  if (typeof val !== 'string') return null;
  const sanitized = val.replace(CONTROL_CHARS_REGEX, '').trim();
  return sanitized.length > 0 ? sanitized.slice(0, maxLength) : null;
}

// ── 4. ROUTE HANDLER ──────────────────────────────────────────────────────
export async function POST(request) {
  try {
    // A. Payload Size Guard
    const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // B. Content-Type Guard
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 415 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { visitor_id, session_id, path, referrer, user_agent, user_id } = body;

    // C. Server-Side Bot Detection (Exit fast: 0 DB calls)
    if (isBotRequest(request, user_agent)) {
      return NextResponse.json({ success: true, skipped: 'bot' });
    }

    // D. Validate UUIDs (visitor_id and session_id)
    if (!visitor_id || typeof visitor_id !== 'string' || !UUID_REGEX.test(visitor_id)) {
      return NextResponse.json({ error: 'Invalid visitor_id' }, { status: 400 });
    }
    if (!session_id || typeof session_id !== 'string' || !UUID_REGEX.test(session_id)) {
      return NextResponse.json({ error: 'Invalid session_id' }, { status: 400 });
    }

    // E. Sanitize & Validate Path
    if (!path || typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const sanitizedPath = cleanString(path, 500);
    if (!sanitizedPath) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Never track admin, internal Next.js assets, or API routes
    if (
      sanitizedPath.startsWith('/admin') ||
      sanitizedPath.startsWith('/api') ||
      sanitizedPath.startsWith('/_next') ||
      sanitizedPath.startsWith('/favicon.ico') ||
      sanitizedPath.startsWith('/robots.txt') ||
      sanitizedPath.startsWith('/sitemap.xml')
    ) {
      return NextResponse.json({ success: true, skipped: 'internal_route' });
    }

    // F. Rapid Duplication Prevention (Exit fast: 0 DB calls)
    if (isDuplicateVisit(visitor_id, sanitizedPath)) {
      return NextResponse.json({ success: true, skipped: 'duplicate' });
    }

    // G. Sanitize Optional Attributes
    const sanitizedReferrer = cleanString(referrer, 500);
    const resolvedUserAgent = cleanString(request.headers.get('user-agent') || user_agent, 500);
    const sanitizedUserId = (user_id && typeof user_id === 'string' && UUID_REGEX.test(user_id))
      ? user_id
      : null;

    // H. Asynchronous Background Insert via Next.js 16 after()
    // This allows the route to return HTTP 200 to the client in <5ms!
    after(async () => {
      try {
        const supabase = getAdminClient();
        const { error } = await supabase.from('site_visits').insert({
          visitor_id,
          session_id,
          user_id: sanitizedUserId,
          path: sanitizedPath,
          referrer: sanitizedReferrer,
          user_agent: resolvedUserAgent
        });

        if (error) {
          console.error('[Track Ingestion Error]:', error.message);
        }

        // Auto-ban any account detected on a blocked device fingerprint
        if (sanitizedUserId) {
          try {
            const { isFingerprintBlocked, sendSecurityTelegramAlert } = await import('@/lib/ipShield');
            const isBlocked = await isFingerprintBlocked(visitor_id);
            if (isBlocked) {
              const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('role, email')
                .eq('id', sanitizedUserId)
                .maybeSingle();

              if (userProfile && userProfile.role !== 'banned') {
                await supabase.from('user_profiles').update({ role: 'banned' }).eq('id', sanitizedUserId);
                try {
                  await supabase.auth.admin.updateUserById(sanitizedUserId, { ban_duration: '876000h' });
                } catch {}
                await sendSecurityTelegramAlert({
                  title: '🚨 BLOCKED DEVICE DETECTED: AUTO-BANNED NEW ACCOUNT',
                  details: [
                    { label: 'Account Email', value: userProfile.email },
                    { label: 'User ID', value: sanitizedUserId },
                    { label: 'Device Fingerprint', value: visitor_id },
                    { label: 'Path Visited', value: sanitizedPath }
                  ]
                });
              }
            }
          } catch (guardErr) {
            console.warn('[Track Ingestion Guard Error]:', guardErr.message);
          }
        }
      } catch (insertErr) {
        console.error('[Track Ingestion Exception]:', insertErr.message);
      }
    });

    // Return immediate response to the client (<5ms)
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Track Route Exception]:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
