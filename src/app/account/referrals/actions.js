'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { normalizeUgandaPhone, isValidUgandaPhone } from '@/lib/fraudGuard';
import { calculateBonusWatchDays } from '@/lib/watchTimeBonus';

async function sendTelegramNotice(text) {
  try {
    const admin = createAdminClient();
    const { data: settings } = await admin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

    const botToken = settings?.find(s => s.setting_key === 'telegram_bot_token')?.setting_value?.trim();
    const chatId = settings?.find(s => s.setting_key === 'telegram_chat_id')?.setting_value?.trim();

    if (!botToken || !chatId) {
      console.warn('[TelegramNotice] missing botToken or chatId in admin_settings');
      return false;
    }

    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const result = await res.json();
    if (!result.ok) {
      console.error('[TelegramNotice] Telegram API error:', result);
      return false;
    }
    return true;
  } catch (e) {
    console.error('[TelegramNotice] send error:', e);
    return false;
  }
}

export async function applyForAffiliate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, email, username')
    .eq('email', user.email)
    .maybeSingle();

  if (!profile) throw new Error('Profile not found');

  // Check if they already have an affiliate row
  const { data: existing } = await admin
    .from('affiliates')
    .select('id, status')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (existing) {
    revalidatePath('/account/referrals');
    return { success: true, status: existing.status };
  }

  const code = crypto.randomBytes(4).toString('hex').toLowerCase();
  const referralCode = `ref_${code}`;
  const now = new Date();
  
  const { error } = await admin
    .from('affiliates')
    .insert({
      user_id: profile.id,
      referral_code: referralCode,
      balance: 0,
      total_earned: 0,
      total_withdrawn: 0,
      created_at: now.toISOString(),
      status: 'pending'
    });

  if (error) {
    console.error('Error joining affiliate:', error);
    throw new Error('Failed to join affiliate program. Please try again.');
  }

  // Format exact submission date & time in Kampala EAT timezone
  const dateFormatted = now.toLocaleDateString('en-UG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Kampala'
  });
  const timeFormatted = now.toLocaleTimeString('en-UG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Africa/Kampala'
  });

  // Await Telegram notification so it's guaranteed to be delivered
  await sendTelegramNotice(
    `🤝 <b>NEW PARTNER PROGRAM APPLICATION</b>\n\n` +
    `• <b>Applicant:</b> @${profile.username || 'User'} (ID #${profile.id})\n` +
    `• <b>Email:</b> <code>${profile.email}</code>\n` +
    `• <b>Generated Code:</b> <code>${referralCode}</code>\n` +
    `• <b>Date Submitted:</b> ${dateFormatted} at ${timeFormatted} EAT\n\n` +
    `⚡ <i>Review & approve in Admin Panel → Affiliates.</i>`
  );

  revalidatePath('/account/referrals');
  revalidatePath('/admin/affiliates');
  return { success: true };
}

export async function instantActivateAffiliate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Please log in first' };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, email, username')
    .eq('email', user.email)
    .maybeSingle();

  if (!profile) return { error: 'Profile not found' };

  const { data: existing } = await admin
    .from('affiliates')
    .select('id, referral_code, status')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (existing) {
    if (existing.status !== 'approved') {
      await admin.from('affiliates').update({ status: 'approved' }).eq('id', existing.id);
    }
    revalidatePath('/account');
    revalidatePath('/account/referrals');
    return { success: true, referralCode: existing.referral_code };
  }

  const code = crypto.randomBytes(4).toString('hex').toLowerCase();
  const referralCode = `ref_${code}`;
  const now = new Date();

  const { error } = await admin.from('affiliates').insert({
    user_id: profile.id,
    referral_code: referralCode,
    balance: 0,
    total_earned: 0,
    total_withdrawn: 0,
    created_at: now.toISOString(),
    status: 'approved'
  });

  if (error) {
    console.error('[instantActivateAffiliate] error:', error);
    return { error: 'Failed to activate partner code' };
  }

  // Telegram alert about new activated partner
  const dateFormatted = now.toLocaleDateString('en-UG', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'Africa/Kampala'
  });
  await sendTelegramNotice(
    `⚡ <b>NEW PARTNER ACTIVATED (1-CLICK)</b>\n\n` +
    `• <b>Partner:</b> @${profile.username || 'User'} (ID #${profile.id})\n` +
    `• <b>Email:</b> <code>${profile.email}</code>\n` +
    `• <b>Referral Code:</b> <code>${referralCode}</code>\n` +
    `• <b>Date:</b> ${dateFormatted} EAT`
  );

  revalidatePath('/account');
  revalidatePath('/account/referrals');
  return { success: true, referralCode };
}

export async function convertToWatchDays(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Please log in first' };

  const amount = Math.floor(Number(formData.get('amount')));
  if (isNaN(amount) || amount < 1000) {
    return { error: 'Minimum conversion amount is 1,000 UGX' };
  }

  const admin = createAdminClient();

  // Fetch subscription plans to determine pricing equivalent
  const { data: plans } = await admin
    .from('subscription_plans')
    .select('id, name, price, duration_days')
    .eq('is_active', true)
    .order('price', { ascending: true });

  const daysToAdd = calculateBonusWatchDays(amount, plans);

  if (daysToAdd < 1) {
    return { error: 'Minimum conversion is 1,000 UGX (grants 3 VIP Watch Days)' };
  }

  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, subscription_end_date, email')
    .eq('email', user.email)
    .maybeSingle();

  if (!profile) return { error: 'Profile not found' };

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, balance, total_withdrawn')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!affiliate) return { error: 'No affiliate account found' };
  const available = Number(affiliate.balance || 0);
  
  if (amount > available) {
    return { error: `Insufficient balance. Available: ${available.toLocaleString()} UGX` };
  }

  // 1. Deduct from balance
  const { error: updateAffErr } = await admin
    .from('affiliates')
    .update({ 
      balance: available - amount,
      total_withdrawn: Number(affiliate.total_withdrawn || 0) + amount
    })
    .eq('id', affiliate.id);

  if (updateAffErr) {
    console.error('Convert affiliate update error:', updateAffErr);
    return { error: 'Failed to update balance' };
  }

  // 2. Extend subscription
  const now = new Date();
  const isCurrentlyActive = profile.subscription_end_date && new Date(profile.subscription_end_date) > now;
  const currentEnd = isCurrentlyActive ? new Date(profile.subscription_end_date) : now;
  const prevDays = isCurrentlyActive
    ? Math.max(0, Math.ceil((new Date(profile.subscription_end_date) - now) / (1000 * 60 * 60 * 24)))
    : 0;

  const newEnd = new Date(currentEnd.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  const newTotalDays = prevDays + daysToAdd;

  await admin
    .from('user_profiles')
    .update({ 
      subscription_end_date: newEnd.toISOString(),
      subscription_plan: 'affiliate_reward'
    })
    .eq('id', profile.id);

  // 3. Record commission ledger with clear breakdown
  const description = prevDays > 0
    ? `Converted ${amount.toLocaleString()} UGX to +${daysToAdd} Watch Days (${prevDays} existing + ${daysToAdd} added = ${newTotalDays} total days)`
    : `Converted ${amount.toLocaleString()} UGX to ${daysToAdd} VIP Watch Days`;

  await admin.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: -amount,
    type: 'watch_days',
    description
  });

  revalidatePath('/account/referrals');
  revalidatePath('/account');
  return { 
    success: true, 
    message: `🎉 Success! Added +${daysToAdd} Watch Days. ${prevDays > 0 ? `Added to your existing ${prevDays} days (${newTotalDays} total days remaining).` : `You now have ${newTotalDays} days remaining.`} Access active until ${newEnd.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}.` 
  };
}

export async function requestPayout(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Please log in first' };

  const amount = Math.floor(Number(formData.get('amount')));
  const rawPhone = String(formData.get('phone') || '').trim();
  const normalizedPhone = normalizeUgandaPhone(rawPhone);
  
  const admin = createAdminClient();

  const { data: minPayoutSetting } = await admin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'affiliate_min_payout')
    .maybeSingle();

  const minPayout = Number(minPayoutSetting?.setting_value || 5000);

  const { data: feeSetting } = await admin
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'affiliate_withdrawal_fee')
    .maybeSingle();

  const withdrawalFee = Number(feeSetting?.setting_value !== undefined ? feeSetting.setting_value : 500);
  const netAmount = Math.max(0, amount - withdrawalFee);

  if (isNaN(amount) || amount < minPayout) {
    return { error: `Minimum cash withdrawal is ${minPayout.toLocaleString()} UGX` };
  }

  if (!isValidUgandaPhone(normalizedPhone)) {
    return { error: 'Please enter a valid Ugandan mobile money number (e.g. 077... or 075...)' };
  }

  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, username, email')
    .eq('email', user.email)
    .maybeSingle();

  if (!profile) return { error: 'Profile not found' };

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, balance, total_withdrawn, status')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!affiliate) return { error: 'No affiliate account found' };
  if (affiliate.status !== 'approved' && affiliate.status !== null) {
    return { error: 'Your affiliate account must be approved before requesting cash withdrawals' };
  }

  const available = Number(affiliate.balance || 0);
  if (amount > available) {
    return { error: `Insufficient balance. Available: ${available.toLocaleString()} UGX` };
  }

  // 1. Reserve / Deduct from balance immediately to prevent double spending
  const { error: updateAffErr } = await admin
    .from('affiliates')
    .update({ 
      balance: available - amount,
      total_withdrawn: Number(affiliate.total_withdrawn || 0) + amount
    })
    .eq('id', affiliate.id);

  if (updateAffErr) {
    console.error('Payout request balance error:', updateAffErr);
    return { error: 'Failed to reserve payout balance' };
  }

  // 2. Record payout in affiliate_commissions as pending
  const feeNote = withdrawalFee > 0 ? ` (Gross: ${amount.toLocaleString()} UGX | Fee: -${withdrawalFee.toLocaleString()} UGX | Net Transfer: ${netAmount.toLocaleString()} UGX)` : '';
  await admin.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: -amount,
    type: 'payout_pending',
    description: `Mobile Money Payout: 0${normalizedPhone.slice(3)}${feeNote} (Pending Admin Transfer)`
  });

  // 2b. Sync into payout_requests table
  await admin.from('payout_requests').insert({
    affiliate_id: affiliate.id,
    amount: amount,
    status: 'pending',
    payout_method: 'mobile_money',
    payout_details: JSON.stringify({
      phone: `0${normalizedPhone.slice(3)}`,
      gross_amount: amount,
      withdrawal_fee: withdrawalFee,
      net_payout: netAmount
    })
  }).catch(() => {});

  // 3. Create or find support thread to notify user and admin
  try {
    let { data: thread } = await admin
      .from('support_threads')
      .select('id')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (!thread) {
      const { data: newThread } = await admin
        .from('support_threads')
        .insert({
          user_id: profile.id,
          subject: `Payout Request - ${profile.username || 'Affiliate'}`
        })
        .select('id')
        .single();
      thread = newThread;
    }

    if (thread) {
      await admin.from('support_messages').insert({
        thread_id: thread.id,
        sender_role: 'system',
        content: `Your cash withdrawal request of ${amount.toLocaleString()} UGX to mobile money 0${normalizedPhone.slice(3)} has been received. After telecom transfer fee (${withdrawalFee.toLocaleString()} UGX), you will receive ${netAmount.toLocaleString()} UGX.`,
        is_read: false
      });
    }
  } catch (supErr) {
    console.warn('[requestPayout] support notification error:', supErr);
  }

  // 4. Send Instant Telegram Alert to admin (Awaited)
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('en-UG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Africa/Kampala'
  });
  const timeFormatted = now.toLocaleTimeString('en-UG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Africa/Kampala'
  });

  await sendTelegramNotice(
    `💰 <b>NEW AFFILIATE CASH WITHDRAWAL REQUEST</b> 💰\n\n` +
    `• <b>Affiliate:</b> @${profile.username || 'User'} (<code>${profile.email}</code>)\n` +
    `• <b>Gross Requested:</b> ${amount.toLocaleString()} UGX\n` +
    `• <b>Telecom Transfer Fee:</b> -${withdrawalFee.toLocaleString()} UGX\n` +
    `• <b>👉 NET CASH TO SEND:</b> <b>${netAmount.toLocaleString()} UGX</b>\n` +
    `• <b>Phone (MM):</b> <code>0${normalizedPhone.slice(3)}</code>\n` +
    `• <b>Remaining Balance:</b> ${(available - amount).toLocaleString()} UGX\n` +
    `• <b>Date Submitted:</b> ${dateFormatted} at ${timeFormatted} EAT\n\n` +
    `👉 <i>Send <b>${netAmount.toLocaleString()} UGX</b> to <code>0${normalizedPhone.slice(3)}</code> and mark completed in Admin Panel → Payouts.</i>`
  );

  revalidatePath('/account/referrals');
  return { 
    success: true, 
    message: `✅ Payout request of ${amount.toLocaleString()} UGX submitted! After telecom fee (${withdrawalFee.toLocaleString()} UGX), you will receive ${netAmount.toLocaleString()} UGX to your mobile money within 2-6 hours.` 
  };
}
