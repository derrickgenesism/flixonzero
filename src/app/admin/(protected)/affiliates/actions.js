'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAffiliateSettings() {
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('*')
    .in('setting_key', [
      'affiliate_ppc_enabled',
      'affiliate_cpa_enabled',
      'affiliate_cpm_rate',
      'affiliate_plan_1_reward',
      'affiliate_plan_2_reward'
    ])

  const config = {}
  settings?.forEach(s => {
    config[s.setting_key] = s.setting_value
  })

  // get all affiliates
  const { data: affiliates, error } = await supabase
    .from('affiliates')
    .select('*, user_profiles!affiliates_user_id_fkey(email, username)')
    .order('total_earned', { ascending: false })
    
  if (error) console.error('Error fetching affiliates:', error);

  return { config, affiliates: affiliates || [] }
}

export async function updateSettings(formData) {
  const supabase = await createClient()

  const keys = [
    'affiliate_ppc_enabled',
    'affiliate_cpa_enabled',
    'affiliate_cpm_rate',
    'affiliate_plan_1_reward',
    'affiliate_plan_2_reward'
  ]

  for (const key of keys) {
    const val = formData.get(key)
    if (val !== null) {
      await supabase
        .from('admin_settings')
        .update({ setting_value: val })
        .eq('setting_key', key)
    }
  }

  revalidatePath('/admin/affiliates')
  return { success: true }
}

export async function adjustBalance(affiliateId, amountChange, reason) {
  const supabase = await createClient()
  const change = Number(amountChange)

  if (isNaN(change) || change === 0) {
    return { error: 'Invalid amount' }
  }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, balance, total_earned')
    .eq('id', affiliateId)
    .single()

  if (!affiliate) return { error: 'Affiliate not found' }

  // Update balance
  await supabase
    .from('affiliates')
    .update({ 
      balance: Number(affiliate.balance) + change,
      // only increase total_earned if it's positive (don't decrease it if we're deducting a penalty)
      total_earned: change > 0 ? Number(affiliate.total_earned) + change : affiliate.total_earned
    })
    .eq('id', affiliateId)

  // Record it
  await supabase.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: change,
    type: 'manual',
    description: reason || (change > 0 ? 'Admin Bonus' : 'Admin Deduction')
  })

  revalidatePath('/admin/affiliates')
  return { success: true }
}

export async function approveAffiliate(affiliateId) {
  const supabase = await createClient()

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, user_id, user_profiles!affiliates_user_id_fkey(username)')
    .eq('id', affiliateId)
    .single();

  if (!affiliate) return { error: 'Affiliate not found' }

  await supabase
    .from('affiliates')
    .update({ status: 'approved' })
    .eq('id', affiliateId);

  // Send a congratulatory message
  // 1. Ensure support thread exists
  let { data: thread } = await supabase
    .from('support_threads')
    .select('id')
    .eq('user_id', affiliate.user_id)
    .maybeSingle();

  if (!thread) {
    const { data: newThread } = await supabase
      .from('support_threads')
      .insert({ user_id: affiliate.user_id, subject: `Support Request - ${affiliate.user_profiles?.username || 'User'}` })
      .select('id')
      .single();
    thread = newThread;
  }

  // 2. Insert message
  if (thread) {
    await supabase.from('support_messages').insert({
      thread_id: thread.id,
      sender_role: 'admin',
      content: 'Congratulations! Your application to the Affiliate Program has been approved. You can now access your tracking link in your account dashboard and start earning commissions immediately!',
      is_read: false
    });
  }

  revalidatePath('/admin/affiliates')
  return { success: true }
}

export async function rejectAffiliate(affiliateId) {
  const supabase = await createClient()

  await supabase
    .from('affiliates')
    .update({ status: 'rejected' })
    .eq('id', affiliateId);

  revalidatePath('/admin/affiliates')
  return { success: true }
}
