import { createAdminClient } from '../utils/supabase/admin.js';

// In-memory sliding security cache
// Tracks rapid IP lockouts and prevents Telegram alert spamming
const ipLockouts = new Map(); // ip -> { blockedUntil: number, count: number }
const telegramCooldowns = new Map(); // key (userId or IP) -> timestamp of last alert

// Security thresholds
const MAX_FAILED_ATTEMPTS = 5; // 5 uncompleted / failed attempts in 2 hours
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const AUTO_FREEZE_THRESHOLD = 10; // Auto-freeze account if >= 10 failed attempts
const TELEGRAM_ALERT_COOLDOWN_MS = 30 * 60 * 1000; // Max 1 Telegram alert per offender every 30m

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
 * Sends an urgent security alert to the admin's Telegram support group.
 * Non-blocking, fails gracefully without crashing payment requests.
 */
export async function sendFraudTelegramAlert({
  userId,
  userEmail,
  username,
  clientIp,
  failedCount,
  actionTaken,
  reason
}) {
  try {
    const cooldownKey = `${userId || 'anon'}_${clientIp}`;
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
    const eatTime = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Kampala' }) + ' EAT';

    const text =
      `🚨 <b>PAYMENT ATTACK / ABUSE DETECTED</b> 🚨\n\n` +
      `<b>Account:</b> ${safeName} (<code>${safeEmail}</code>)\n` +
      `<b>User ID:</b> <code>${userId || 'N/A'}</code>\n` +
      `<b>Client IP:</b> <code>${safeIp}</code>\n` +
      `<b>Failed / Incomplete Attempts (2h):</b> <b>${failedCount}</b>\n` +
      `<b>Reason:</b> ${reason || 'Excessive failed transactions'}\n` +
      `<b>Action Taken:</b> 🔒 <b>${actionTaken}</b>\n` +
      `<b>Time:</b> ${eatTime}\n\n` +
      `<i>Checkout access locked for this IP/account. View in Admin Dashboard → Users</i>`;

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
 * 1. If user account is FROZEN/SUSPENDED, block immediately.
 * 2. If client IP is locked out in memory, block immediately for 2 hours.
 * 3. If user has >= 5 failed/pending attempts in last 2 hours and 0 successful payments:
 *    - Block payment.
 *    - Lock IP for 2 hours.
 *    - If attempts >= 10, automatically freeze account (role = 'frozen').
 *    - Send instant Telegram alert to admin.
 * 
 * @returns {Promise<{ allowed: boolean, blocked: boolean, reason?: string, ip: string, message?: string }>}
 */
export async function checkPaymentSecurity({
  userId,
  userEmail,
  username = '',
  reqHeaders = null
}) {
  const clientIp = await getClientIp(reqHeaders);
  const admin = createAdminClient();

  // 1. Check if account is frozen
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
        message: `Account Suspended: Your account has been frozen due to suspicious activity. Your IP address (${clientIp}) has been recorded. Please contact Support to appeal or reactivate your account.`
      };
    }
  }

  // 2. Check in-memory IP lockout
  const ipLock = ipLockouts.get(clientIp);
  if (ipLock && ipLock.blockedUntil > Date.now()) {
    const remainingMinutes = Math.max(1, Math.ceil((ipLock.blockedUntil - Date.now()) / (60 * 1000)));
    return {
      allowed: false,
      blocked: true,
      reason: 'ip_rate_limited',
      ip: clientIp,
      message: `Security Lockout: Too many failed payment attempts from this network. Transactions are restricted for the next ${remainingMinutes} minute(s). Your IP address (${clientIp}) has been recorded and flagged for security review. Please contact Support.`
    };
  }

  // 3. Database verification of failed attempts in the last 2 hours
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

        const shouldAutoFreeze = failedOrPending >= AUTO_FREEZE_THRESHOLD;
        let actionTaken = 'Blocked for 2 Hours';

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
          failedCount: failedOrPending,
          actionTaken,
          reason: `User generated ${failedOrPending} failed/incomplete payment requests within 2 hours.`
        });

        return {
          allowed: false,
          blocked: true,
          reason: 'too_many_failures',
          ip: clientIp,
          failedCount: failedOrPending,
          message: `Security Alert: You have reached the limit of 5 unsuccessful payment attempts. For your security and to prevent payment abuse, transactions are restricted for the next 2 hours. Your IP address (${clientIp}) has been recorded and flagged. Please contact Support or try again later.`
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
export function recordImmediateFailedAttempt(clientIp) {
  if (!clientIp) return;
  const current = ipLockouts.get(clientIp) || { count: 0, blockedUntil: 0 };
  current.count = (current.count || 0) + 1;
  if (current.count >= MAX_FAILED_ATTEMPTS) {
    current.blockedUntil = Date.now() + TWO_HOURS_MS;
  }
  ipLockouts.set(clientIp, current);
}
