'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { normalizeUgandaPhone, isValidUgandaPhone } from '@/lib/fraudGuard';

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

export async function convertToWatchDays(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Please log in first' };

  const amount = Math.floor(Number(formData.get('amount')));
  if (isNaN(amount) || amount < 1000) {
    return { error: 'Minimum conversion amount is 1,000 UGX' };
  }

  // 10,000 UGX = 30 VIP days (approx 333.33 UGX per day)
  const daysToAdd = Math.floor((amount / 10000) * 30);
  if (daysToAdd < 1) {
    return { error: 'Amount too small to convert to at least 1 day' };
  }

  const admin = createAdminClient();

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
  let currentEnd = profile.subscription_end_date ? new Date(profile.subscription_end_date) : new Date();
  if (currentEnd < new Date()) currentEnd = new Date(); // If expired, start from today

  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + daysToAdd);

  await admin
    .from('user_profiles')
    .update({ 
      subscription_end_date: newEnd.toISOString(),
      subscription_plan: 'affiliate_reward'
    })
    .eq('id', profile.id);

  // 3. Record commission ledger
  await admin.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: -amount,
    type: 'watch_days',
    description: `Converted ${amount.toLocaleString()} UGX to ${daysToAdd} VIP Watch Days`
  });

  revalidatePath('/account/referrals');
  revalidatePath('/account');
  return { 
    success: true, 
    message: `🎉 Success! Added ${daysToAdd} Watch Days to your account. Your access expires on ${newEnd.toLocaleDateString()}.` 
  };
}

export async function requestPayout(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Please log in first' };

  const amount = Math.floor(Number(formData.get('amount')));
  const rawPhone = String(formData.get('phone') || '').trim();
  const normalizedPhone = normalizeUgandaPhone(rawPhone);
  
  if (isNaN(amount) || amount < 5000) {
    return { error: 'Minimum cash withdrawal is 5,000 UGX' };
  }

  if (!isValidUgandaPhone(normalizedPhone)) {
    return { error: 'Please enter a valid Ugandan mobile money number (e.g. 077... or 075...)' };
  }

  const admin = createAdminClient();

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
  await admin.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: -amount,
    type: 'payout_pending',
    description: `Mobile Money Payout: 0${normalizedPhone.slice(3)} (Pending Admin Transfer)`
  });

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
        content: `Your cash withdrawal request of ${amount.toLocaleString()} UGX to mobile money number 0${normalizedPhone.slice(3)} has been received and queued for transfer.`,
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
    `• <b>Amount:</b> <b>${amount.toLocaleString()} UGX</b>\n` +
    `• <b>Phone (MM):</b> <code>0${normalizedPhone.slice(3)}</code>\n` +
    `• <b>Remaining Balance:</b> ${(available - amount).toLocaleString()} UGX\n` +
    `• <b>Date Submitted:</b> ${dateFormatted} at ${timeFormatted} EAT\n\n` +
    `<i>Send mobile money to the user and mark completed in Admin Panel → Payouts.</i>`
  );

  revalidatePath('/account/referrals');
  return { 
    success: true, 
    message: `✅ Payout request of ${amount.toLocaleString()} UGX submitted! Mobile money transfer is typically processed within 2-6 hours.` 
  };
}
