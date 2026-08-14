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
  const { data: affiliates } = await supabase
    .from('affiliates')
    .select('*, user_profiles(email, username)')
    .order('total_earned', { ascending: false })

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
