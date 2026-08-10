'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function approvePayout(formData) {
  const supabase = await createClient();
  const id = formData.get('id');

  // Verify request
  const { data: request } = await supabase
    .from('payout_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (!request || request.status !== 'pending') return;

  // Verify earnings
  const { data: earnings } = await supabase
    .from('referral_earnings')
    .select('*')
    .eq('user_id', request.user_id)
    .single();

  const available = Number(earnings.amount_earned) - Number(earnings.amount_withdrawn) - Number(earnings.amount_converted);

  if (request.amount > available) {
    // Cannot approve, not enough balance
    return;
  }

  // 1. Update request status
  await supabase
    .from('payout_requests')
    .update({ status: 'approved' })
    .eq('id', id);

  // 2. Deduct from earnings
  await supabase
    .from('referral_earnings')
    .update({ amount_withdrawn: Number(earnings.amount_withdrawn) + Number(request.amount) })
    .eq('user_id', request.user_id);

  revalidatePath('/admin/payouts');
}

export async function rejectPayout(formData) {
  const supabase = await createClient();
  const id = formData.get('id');

  // Simply update status
  await supabase
    .from('payout_requests')
    .update({ status: 'rejected' })
    .eq('id', id);

  revalidatePath('/admin/payouts');
}
