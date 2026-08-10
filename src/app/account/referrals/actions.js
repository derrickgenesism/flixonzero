'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function convertToWatchDays(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const amount = Number(formData.get('amount'));
  if (!amount || amount < 1000) throw new Error('Invalid amount');

  // Logic: 10,000 UGX = 30 days
  const daysToAdd = Math.floor((amount / 10000) * 30);
  if (daysToAdd < 1) throw new Error('Amount too small to convert');

  // Verify balance
  const { data: earnings } = await supabase
    .from('referral_earnings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!earnings) throw new Error('No earnings found');
  const available = Number(earnings.amount_earned) - Number(earnings.amount_withdrawn) - Number(earnings.amount_converted);
  
  if (amount > available) throw new Error('Insufficient balance');

  // 1. Log payout request
  await supabase.from('payout_requests').insert({
    user_id: user.id,
    amount: amount,
    type: 'watch_days_conversion',
    status: 'completed'
  });

  // 2. Update earnings
  await supabase
    .from('referral_earnings')
    .update({ amount_converted: Number(earnings.amount_converted) + amount })
    .eq('user_id', user.id);

  // 3. Extend user profile subscription
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('subscription_end_date')
    .eq('email', user.email)
    .single();

  let currentEnd = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : new Date();
  if (currentEnd < new Date()) currentEnd = new Date(); // If expired, start from today

  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + daysToAdd);

  await supabase
    .from('user_profiles')
    .update({ subscription_end_date: newEnd.toISOString() })
    .eq('email', user.email);

  revalidatePath('/account/referrals');
  revalidatePath('/account');
}

export async function requestPayout(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const amount = Number(formData.get('amount'));
  const phone = formData.get('phone');
  
  if (!amount || amount < 5000) throw new Error('Minimum withdrawal is 5000 UGX');
  if (!phone) throw new Error('Phone number is required');

  // Verify balance
  const { data: earnings } = await supabase
    .from('referral_earnings')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!earnings) throw new Error('No earnings found');
  const available = Number(earnings.amount_earned) - Number(earnings.amount_withdrawn) - Number(earnings.amount_converted);
  
  if (amount > available) throw new Error('Insufficient balance');

  // 1. Log payout request
  await supabase.from('payout_requests').insert({
    user_id: user.id,
    amount: amount,
    type: 'cash_withdrawal',
    status: 'pending',
    payment_details: phone
  });

  // 2. We don't deduct from balance until approved by admin
  // So balance deduction happens on admin side

  revalidatePath('/account/referrals');
}
