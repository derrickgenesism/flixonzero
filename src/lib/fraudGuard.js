import { createAdminClient } from '../utils/supabase/admin.js';
import {
  isIpBlocked,
  isFingerprintBlocked,
  isPhoneBlocked,
  blockFingerprint,
  blockPhoneNumber,
  checkVpnOrProxy,
  getSecuritySettings,
  recordSecurityAudit
} from './ipShield.js';

// In-memory sliding security cache
// Tracks rapid IP lockouts, Phone lockouts, rate cooldowns, and Telegram alert throttling
const ipLockouts = new Map(); // ip -> { blockedUntil: number, count: number }
const phoneLockouts = new Map(); // normalizedPhone -> { blockedUntil: number, count: number }
const recentRequestTimestamps = new Map(); // key (userId | ip | phone) -> timestamp of last request
const telegramCooldowns = new Map(); // key -> timestamp of last alert

// Security thresholds
const MAX_FAILED_ATTEMPTS = 5; // 5 uncompleted / failed attempts in 2 hours triggers 2h lockout
const PHONE_MAX_FAILURES = 3; // 3 failed attempts on the same phone across ANY account triggers phone lockout
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const AUTO_FREEZE_THRESHOLD = 10; // Auto-freeze account if >= 10 failed attempts
const TELEGRAM_ALERT_COOLDOWN_MS = 20 * 60 * 1000; // Max 1 Telegram alert per offender every 20m
const MIN_REQUEST_INTERVAL_MS = 12 * 1000; // 12 seconds cooldown between checkout attempts

// Phone enumeration & brute-force tracking per actor (userId | fingerprint | ip)
const phoneHistoryByActor = new Map();
const PHONE_HISTORY_WINDOW_MS = 20 * 60 * 1000; // 20 minutes
const MAX_DISTINCT_PHONES_ALLOWED = 2; // Normal human beings have 1 or 2 mobile money SIMs

const DISPOSABLE_EMAIL_DOMAINS = [
  'effem.com', 'mailinator.com', 'tempmail.com', '10minutemail.com',
  'guerrillamail.com', 'throwawaymail.com', 'yopmail.com', 'sharklasers.com',
  'getairmail.com', 'mohmal.com', 'dispostable.com', 'trashmail.com'
];

/**
 * Checks whether an email address uses a known disposable/burner domain
 */
export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase().trim();
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
}

/**
 * Checks for rapid phone switching or sequential number enumeration (e.g. 8054 -> 8055)
 */
export function checkPhoneVelocity(actorKey, normPhone) {
  if (!normPhone) return { attackDetected: false };
  const now = Date.now();
  const history = phoneHistoryByActor.get(actorKey) || [];
  const activeHistory = history.filter((h) => now - h.timestamp < PHONE_HISTORY_WINDOW_MS);

  // 1. Sequential enumeration detection (last digits incremented/decremented by 1-3)
  if (normPhone.length === 12) {
    for (const prev of activeHistory) {
      if (prev.phone && prev.phone.length === 12 && prev.phone !== normPhone) {
        // Compare same prefix (first 8 digits, e.g. 25676454)
        if (prev.phone.substring(0, 8) === normPhone.substring(0, 8)) {
          const prevSuffix = parseInt(prev.phone.substring(8), 10);
          const currSuffix = parseInt(normPhone.substring(8), 10);
          const diff = Math.abs(currSuffix - prevSuffix);
          if (diff >= 1 && diff <= 3) {
            return {
              attackDetected: true,
              reason: 'sequential_phone_scan',
              previousPhone: prev.phone,
              currentPhone: normPhone,
              details: `Sequential phone scan detected: ${prev.phone} -> ${normPhone} (diff: ${diff})`
            };
          }
        }
      }
    }
  }

  // 2. Excessive phone cycling detection (> 2 distinct phones in 20 minutes)
  const distinctPhones = new Set(activeHistory.map((h) => h.phone));
  distinctPhones.add(normPhone);

  if (distinctPhones.size > MAX_DISTINCT_PHONES_ALLOWED) {
    return {
      attackDetected: true,
      reason: 'excessive_phone_cycling',
      distinctCount: distinctPhones.size,
      phoneList: Array.from(distinctPhones),
      details: `Actor attempted ${distinctPhones.size} distinct phone numbers in 20m: ${Array.from(distinctPhones).join(', ')}`
    };
  }

  // Record valid attempt into history
  activeHistory.push({ phone: normPhone, timestamp: now });
  phoneHistoryByActor.set(actorKey, activeHistory);

  return { attackDetected: false };
}

/**
 * Normalizes a phone number into canonical Ugandan format: 256XXXXXXXXX (12 digits)
 */
export function normalizeUgandaPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('256') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return '256' + digits.substring(1);
  }
  if (digits.length === 9 && digits.startsWith('7')) {
    return '256' + digits;
  }
  return digits;
}

/**
 * Validates whether a phone number is a valid Ugandan Mobile Money line (MTN or Airtel)
 * Ugandan prefixes: 70, 74, 75 (Airtel) | 76, 77, 78 (MTN)
 */
export function isValidUgandaPhone(normalizedPhone) {
  if (!normalizedPhone || normalizedPhone.length !== 12) return false;
  if (!normalizedPhone.startsWith('2567')) return false;
  const prefix = normalizedPhone.substring(3, 5);
  // Valid active mobile money prefixes in Uganda
  const validPrefixes = ['70', '71', '72', '74', '75', '76', '77', '78', '79'];
  return validPrefixes.includes(prefix);
}

/**
 * Safely extracts client IP address from Next.js headers or explicit request
 */
export async function getClientIp(reqHeaders = null) {
  let h = reqHeaders;
  if (!h) {
    try {
      const { headers } = await import('next/headers');
      h = await headers();
    } catch {
      return '127.0.0.1';
    }
  }

  const forwarded = h.get('x-forwarded-for') || h.get('x-real-ip') || h.get('cf-connecting-ip');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    // Strip port if present (e.g. 1.2.3.4:5678 or [::1]:80)
    return first.replace(/:[0-9]+$/, '');
  }
  return '127.0.0.1';
}

/**
 * Generates an opaque, authoritative security lockout notice.
 * Never discloses internal attempt counts or thresholds to prevent reverse engineering.
 */
function getSecurityNoticeMessage({ clientIp, phone = '' }) {
  const phoneNote = phone ? ` and payment phone number (${phone})` : ' and payment details';
  return `Security Alert: Unusual payment activity detected. For security, your device IP address (${clientIp})${phoneNote} have been recorded and flagged for investigation. Transactions are temporarily locked for the next 2 hours while administrators review this activity. If you believe this is an error, please click below to contact Support immediately.`;
}

function getAccountFrozenMessage({ clientIp }) {
  return `Account Suspended: This account has been locked due to suspicious or unauthorized activity. Your device IP (${clientIp}) has been logged and forwarded to system administration. Please click below to contact Support.`;
}

/**
 * Sends an urgent security alert to the admin's Telegram support group.
 * Non-blocking, fails gracefully without crashing payment requests.
 */
export async function sendFraudTelegramAlert({
  userId,
  userEmail,
  username,
  clientIp,
  phoneNumber,
  network,
  failedCount,
  actionTaken,
  reason
}) {
  try {
    const normPhone = normalizeUgandaPhone(phoneNumber);
    const cooldownKey = `${userId || 'anon'}_${clientIp}_${normPhone}`;
    const lastAlert = telegramCooldowns.get(cooldownKey) || 0;
    if (Date.now() - lastAlert < TELEGRAM_ALERT_COOLDOWN_MS) {
      // Cooldown active, skip to prevent Telegram bot flooding
      return;
    }
    telegramCooldowns.set(cooldownKey, Date.now());

    const admin = createAdminClient();
    const { data: settings } = await admin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

    const botToken = settings?.find(s => s.setting_key === 'telegram_bot_token')?.setting_value?.trim();
    const chatId = settings?.find(s => s.setting_key === 'telegram_chat_id')?.setting_value?.trim();

    if (!botToken || !chatId) {
      console.warn('[FraudGuard] Telegram bot token or chat ID not configured in admin_settings');
      return;
    }

    const safeName = (username || 'Unknown').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeEmail = (userEmail || 'Unknown').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeIp = (clientIp || 'Unknown').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safePhone = (normPhone || 'Not provided').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeNet = (network || 'Unknown').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const eatTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Kampala' }) + ' EAT';

    const text =
      `🚨 <b>PAYMENT ATTACK / ABUSE INTERCEPTED</b> 🚨\n\n` +
      `<b>Account:</b> ${safeName} (<code>${safeEmail}</code>)\n` +
      `<b>User ID:</b> <code>${userId || 'N/A'}</code>\n` +
      `<b>Client IP:</b> <code>${safeIp}</code>\n` +
      `<b>Phone Number:</b> <code>${safePhone}</code> (${safeNet})\n` +
      `<b>Failed / Incomplete Attempts (2h):</b> <b>${failedCount}</b>\n` +
      `<b>Reason:</b> ${reason || 'Excessive unverified transaction attempts'}\n` +
      `<b>Action Taken:</b> 🔒 <b>${actionTaken}</b>\n` +
      `<b>Timestamp:</b> ${eatTime}\n\n` +
      `<i>Checkout has been locked. Check Admin Dashboard → Users to inspect or manage this user.</i>`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    }).catch(err => console.error('[FraudGuard] Telegram sendMessage fetch error:', err));
  } catch (err) {
    console.error('[FraudGuard] Telegram alert error:', err?.message || err);
  }
}

/**
 * Checks whether an incoming transaction is safe to proceed or should be blocked.
 * 
 * Rules:
 * 1. Validates Ugandan phone format.
 * 2. Checks Account Frozen status.
 * 3. Enforces 12-second anti-automation cooldown per user/device.
 * 4. Checks In-memory IP Lockout (2 hours).
 * 5. Checks In-memory Phone Number Lockout (2 hours).
 * 6. Checks Database Failed Attempts in the last 2 hours.
 *    - Threshold: 5 uncompleted attempts.
 *    - Lockout: 2 hours for IP & Phone.
 *    - Auto-freeze: >= 10 attempts.
 *    - Sends Instant Telegram Alert.
 * 
 * @returns {Promise<{ allowed: boolean, blocked: boolean, reason?: string, ip: string, message?: string }>}
 */
export async function checkPaymentSecurity({
  userId,
  userEmail,
  username = '',
  phoneNumber = '',
  network = '',
  reqHeaders = null,
  fingerprint = ''
}) {
  const clientIp = await getClientIp(reqHeaders);
  const normPhone = normalizeUgandaPhone(phoneNumber);
  const admin = createAdminClient();

  // 0. Hard Block: Check Blocked IP Address
  const ipBlocked = await isIpBlocked(clientIp);
  if (ipBlocked) {
    if (userEmail) {
      await admin.from('user_profiles').update({ role: 'banned' }).eq('email', userEmail);
      try {
        if (userId) await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
      } catch {}
    }
    await sendFraudTelegramAlert({
      userId,
      userEmail,
      username,
      clientIp,
      phoneNumber: normPhone,
      network,
      failedCount: 1,
      actionTaken: 'BLOCKED & USER AUTO-BANNED',
      reason: `Blocked IP address (${clientIp}) attempted checkout.`
    });
    return {
      allowed: false,
      blocked: true,
      reason: 'ip_blocked',
      ip: clientIp,
      message: 'Access Restricted: Your network or IP address has been restricted due to violations of platform guidelines.'
    };
  }

  // 0.1 Hard Block: Check Blocked Device Fingerprint
  if (fingerprint) {
    const fpBlocked = await isFingerprintBlocked(fingerprint);
    if (fpBlocked) {
      if (userEmail) {
        await admin.from('user_profiles').update({ role: 'banned' }).eq('email', userEmail);
        try {
          if (userId) await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
        } catch {}
      }
      await sendFraudTelegramAlert({
        userId,
        userEmail,
        username,
        clientIp,
        phoneNumber: normPhone,
        network,
        failedCount: 1,
        actionTaken: 'FINGERPRINT BLOCKED & AUTO-BANNED',
        reason: `Blocked device fingerprint (${fingerprint}) attempted checkout with account ${userEmail}.`
      });
      return {
        allowed: false,
        blocked: true,
        reason: 'device_blocked',
        ip: clientIp,
        message: 'Account Suspended: This device has been restricted due to violations of platform guidelines.'
      };
    }
  }

  // 0.2 Hard Block: Check Blocked Phone Number
  if (normPhone) {
    const phoneBlocked = await isPhoneBlocked(normPhone);
    if (phoneBlocked) {
      if (userEmail) {
        await admin.from('user_profiles').update({ role: 'banned' }).eq('email', userEmail);
        try {
          if (userId) await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
        } catch {}
      }
      if (fingerprint) {
        await blockFingerprint(fingerprint, `Associated with blocked phone number ${normPhone}`);
      }
      await sendFraudTelegramAlert({
        userId,
        userEmail,
        username,
        clientIp,
        phoneNumber: normPhone,
        network,
        failedCount: 1,
        actionTaken: 'PHONE BLOCKED & USER AUTO-BANNED',
        reason: `Blocked phone number (${normPhone}) attempted checkout.`
      });
      return {
        allowed: false,
        blocked: true,
        reason: 'blocked_phone',
        ip: clientIp,
        message: 'Payment Restricted: The provided mobile money number is restricted due to previous violations.'
      };
    }
  }

  // 0.3 Disposable / Burner Email Detection
  if (userEmail && isDisposableEmail(userEmail)) {
    await admin.from('user_profiles').update({ role: 'banned' }).eq('email', userEmail);
    try {
      if (userId) await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    } catch {}
    if (fingerprint) {
      await blockFingerprint(fingerprint, `Disposable burner email: ${userEmail}`);
    }
    await sendFraudTelegramAlert({
      userId,
      userEmail,
      username,
      clientIp,
      phoneNumber: normPhone,
      network,
      failedCount: 1,
      actionTaken: 'USER AUTO-BANNED & FINGERPRINT BLOCKED',
      reason: `User attempted checkout with disposable email domain (${userEmail}).`
    });
    return {
      allowed: false,
      blocked: true,
      reason: 'disposable_email',
      ip: clientIp,
      message: 'Account Suspended: Disposable or temporary email addresses are not permitted on this platform.'
    };
  }

  // 0.4 Phone Enumeration & Cycling Attack Detection (Pre-Payment Intercept)
  if (normPhone) {
    const actorKey = `${userId || 'anon'}_${fingerprint || ''}_${clientIp}`;
    const velocityResult = checkPhoneVelocity(actorKey, normPhone);
    if (velocityResult.attackDetected) {
      // Auto-ban user account
      if (userEmail) {
        await admin.from('user_profiles').update({ role: 'banned' }).eq('email', userEmail);
        try {
          if (userId) await admin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
        } catch {}
      }
      // Block device fingerprint
      if (fingerprint) {
        await blockFingerprint(fingerprint, velocityResult.details);
      }
      // Block phones involved
      await blockPhoneNumber(normPhone, velocityResult.details);
      if (velocityResult.previousPhone) {
        await blockPhoneNumber(velocityResult.previousPhone, velocityResult.details);
      }
      // Lock IP
      ipLockouts.set(clientIp, {
        blockedUntil: Date.now() + TWO_HOURS_MS,
        count: 99
      });

      // Send high-priority alert
      await sendFraudTelegramAlert({
        userId,
        userEmail,
        username,
        clientIp,
        phoneNumber: normPhone,
        network,
        failedCount: velocityResult.distinctCount || 2,
        actionTaken: 'ATTACK INTERCEPTED: USER BANNED, DEVICE & PHONES BLOCKED',
        reason: velocityResult.details
      });

      return {
        allowed: false,
        blocked: true,
        reason: velocityResult.reason,
        ip: clientIp,
        message: 'Security Alert: Automated payment scanning activity detected. Your access has been permanently restricted.'
      };
    }
  }

  // 0.5 VPN & Proxy Check
  const secSettings = await getSecuritySettings();
  if (secSettings.vpnBlockingEnabled) {
    const vpnInfo = await checkVpnOrProxy(clientIp);
    if (vpnInfo.isVpn) {
      return {
        allowed: false,
        blocked: true,
        isVpn: true,
        reason: 'vpn_detected',
        ip: clientIp,
        message: '🛡️ VPN / Proxy Detected: Payment networks (MTN & Airtel) require a direct connection. Please turn off your VPN or proxy and try again.'
      };
    }
  }

  // 1. Strict Ugandan Phone Validation (if phone provided)
  if (phoneNumber && !isValidUgandaPhone(normPhone)) {
    return {
      allowed: false,
      blocked: false,
      reason: 'invalid_phone',
      ip: clientIp,
      message: 'Please enter a valid Ugandan mobile money number (e.g. 077... or 075...).'
    };
  }

  // 2. Check if account is frozen
  if (userEmail) {
    const { data: profile } = await admin
      .from('user_profiles')
      .select('role, id, username')
      .eq('email', userEmail)
      .maybeSingle();

    if (profile?.role === 'frozen' || profile?.role === 'banned') {
      return {
        allowed: false,
        blocked: true,
        reason: 'account_frozen',
        ip: clientIp,
        message: getAccountFrozenMessage({ clientIp })
      };
    }
  }

  // 3. Anti-Flooding Cooldown (Prevent rapid-fire script hammering)
  const rateKey = `${userId || 'anon'}_${clientIp}_${normPhone}`;
  const lastRequestTime = recentRequestTimestamps.get(rateKey) || 0;
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL_MS) {
    return {
      allowed: false,
      blocked: false,
      reason: 'rate_cooldown',
      ip: clientIp,
      message: 'Please wait a moment. Your payment request is already in progress. Check your phone for the PIN prompt.'
    };
  }
  recentRequestTimestamps.set(rateKey, now);

  // 4. Check In-Memory Phone Number Lockout
  if (normPhone) {
    const phoneLock = phoneLockouts.get(normPhone);
    if (phoneLock && phoneLock.blockedUntil > now) {
      return {
        allowed: false,
        blocked: true,
        reason: 'phone_locked',
        ip: clientIp,
        message: getSecurityNoticeMessage({ clientIp, phone: normPhone })
      };
    }
  }

  // 5. Check In-Memory IP Lockout
  const ipLock = ipLockouts.get(clientIp);
  if (ipLock && ipLock.blockedUntil > now) {
    return {
      allowed: false,
      blocked: true,
      reason: 'ip_rate_limited',
      ip: clientIp,
      message: getSecurityNoticeMessage({ clientIp, phone: normPhone })
    };
  }

  // 6. Database verification of failed attempts in the last 2 hours
  if (userId) {
    const twoHoursAgo = new Date(Date.now() - TWO_HOURS_MS).toISOString();

    const { data: recentTxs, error } = await admin
      .from('transactions')
      .select('status, created_at')
      .eq('user_id', userId)
      .gte('created_at', twoHoursAgo)
      .order('created_at', { ascending: false });

    if (!error && recentTxs) {
      let failedOrPending = 0;
      let hasSuccessful = false;

      for (const tx of recentTxs) {
        if (tx.status === 'successful') {
          hasSuccessful = true;
          break; // Stop counting: legitimate customer who completed a transaction
        } else if (tx.status === 'failed' || tx.status === 'pending') {
          failedOrPending++;
        }
      }

      // Check if threshold reached
      if (!hasSuccessful && failedOrPending >= MAX_FAILED_ATTEMPTS) {
        // Lock IP for 2 hours
        ipLockouts.set(clientIp, {
          blockedUntil: Date.now() + TWO_HOURS_MS,
          count: failedOrPending
        });

        // Also lock this phone number for 2 hours if provided
        if (normPhone) {
          phoneLockouts.set(normPhone, {
            blockedUntil: Date.now() + TWO_HOURS_MS,
            count: failedOrPending
          });
        }

        const shouldAutoFreeze = failedOrPending >= AUTO_FREEZE_THRESHOLD;
        let actionTaken = 'Blocked for 2 Hours (IP & Phone)';

        if (shouldAutoFreeze && userEmail) {
          actionTaken = 'Blocked 2h & ACCOUNT AUTO-FROZEN';
          await admin
            .from('user_profiles')
            .update({ role: 'frozen' })
            .eq('email', userEmail);
        }

        // Send Telegram alert to admin
        await sendFraudTelegramAlert({
          userId,
          userEmail,
          username,
          clientIp,
          phoneNumber: normPhone,
          network,
          failedCount: failedOrPending,
          actionTaken,
          reason: `Detected ${failedOrPending} uncompleted payment attempts within 2 hours.`
        });

        return {
          allowed: false,
          blocked: true,
          reason: 'too_many_failures',
          ip: clientIp,
          failedCount: failedOrPending,
          message: getSecurityNoticeMessage({ clientIp, phone: normPhone })
        };
      }
    }
  }

  return {
    allowed: true,
    blocked: false,
    ip: clientIp
  };
}

/**
 * Records an immediate failed transaction attempt in memory to stop rapid script loops.
 */
export function recordImmediateFailedAttempt(clientIp, phoneNumber = '') {
  const now = Date.now();
  if (clientIp) {
    const current = ipLockouts.get(clientIp) || { count: 0, blockedUntil: 0 };
    current.count = (current.count || 0) + 1;
    if (current.count >= MAX_FAILED_ATTEMPTS) {
      current.blockedUntil = now + TWO_HOURS_MS;
    }
    ipLockouts.set(clientIp, current);
  }

  const norm = normalizeUgandaPhone(phoneNumber);
  if (norm) {
    const curP = phoneLockouts.get(norm) || { count: 0, blockedUntil: 0 };
    curP.count = (curP.count || 0) + 1;
    if (curP.count >= PHONE_MAX_FAILURES) {
      curP.blockedUntil = now + TWO_HOURS_MS;
    }
    phoneLockouts.set(norm, curP);
  }
}
