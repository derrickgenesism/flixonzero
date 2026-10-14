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

export async function approvePayout(formData) {
  const { admin } = await verifyAdmin();
  const id = formData.get('id');

  const { data: comm } = await admin
    .from('affiliate_commissions')
    .select('*, affiliates(id, user_id, user_profiles!affiliates_user_id_fkey(username, email))')
    .eq('id', id)
    .maybeSingle();

  if (!comm || comm.type !== 'payout_pending') return;

  const { error } = await admin
    .from('affiliate_commissions')
    .update({ 
      type: 'payout_completed',
      description: comm.description.replace('(Pending Admin Transfer)', '(Paid & Sent)')
    })
    .eq('id', id);

  if (error) console.error('Error approving payout:', error);

  // Send support message to notify user
  try {
    const userId = comm.affiliates?.user_id;
    if (userId) {
      let { data: thread } = await admin
        .from('support_threads')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

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
}

export async function rejectPayout(formData) {
  const { admin } = await verifyAdmin();
  const id = formData.get('id');
  const reason = formData.get('reason') || 'Invalid mobile money number or transfer issue';

  const { data: comm } = await admin
    .from('affiliate_commissions')
    .select('*, affiliates(id, balance, total_withdrawn, user_id)')
    .eq('id', id)
    .maybeSingle();

  if (!comm || comm.type !== 'payout_pending') return;

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
  await admin
    .from('affiliate_commissions')
    .update({
      type: 'payout_rejected',
      description: `${comm.description.replace('(Pending Admin Transfer)', '')} (Rejected: ${reason})`
    })
    .eq('id', id);

  // 3. Notify user in support thread
  try {
    const userId = comm.affiliates?.user_id;
    if (userId) {
      let { data: thread } = await admin
        .from('support_threads')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

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
}
