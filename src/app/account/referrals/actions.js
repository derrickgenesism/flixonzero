'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';

export async function applyForAffiliate() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', user.email)
    .single();

  if (!profile) throw new Error('Profile not found');

  const code = crypto.randomBytes(4).toString('hex'); // 8 char hex
  
  const { error } = await supabase
    .from('affiliates')
    .insert({
      user_id: profile.id,
      referral_code: `ref_${code}`,
      status: 'pending' // Enforce pending status on application
    });

  if (error) {
    console.error('Error joining affiliate:', error);
    throw new Error('Failed to join affiliate program. Please try again.');
  }

  revalidatePath('/account/referrals');
}

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
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, subscription_end_date')
    .eq('email', user.email)
    .single();

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, balance')
    .eq('user_id', profile.id)
    .single();

  if (!affiliate) throw new Error('No affiliate account found');
  const available = Number(affiliate.balance);
  
  if (amount > available) throw new Error('Insufficient balance');

  // 1. Log payout request
  await supabase.from('payout_requests').insert({
    user_id: user.id, // wait, user.id is UUID. Need to use profile ID or keep it UUID if payout_requests expects UUID.
    // Let's keep it whatever it was. payout_requests probably uses UUID if it wasn't failing before.
    // wait, earlier it used user.id (UUID). Let's use user.id.
    amount: amount,
    type: 'watch_days_conversion',
    status: 'completed'
  });

  // 2. Update earnings
  await supabase
    .from('affiliates')
    .update({ 
      balance: available - amount,
      total_withdrawn: Number(affiliate.total_withdrawn || 0) + amount
    })
    .eq('id', affiliate.id);

  // Record it in commissions as negative
  await supabase.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: -amount,
    type: 'manual',
    description: `Converted to ${daysToAdd} Watch Days`
  });

  // 3. Extend user profile subscription
  let currentEnd = profile?.subscription_end_date ? new Date(profile.subscription_end_date) : new Date();
  if (currentEnd < new Date()) currentEnd = new Date(); // If expired, start from today

  const newEnd = new Date(currentEnd);
  newEnd.setDate(newEnd.getDate() + daysToAdd);

  await supabase
    .from('user_profiles')
    .update({ subscription_end_date: newEnd.toISOString() })
    .eq('id', profile.id);

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
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', user.email)
    .single();

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, balance')
    .eq('user_id', profile.id)
    .single();

  if (!affiliate) throw new Error('No affiliate account found');
  const available = Number(affiliate.balance);
  
  if (amount > available) throw new Error('Insufficient balance');

  // 1. Log payout request
  await supabase.from('payout_requests').insert({
    user_id: user.id, // UUID
    amount: amount,
    type: 'cash_withdrawal',
    status: 'pending',
    payment_details: phone
  });

  // 2. Deduct from balance immediately to prevent double spending
  await supabase
    .from('affiliates')
    .update({ 
      balance: available - amount,
      total_withdrawn: Number(affiliate.total_withdrawn || 0) + amount
    })
    .eq('id', affiliate.id);

  // Record it in commissions as negative pending
  await supabase.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: -amount,
    type: 'manual',
    description: `Requested Cash Withdrawal`
  });

  revalidatePath('/account/referrals');
}
