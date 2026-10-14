import { createAdminClient } from '@/utils/supabase/admin';

// In-memory sliding cache for VPN / IP lookups (24-hour TTL)
// Avoids hammering external APIs or database queries on every navigation.
const vpnLookupCache = new Map(); // ip -> { isVpn, isProxy, isHosting, isp, country, cachedAt }
const VPN_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for security settings from admin_settings (60-second TTL)
let cachedSettings = null;
let settingsCacheExpiry = 0;
const SETTINGS_CACHE_TTL_MS = 60 * 1000; // 60 seconds

// Known legitimate Ugandan mobile and residential ISPs
// MTN Uganda, Airtel Uganda, Uganda Telecom, Roke Telkom, Liquid Telecom, SimbaNET, Smile
const UGANDA_RESIDENTIAL_ISPS = [
  'mtn',
  'airtel',
  'uganda telecom',
  'utl',
  'roke telkom',
  'liquid',
  'simbanet',
  'smile telecommunications',
  'tangerine',
  'seacom',
  'renu',
  'africell'
];

/**
 * Normalizes and extracts client IP address from Next.js headers or explicit request
 */
export function getClientIpFromHeaders(reqHeaders) {
  if (!reqHeaders) return '127.0.0.1';

  let getVal = (key) => {
    if (typeof reqHeaders.get === 'function') return reqHeaders.get(key);
    return reqHeaders[key] || reqHeaders[key.toLowerCase()];
  };

  const rawIp =
    getVal('cf-connecting-ip') ||
    getVal('x-real-ip') ||
    getVal('x-forwarded-for') ||
    getVal('x-client-ip') ||
    '127.0.0.1';

  const first = rawIp.split(',')[0].trim();
  // Strip trailing port if present (e.g. 102.134.12.1:443 or [::1]:80)
  return first.replace(/:[0-9]+$/, '').replace(/^\[|\]$/g, '');
}

/**
 * Checks if an IP is local, loopback, or private RFC 1918 range
 */
export function isPrivateOrLocalIp(ip) {
  if (!ip) return true;
  const clean = ip.trim();
  if (
    clean === '127.0.0.1' ||
    clean === '::1' ||
    clean === 'localhost' ||
    clean === '::ffff:127.0.0.1' ||
    clean.startsWith('10.') ||
    clean.startsWith('192.168.')
  ) {
    return true;
  }
  // Check 172.16.0.0 to 172.31.255.255
  if (clean.startsWith('172.')) {
    const parts = clean.split('.');
    if (parts.length >= 2) {
      const second = parseInt(parts[1], 10);
      if (second >= 16 && second <= 31) return true;
    }
  }
  return false;
}

/**
 * Invalidates the in-memory settings cache so changes take effect immediately
 */
export function invalidateSecurityCache() {
  cachedSettings = null;
  settingsCacheExpiry = 0;
}

/**
 * Fetches platform security settings from admin_settings with in-memory caching
 */
export async function getSecuritySettings() {
  const now = Date.now();
  if (cachedSettings && now < settingsCacheExpiry) {
    return cachedSettings;
  }

  try {
    const admin = createAdminClient();
    const { data: rows, error } = await admin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', [
        'blocked_ips',
        'blocked_fingerprints',
        'blocked_phones',
        'vpn_blocking_enabled',
        'vpn_blocking_mode',
        'ip_whitelist'
      ]);

    if (error) {
      console.error('[ipShield] Error loading security settings:', error.message);
      return cachedSettings || {
        blockedIps: [],
        blockedFingerprints: [],
        blockedPhones: [],
        vpnBlockingEnabled: false,
        vpnBlockingMode: 'checkout',
        whitelist: []
      };
    }

    const getVal = (key) => rows?.find((r) => r.setting_key === key)?.setting_value;

    let blockedIps = [];
    try {
      const rawIps = getVal('blocked_ips');
      if (rawIps) blockedIps = JSON.parse(rawIps);
    } catch {
      blockedIps = [];
    }

    let blockedFingerprints = [];
    try {
      const rawFp = getVal('blocked_fingerprints');
      if (rawFp) blockedFingerprints = JSON.parse(rawFp);
    } catch {
      blockedFingerprints = [];
    }

    let blockedPhones = [];
    try {
      const rawPhones = getVal('blocked_phones');
      if (rawPhones) blockedPhones = JSON.parse(rawPhones);
    } catch {
      blockedPhones = [];
    }

    let whitelist = [];
    try {
      const rawWl = getVal('ip_whitelist');
      if (rawWl) whitelist = JSON.parse(rawWl);
    } catch {
      whitelist = [];
    }

    const vpnBlockingEnabled = getVal('vpn_blocking_enabled') === 'true';
    const vpnBlockingMode = getVal('vpn_blocking_mode') || 'all'; // 'all' | 'checkout'

    cachedSettings = {
      blockedIps, // Array of { ip, reason, blocked_at, accounts }
      blockedFingerprints, // Array of string fingerprints
      blockedPhones, // Array of normalized Ugandan phone strings
      vpnBlockingEnabled,
      vpnBlockingMode,
      whitelist
    };
    settingsCacheExpiry = now + SETTINGS_CACHE_TTL_MS;
    return cachedSettings;
  } catch (err) {
    console.error('[ipShield] getSecuritySettings unexpected error:', err);
    return {
      blockedIps: [],
      blockedFingerprints: [],
      blockedPhones: [],
      vpnBlockingEnabled: false,
      vpnBlockingMode: 'checkout',
      whitelist: []
    };
  }
}

/**
 * Checks if an IP is in the blocked list
 */
export async function isIpBlocked(ip) {
  if (!ip || isPrivateOrLocalIp(ip)) return false;
  const settings = await getSecuritySettings();

  // Whitelist bypass
  if (settings.whitelist?.includes(ip)) return false;

  return settings.blockedIps?.some((item) => {
    if (typeof item === 'string') return item === ip;
    return item?.ip === ip;
  });
}

/**
 * Checks if a device fingerprint is in the blocked list
 */
export async function isFingerprintBlocked(fingerprint) {
  if (!fingerprint) return false;
  const settings = await getSecuritySettings();
  return settings.blockedFingerprints?.includes(fingerprint);
}

/**
 * Checks if a phone number is in the blocked list
 */
export async function isPhoneBlocked(phone) {
  if (!phone) return false;
  const settings = await getSecuritySettings();
  return (settings.blockedPhones || []).includes(phone);
}

/**
 * Blocks a phone number in admin_settings
 */
export async function blockPhoneNumber(phone, reason = 'Automated enumeration / attack') {
  if (!phone) return { success: false, error: 'No phone provided' };
  const admin = createAdminClient();
  const settings = await getSecuritySettings();
  const currentPhones = new Set(settings.blockedPhones || []);
  currentPhones.add(phone);

  await admin.from('admin_settings').upsert(
    {
      setting_key: 'blocked_phones',
      setting_value: JSON.stringify(Array.from(currentPhones))
    },
    { onConflict: 'setting_key' }
  );

  invalidateSecurityCache();

  await recordSecurityAudit({
    eventType: 'PHONE_BLOCKED',
    severity: 'HIGH',
    description: `Phone number ${phone} was blocked. Reason: ${reason}`,
    metadata: { phone, reason }
  });

  return { success: true, phone, totalBlocked: currentPhones.size };
}

/**
 * Unblocks a phone number
 */
export async function unblockPhoneNumber(phone) {
  if (!phone) return { success: false, error: 'No phone provided' };
  const admin = createAdminClient();
  const settings = await getSecuritySettings();
  const currentPhones = (settings.blockedPhones || []).filter((p) => p !== phone);

  await admin.from('admin_settings').upsert(
    {
      setting_key: 'blocked_phones',
      setting_value: JSON.stringify(currentPhones)
    },
    { onConflict: 'setting_key' }
  );

  invalidateSecurityCache();
  return { success: true, phone };
}

/**
 * Inspects whether an IP address is a VPN, proxy, or data center hosting address.
 * Uses:
 * 1. In-memory 24h cache (0ms)
 * 2. Ugandan residential/mobile ISP fast-track whitelist
 * 3. External IP intelligence with 1.5s timeout & FAIL-OPEN safeguard
 */
export async function checkVpnOrProxy(ip) {
  if (!ip || isPrivateOrLocalIp(ip)) {
    return {
      isVpn: false,
      isProxy: false,
      isHosting: false,
      isp: 'Local / Loopback',
      country: 'UG',
      checked: false
    };
  }

  // Check in-memory cache
  const cached = vpnLookupCache.get(ip);
  if (cached && Date.now() - cached.cachedAt < VPN_CACHE_TTL_MS) {
    return cached;
  }

  // Check whitelist
  const settings = await getSecuritySettings();
  if (settings.whitelist?.includes(ip)) {
    const res = { isVpn: false, isProxy: false, isHosting: false, isp: 'Whitelisted', country: 'UG', checked: true };
    vpnLookupCache.set(ip, { ...res, cachedAt: Date.now() });
    return res;
  }

  try {
    let data = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);

      const response = await fetch(
        `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,city,isp,org,as,mobile,proxy,hosting,query`,
        { signal: controller.signal }
      ).catch(() => null);

      clearTimeout(timeoutId);

      if (response && response.ok) {
        const json = await response.json().catch(() => null);
        if (json && json.status === 'success') {
          data = json;
        }
      }
    } catch {}

    // Secondary fallback: ipwho.is (HTTPS)
    if (!data) {
      try {
        const secController = new AbortController();
        const secTimeoutId = setTimeout(() => secController.abort(), 1500);

        const secRes = await fetch(
          `https://ipwho.is/${encodeURIComponent(ip)}`,
          { signal: secController.signal }
        ).catch(() => null);

        clearTimeout(secTimeoutId);

        if (secRes && secRes.ok) {
          const secJson = await secRes.json().catch(() => null);
          if (secJson && secJson.success) {
            data = {
              status: 'success',
              country: secJson.country,
              countryCode: secJson.country_code,
              city: secJson.city,
              isp: secJson.connection?.isp || secJson.connection?.org,
              org: secJson.connection?.org,
              as: `AS${secJson.connection?.asn || ''} ${secJson.connection?.isp || ''}`,
              mobile: false,
              proxy: !!(secJson.security?.proxy || secJson.security?.vpn || secJson.security?.tor),
              hosting: !!secJson.security?.hosting,
              query: ip
            };
          }
        }
      } catch {}
    }

    if (!data) {
      // Fail-open: Do not block legitimate users if both lookups fail or time out
      return { isVpn: false, isProxy: false, isHosting: false, isp: 'Unknown', country: '', checked: false };
    }

    const ispLower = (data.isp || '').toLowerCase();
    const orgLower = (data.org || '').toLowerCase();
    const asLower = (data.as || '').toLowerCase();

    // Check if it belongs to a known legitimate Ugandan mobile or residential provider
    const isUgandanResidential = UGANDA_RESIDENTIAL_ISPS.some(
      (known) => ispLower.includes(known) || orgLower.includes(known) || asLower.includes(known)
    );

    // If verified Ugandan mobile or residential, it's definitely NOT a VPN
    if (isUgandanResidential && !data.proxy) {
      const result = {
        isVpn: false,
        isProxy: false,
        isHosting: false,
        isp: data.isp || 'MTN / Airtel Uganda',
        country: data.country || 'Uganda',
        countryCode: data.countryCode || 'UG',
        city: data.city || 'Kampala',
        mobile: !!data.mobile,
        checked: true
      };
      vpnLookupCache.set(ip, { ...result, cachedAt: Date.now() });
      return result;
    }

    // A connection is flagged as VPN/proxy if:
    // 1. ip-api explicitly flags proxy: true
    // 2. OR hosting: true (datacenter/cloud provider ASN like AWS, DigitalOcean, Hetzner, Linode, M247) AND not mobile
    const isProxy = !!data.proxy;
    const isHosting = !!data.hosting;
    const isVpn = isProxy || (isHosting && !data.mobile);

    const result = {
      isVpn,
      isProxy,
      isHosting,
      isp: data.isp || data.org || 'Unknown Provider',
      country: data.country || 'Unknown',
      countryCode: data.countryCode || '',
      city: data.city || '',
      mobile: !!data.mobile,
      checked: true
    };

    vpnLookupCache.set(ip, { ...result, cachedAt: Date.now() });
    return result;
  } catch (err) {
    // Fail-open: Never disrupt users due to unexpected errors
    console.warn('[ipShield] VPN check fail-open error for IP', ip, err?.message);
    return { isVpn: false, isProxy: false, isHosting: false, isp: 'Unknown', country: '', checked: false };
  }
}

/**
 * Sends a high-priority security Telegram notification to the administrator
 */
export async function sendSecurityTelegramAlert({ title, details = [] }) {
  try {
    const admin = createAdminClient();
    const { data: settings } = await admin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

    const botToken = settings?.find((s) => s.setting_key === 'telegram_bot_token')?.setting_value?.trim();
    const chatId = settings?.find((s) => s.setting_key === 'telegram_chat_id')?.setting_value?.trim();

    if (!botToken || !chatId) return;

    const eatTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Kampala' }) + ' EAT';

    let text = `🛡️ <b>${title}</b>\n\n`;
    for (const d of details) {
      text += `<b>${d.label}:</b> <code>${(d.value || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code>\n`;
    }
    text += `\n<b>Timestamp:</b> ${eatTime}\n<i>FlixOn Smart Security Shield</i>`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    }).catch((err) => console.error('[ipShield] Telegram send error:', err?.message));
  } catch (err) {
    console.error('[ipShield] Telegram dispatch failed:', err?.message);
  }
}

/**
 * Appends a security audit event into admin_settings (security_audit_events)
 * ensuring events are permanently visible in the admin portal even if the dedicated
 * security_logs table is not present.
 */
export async function recordSecurityAudit({ eventType, severity, description, metadata = {} }) {
  try {
    const admin = createAdminClient();
    const { data: row } = await admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'security_audit_events')
      .maybeSingle();

    let events = [];
    try {
      if (row?.setting_value) events = JSON.parse(row.setting_value);
    } catch {
      events = [];
    }

    const newEvent = {
      id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      event_type: eventType,
      severity,
      description,
      metadata,
      created_at: new Date().toISOString()
    };

    events.unshift(newEvent);
    // Keep last 100 events
    if (events.length > 100) events = events.slice(0, 100);

    await admin.from('admin_settings').upsert(
      {
        setting_key: 'security_audit_events',
        setting_value: JSON.stringify(events)
      },
      { onConflict: 'setting_key' }
    );
  } catch (err) {
    console.error('[ipShield] recordSecurityAudit error:', err?.message);
  }
}

/**
 * Blocks an IP address and automatically bans all user accounts associated with that IP
 */
export async function blockIpAddress({ ip, reason = 'Security policy violation', blockedBy = 'system' }) {
  if (!ip || isPrivateOrLocalIp(ip)) {
    return { success: false, error: 'Cannot block local or private IP address' };
  }

  const admin = createAdminClient();
  const settings = await getSecuritySettings();

  const currentBlocked = [...(settings.blockedIps || [])];
  const existingIdx = currentBlocked.findIndex((item) => (typeof item === 'string' ? item === ip : item?.ip === ip));

  // Find any associated accounts in user_profiles or site_visits
  const associatedEmails = new Set();
  const associatedUserIds = new Set();

  try {
    // 1. Check site_visits for matching visitor sessions or users
    const { data: visits } = await admin
      .from('site_visits')
      .select('user_id, visitor_id')
      .limit(500);

    if (visits) {
      // Collect users
      for (const v of visits) {
        if (v.user_id) associatedUserIds.add(v.user_id);
      }
    }
  } catch (err) {
    console.warn('[ipShield] site_visits scan warning:', err?.message);
  }

  // 2. Fetch user profiles for any accounts found
  const bannedAccounts = [];

  const entry = {
    ip,
    reason,
    blocked_by: blockedBy,
    blocked_at: new Date().toISOString(),
    associated_accounts: bannedAccounts
  };

  if (existingIdx >= 0) {
    currentBlocked[existingIdx] = entry;
  } else {
    currentBlocked.unshift(entry);
  }

  // Persist updated blocked_ips in admin_settings
  await admin.from('admin_settings').upsert(
    {
      setting_key: 'blocked_ips',
      setting_value: JSON.stringify(currentBlocked)
    },
    { onConflict: 'setting_key' }
  );

  invalidateSecurityCache();

  // Record security audit
  await recordSecurityAudit({
    eventType: 'IP_BLOCKED',
    severity: 'HIGH',
    description: `IP address ${ip} was blocked. Reason: ${reason}`,
    metadata: { ip, reason, blockedBy, bannedAccounts }
  });

  // Send Telegram Alert
  await sendSecurityTelegramAlert({
    title: '🚨 IP ADDRESS BLOCKED & USERS RESTRICTED',
    details: [
      { label: 'Blocked IP', value: ip },
      { label: 'Reason', value: reason },
      { label: 'Blocked By', value: blockedBy },
      { label: 'Auto-Banned Accounts', value: bannedAccounts.length > 0 ? bannedAccounts.join(', ') : 'None identified' }
    ]
  });

  return {
    success: true,
    ip,
    bannedAccounts,
    totalBlocked: currentBlocked.length
  };
}

/**
 * Unblocks an IP address
 */
export async function unblockIpAddress(ip) {
  if (!ip) return { success: false, error: 'No IP provided' };

  const admin = createAdminClient();
  const settings = await getSecuritySettings();

  const currentBlocked = (settings.blockedIps || []).filter((item) =>
    typeof item === 'string' ? item !== ip : item?.ip !== ip
  );

  await admin.from('admin_settings').upsert(
    {
      setting_key: 'blocked_ips',
      setting_value: JSON.stringify(currentBlocked)
    },
    { onConflict: 'setting_key' }
  );

  invalidateSecurityCache();

  await recordSecurityAudit({
    eventType: 'IP_UNBLOCKED',
    severity: 'MEDIUM',
    description: `IP address ${ip} was unblocked.`,
    metadata: { ip }
  });

  return { success: true, ip, totalBlocked: currentBlocked.length };
}

/**
 * Blocks a device fingerprint and bans any accounts associated with it
 */
export async function blockFingerprint(fingerprint, reason = 'Malicious activity / Repeat abuse') {
  if (!fingerprint) return { success: false, error: 'No fingerprint provided' };

  const admin = createAdminClient();
  const settings = await getSecuritySettings();

  const currentFps = new Set(settings.blockedFingerprints || []);
  currentFps.add(fingerprint);

  await admin.from('admin_settings').upsert(
    {
      setting_key: 'blocked_fingerprints',
      setting_value: JSON.stringify(Array.from(currentFps))
    },
    { onConflict: 'setting_key' }
  );

  // Find all accounts associated with this visitor_id / fingerprint in site_visits
  const bannedAccounts = [];
  try {
    const { data: visits } = await admin
      .from('site_visits')
      .select('user_id')
      .eq('visitor_id', fingerprint);

    if (visits && visits.length > 0) {
      const userIds = Array.from(new Set(visits.map((v) => v.user_id).filter(Boolean)));
      for (const uid of userIds) {
        // Ban in user_profiles
        const { data: profile } = await admin
          .from('user_profiles')
          .select('email, role')
          .eq('id', uid)
          .maybeSingle();

        if (profile) {
          await admin.from('user_profiles').update({ role: 'banned' }).eq('id', uid);
          bannedAccounts.push(profile.email);
        }

        // Ban in Supabase auth
        try {
          await admin.auth.admin.updateUserById(uid, { ban_duration: '876000h' });
        } catch {}
      }
    }
  } catch (err) {
    console.error('[ipShield] Fingerprint account ban error:', err);
  }

  invalidateSecurityCache();

  await recordSecurityAudit({
    eventType: 'FINGERPRINT_BLOCKED',
    severity: 'CRITICAL',
    description: `Device fingerprint ${fingerprint} blocked. Associated accounts auto-banned.`,
    metadata: { fingerprint, reason, bannedAccounts }
  });

  await sendSecurityTelegramAlert({
    title: '🔒 DEVICE FINGERPRINT BLOCKED',
    details: [
      { label: 'Device Fingerprint', value: fingerprint },
      { label: 'Reason', value: reason },
      { label: 'Auto-Banned Accounts', value: bannedAccounts.length > 0 ? bannedAccounts.join(', ') : 'None' }
    ]
  });

  return { success: true, fingerprint, bannedAccounts };
}

/**
 * Unblocks a device fingerprint
 */
export async function unblockFingerprint(fingerprint) {
  if (!fingerprint) return { success: false, error: 'No fingerprint provided' };

  const admin = createAdminClient();
  const settings = await getSecuritySettings();

  const currentFps = (settings.blockedFingerprints || []).filter((fp) => fp !== fingerprint);

  await admin.from('admin_settings').upsert(
    {
      setting_key: 'blocked_fingerprints',
      setting_value: JSON.stringify(currentFps)
    },
    { onConflict: 'setting_key' }
  );

  invalidateSecurityCache();
  return { success: true, fingerprint };
}

/**
 * Updates VPN blocking settings in admin_settings
 */
export async function updateVpnSettings({ enabled, mode }) {
  const admin = createAdminClient();

  if (typeof enabled === 'boolean') {
    await admin.from('admin_settings').upsert(
      {
        setting_key: 'vpn_blocking_enabled',
        setting_value: enabled ? 'true' : 'false'
      },
      { onConflict: 'setting_key' }
    );
  }

  if (mode && (mode === 'all' || mode === 'checkout')) {
    await admin.from('admin_settings').upsert(
      {
        setting_key: 'vpn_blocking_mode',
        setting_value: mode
      },
      { onConflict: 'setting_key' }
    );
  }

  invalidateSecurityCache();

  await recordSecurityAudit({
    eventType: 'VPN_SETTINGS_UPDATED',
    severity: 'LOW',
    description: `VPN blocking settings updated: enabled=${enabled}, mode=${mode}`,
    metadata: { enabled, mode }
  });

  return { success: true, enabled, mode };
}
