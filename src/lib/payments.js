import { createAdminClient } from '@/utils/supabase/admin';

/**
 * Shared, race-safe payment activation.
 *
 * Both the Flutterwave webhook and the in-app polling fallback call this, so a
 * paid user gets access exactly once no matter which path confirms first.
 *
 * The transaction is "claimed" with a conditional UPDATE (status != 'successful').
 * Only the caller that actually flips the row performs the grant; the other
 * caller sees zero rows and skips. If the grant itself fails we release the
 * claim so the next webhook retry / poll can try again (never lose a paid user).
 */
export async function activateTransaction(admin, transaction, flwTransactionId) {
  const { data: claimed, error: claimError } = await admin
    .from('transactions')
    .update({
      status: 'successful',
      flw_transaction_id: flwTransactionId ? String(flwTransactionId) : null,
    })
    .eq('id', transaction.id)
    .neq('status', 'successful')
    .select('id');

  if (claimError) throw claimError;
  if (!claimed || claimed.length === 0) {
    return { activated: false }; // someone else already processed it
  }

  try {
    const { data: authData } = await admin.auth.admin.getUserById(transaction.user_id);
    const userEmail = authData?.user?.email;

    if (userEmail) {
      if (transaction.plan_type === 'extra_profile') {
        const { data: profile } = await admin
          .from('user_profiles')
          .select('extra_profile_slots')
          .eq('email', userEmail)
          .single();
        await admin
          .from('user_profiles')
          .update({ extra_profile_slots: (profile?.extra_profile_slots || 0) + 1 })
          .eq('email', userEmail);
        return { activated: true, type: 'extra_profile' };
      }

      const daysToAdd = transaction.duration_days || 0;
      const { data: profile } = await admin
        .from('user_profiles')
        .select('subscription_end_date')
        .eq('email', userEmail)
        .single();

      let expiry = new Date();
      if (profile?.subscription_end_date) {
        const current = new Date(profile.subscription_end_date);
        if (current > expiry) expiry = current;
      }
      expiry.setDate(expiry.getDate() + daysToAdd);

      if (profile) {
        const { error } = await admin
          .from('user_profiles')
          .update({ subscription_end_date: expiry.toISOString(), subscription_plan: transaction.plan_type })
          .eq('email', userEmail);
        if (error) throw error;
      } else {
        const { error } = await admin.from('user_profiles').insert({
          email: userEmail,
          username: userEmail.split('@')[0],
          subscription_end_date: expiry.toISOString(),
          subscription_plan: transaction.plan_type,
        });
        if (error) throw error;
      }

      await creditAffiliate(admin, userEmail, transaction).catch((e) =>
        console.error('Error processing affiliate commission:', e)
      );
    }

    return { activated: true, type: 'subscription' };
  } catch (err) {
    // Release the claim so a retry can finish the grant.
    await admin.from('transactions').update({ status: 'pending' }).eq('id', transaction.id);
    throw err;
  }
}

async function creditAffiliate(admin, userEmail, transaction) {
  const { data: allSettings } = await admin.from('admin_settings').select('setting_key, setting_value');
  const cpaEnabled = allSettings?.find((s) => s.setting_key === 'affiliate_cpa_enabled')?.setting_value === 'true';
  if (!cpaEnabled) return;

  const { data: profileWithRef } = await admin
    .from('user_profiles')
    .select('id, referred_by')
    .eq('email', userEmail)
    .maybeSingle();
  if (!profileWithRef?.referred_by) return;

  const planNumericId = Number(transaction.plan_type);
  if (isNaN(planNumericId) || planNumericId <= 0) return;

  // 1. Determine Base Reward: Percentage Mode vs Fixed Plan Mode
  const commType = allSettings?.find((s) => s.setting_key === 'affiliate_commission_type')?.setting_value || 'fixed';
  let baseReward = 0;

  if (commType === 'percentage') {
    const pct = Number(allSettings?.find((s) => s.setting_key === 'affiliate_commission_percentage')?.setting_value || 25);
    baseReward = Math.round(Number(transaction.amount || 0) * (pct / 100));
  } else {
    // Check specific plan reward, with fallback for Monthly Pass (Plan 3 -> Plan 2 setting)
    let rewardStr = allSettings?.find((s) => s.setting_key === `affiliate_plan_${planNumericId}_reward`)?.setting_value;
    if (!rewardStr && planNumericId === 3) {
      rewardStr = allSettings?.find((s) => s.setting_key === 'affiliate_plan_2_reward')?.setting_value;
    }
    baseReward = Number(rewardStr || 0);
  }

  if (baseReward <= 0) return;

  // 2. Check Promotional Boost / Multiplier Campaign
  const boostEnabled = allSettings?.find((s) => s.setting_key === 'affiliate_boost_enabled')?.setting_value === 'true';
  const boostEndsAt = allSettings?.find((s) => s.setting_key === 'affiliate_boost_ends_at')?.setting_value;
  const isBoostActive = boostEnabled && (!boostEndsAt || new Date(boostEndsAt) > new Date());

  let multiplier = 1;
  let boostName = '';
  if (isBoostActive) {
    multiplier = Math.max(1, Number(allSettings?.find((s) => s.setting_key === 'affiliate_boost_multiplier')?.setting_value || 2));
    boostName = allSettings?.find((s) => s.setting_key === 'affiliate_boost_name')?.setting_value || 'Special Commission Boost';
  }

  const finalReward = Math.round(baseReward * multiplier);

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, user_id, balance, total_earned, status')
    .eq('id', profileWithRef.referred_by)
    .maybeSingle();

  if (!affiliate || (affiliate.status !== 'approved' && affiliate.status !== null)) return;

  await admin
    .from('affiliates')
    .update({
      balance: Number(affiliate.balance || 0) + finalReward,
      total_earned: Number(affiliate.total_earned || 0) + finalReward,
    })
    .eq('id', affiliate.id);

  const description = isBoostActive && multiplier > 1
    ? `Commission for plan #${transaction.plan_type} [🔥 ${multiplier}X Boost: ${boostName}]`
    : `Commission for plan #${transaction.plan_type} (${commType === 'percentage' ? `${allSettings?.find(s => s.setting_key === 'affiliate_commission_percentage')?.setting_value || 25}% of ${transaction.amount} UGX` : 'Fixed CPA'})`;

  await admin.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: finalReward,
    type: 'subscription',
    description,
    referred_user_id: profileWithRef.id,
  });

  // Notify admin on Telegram about earned commission
  try {
    const botToken = allSettings?.find((s) => s.setting_key === 'telegram_bot_token')?.setting_value?.trim();
    const chatId = allSettings?.find((s) => s.setting_key === 'telegram_chat_id')?.setting_value?.trim();
    if (botToken && chatId) {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('en-UG', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Africa/Kampala'
      });
      const timeFormatted = now.toLocaleTimeString('en-UG', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Kampala'
      });

      const boostBadge = isBoostActive && multiplier > 1 ? ` (Includes 🔥 <b>${multiplier}X Boost!</b>)` : '';

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🎉 <b>AFFILIATE COMMISSION EARNED</b> 🎉\n\n` +
                `• <b>Affiliate ID:</b> #${affiliate.id}\n` +
                `• <b>Commission:</b> <b>+${finalReward.toLocaleString()} UGX</b>${boostBadge}\n` +
                `• <b>Purchased Plan:</b> Plan #${transaction.plan_type} (${Number(transaction.amount || 0).toLocaleString()} UGX)\n` +
                `• <b>Customer:</b> <code>${userEmail}</code>\n` +
                `• <b>New Balance:</b> ${(Number(affiliate.balance || 0) + finalReward).toLocaleString()} UGX\n` +
                `• <b>Date:</b> ${dateFormatted} at ${timeFormatted} EAT`,
          parse_mode: 'HTML'
        })
      });
    }
  } catch (tgErr) {
    console.warn('[creditAffiliate] Telegram notice warning:', tgErr);
  }
}

/**
 * Verify a transaction directly with Flutterwave (never cached) and activate it.
 * Returns { status: 'successful' | 'failed' | 'pending' | 'not_found', message? }
 */
export async function verifyAndActivate(txRef, { userId = null } = {}) {
  const admin = createAdminClient();

  const { data: transaction } = await admin.from('transactions').select('*').eq('tx_ref', txRef).single();
  if (!transaction) return { status: 'not_found' };
  if (userId && transaction.user_id !== userId) return { status: 'not_found' };
  if (transaction.status === 'successful') return { status: 'successful' };

  const { data: setting } = await admin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'flutterwave_secret_key')
    .single();
  const secretKey = setting?.setting_value;
  if (!secretKey) return { status: 'pending' };

  try {
    const res = await fetch(
      `https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
      {
        method: 'GET',
        headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    );
    const fw = await res.json();

    if (fw.status === 'success' && fw.data?.status === 'successful') {
      if (fw.data.amount < transaction.amount) return { status: 'failed', message: 'Amount mismatch' };
      await activateTransaction(admin, transaction, fw.data.id);
      return { status: 'successful' };
    }

    if (fw.data?.status === 'failed') {
      await admin.from('transactions').update({ status: 'failed' }).eq('id', transaction.id).eq('status', 'pending');
      return { status: 'failed', message: 'Transaction failed or was cancelled.' };
    }
  } catch (err) {
    console.error('Error verifying with Flutterwave:', err);
  }

  return { status: 'pending' };
}

/**
 * Self-healing: if a user has a recent pending payment (e.g. webhook delayed or
 * the user closed the tab before polling finished), confirm it now so they are
 * never shown a paywall after paying. Returns true if access was just granted.
 * Cost for users with nothing pending: one tiny indexed query.
 */
export async function reconcileRecentPending(userId, windowHours = 6) {
  try {
    const admin = createAdminClient();
    const since = new Date(Date.now() - windowHours * 3600 * 1000).toISOString();
    const { data: pending } = await admin
      .from('transactions')
      .select('tx_ref')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!pending) return false;

    const result = await verifyAndActivate(pending.tx_ref, { userId });
    return result.status === 'successful';
  } catch (err) {
    console.error('[reconcileRecentPending]', err?.message || err);
    return false;
  }
}
