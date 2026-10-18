'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .maybeSingle();

  if (profile?.role !== 'administrator') throw new Error('Forbidden');
  return { user, admin };
}

export async function approvePayout(arg) {
  const { admin } = await verifyAdmin();
  const id = typeof arg === 'string' ? arg : arg?.get?.('id');

  if (!id) return { error: 'Missing payout ID' };

  const { data: comm } = await admin
    .from('affiliate_commissions')
    .select('*, affiliates(id, user_id, user_profiles!affiliates_user_id_fkey(username, email))')
    .eq('id', id)
    .maybeSingle();

  if (!comm || comm.type !== 'payout_pending') {
    return { error: 'Payout request not found or not in pending state' };
  }

  const cleanDesc = (comm.description || 'Mobile Money Payout').replace(/\s*\(Pending Admin Transfer\)/gi, '').trim();

  const { error } = await admin
    .from('affiliate_commissions')
    .update({ 
      type: 'payout_completed',
      description: `${cleanDesc} (Paid & Sent)`
    })
    .eq('id', id);

  if (error) {
    console.error('Error approving payout:', error);
    return { error: 'Database update failed' };
  }

  // Sync payout_requests table if present
  await admin.from('payout_requests')
    .update({ status: 'paid' })
    .eq('affiliate_id', comm.affiliate_id)
    .eq('status', 'pending')
    .catch(() => {});

  // Send support message to notify user
  try {
    const userId = comm.affiliates?.user_id;
    if (userId) {
      let { data: thread } = await admin
        .from('support_threads')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!thread) {
        const { data: newThread } = await admin
          .from('support_threads')
          .insert({
            user_id: userId,
            subject: 'FlixOn Partner Cash Payout'
          })
          .select('id')
          .single();
        thread = newThread;
      }

      if (thread) {
        await admin.from('support_messages').insert({
          thread_id: thread.id,
          sender_role: 'admin',
          content: `✅ Your cash payout of ${Math.abs(Number(comm.amount)).toLocaleString()} UGX has been sent to your Mobile Money account. Thank you for partnering with FlixOn!`,
          is_read: false
        });
      }
    }
  } catch (e) {
    console.warn('Payout notification warning:', e);
  }

  revalidatePath('/admin/payouts');
  revalidatePath('/account/referrals');
  revalidatePath('/account');
  return { success: true };
}

export async function rejectPayout(arg, optionalReason) {
  const { admin } = await verifyAdmin();
  const id = typeof arg === 'string' ? arg : arg?.get?.('id');
  const reason = (typeof arg?.get === 'function' ? arg.get('reason') : optionalReason) || 'Invalid mobile money number or transfer issue';

  if (!id) return { error: 'Missing payout ID' };

  const { data: comm } = await admin
    .from('affiliate_commissions')
    .select('*, affiliates(id, balance, total_withdrawn, user_id)')
    .eq('id', id)
    .maybeSingle();

  if (!comm || comm.type !== 'payout_pending') {
    return { error: 'Payout request not found or not in pending state' };
  }

  const refundAmount = Math.abs(Number(comm.amount));

  // 1. Refund the balance to affiliate
  if (comm.affiliates) {
    await admin
      .from('affiliates')
      .update({
        balance: Number(comm.affiliates.balance || 0) + refundAmount,
        total_withdrawn: Math.max(0, Number(comm.affiliates.total_withdrawn || 0) - refundAmount)
      })
      .eq('id', comm.affiliate_id);
  }

  // 2. Mark commission record as rejected
  const cleanDesc = (comm.description || 'Mobile Money Payout').replace(/\s*\(Pending Admin Transfer\)/gi, '').trim();
  await admin
    .from('affiliate_commissions')
    .update({
      type: 'payout_rejected',
      description: `${cleanDesc} (Rejected: ${reason})`
    })
    .eq('id', id);

  // Sync payout_requests table if present
  await admin.from('payout_requests')
    .update({ status: 'rejected' })
    .eq('affiliate_id', comm.affiliate_id)
    .eq('status', 'pending')
    .catch(() => {});

  // 3. Notify user in support thread
  try {
    const userId = comm.affiliates?.user_id;
    if (userId) {
      let { data: thread } = await admin
        .from('support_threads')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!thread) {
        const { data: newThread } = await admin
          .from('support_threads')
          .insert({
            user_id: userId,
            subject: 'FlixOn Partner Cash Payout'
          })
          .select('id')
          .single();
        thread = newThread;
      }

      if (thread) {
        await admin.from('support_messages').insert({
          thread_id: thread.id,
          sender_role: 'admin',
          content: `⚠️ Your cash payout request of ${refundAmount.toLocaleString()} UGX was rejected: "${reason}". The funds have been refunded back to your affiliate balance.`,
          is_read: false
        });
      }
    }
  } catch (e) {
    console.warn('Payout rejection notification warning:', e);
  }

  revalidatePath('/admin/payouts');
  revalidatePath('/account/referrals');
  revalidatePath('/account');
  return { success: true };
}
