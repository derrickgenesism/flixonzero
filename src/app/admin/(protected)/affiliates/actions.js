'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const admin = createAdminClient()
  const { data: adminCheck } = await admin
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .maybeSingle()

  if (adminCheck?.role !== 'administrator') throw new Error("Forbidden")
  return { user, admin }
}

export async function getAffiliateSettings() {
  const { admin } = await verifyAdmin()

  // Fetch all active subscription plans
  const { data: plans } = await admin
    .from('subscription_plans')
    .select('id, name, price, duration_days')
    .eq('is_active', true)
    .order('price', { ascending: true })

  const planSettingKeys = (plans || []).map(p => `affiliate_plan_${p.id}_reward`)

  const { data: settings } = await admin
    .from('admin_settings')
    .select('*')
    .in('setting_key', [
      'affiliate_ppc_enabled',
      'affiliate_cpa_enabled',
      'affiliate_cpm_rate',
      'affiliate_plan_1_reward',
      'affiliate_plan_2_reward',
      'affiliate_plan_3_reward',
      ...planSettingKeys
    ])

  const config = {}
  settings?.forEach(s => {
    config[s.setting_key] = s.setting_value
  })

  // get all affiliates using admin client to bypass RLS restrictions
  const { data: affiliates, error } = await admin
    .from('affiliates')
    .select('*, user_profiles!affiliates_user_id_fkey(email, username)')
    .order('created_at', { ascending: false })

  if (error) console.error('Error fetching affiliates:', error)

  return { config, affiliates: affiliates || [], plans: plans || [] }
}

export async function updateSettings(formData) {
  const { admin } = await verifyAdmin()

  for (const [key, val] of formData.entries()) {
    if (key.startsWith('affiliate_')) {
      const { data: existing } = await admin
        .from('admin_settings')
        .select('id')
        .eq('setting_key', key)
        .maybeSingle()

      if (existing) {
        await admin.from('admin_settings')
          .update({ setting_value: String(val) })
          .eq('setting_key', key)
      } else {
        await admin.from('admin_settings')
          .insert({ setting_key: key, setting_value: String(val) })
      }
    }
  }

  revalidatePath('/admin/affiliates')
  return { success: true }
}

export async function adjustBalance(affiliateId, amountChange, reason) {
  const { admin } = await verifyAdmin()
  const change = Number(amountChange)

  if (isNaN(change) || change === 0) {
    return { error: 'Invalid amount' }
  }

  const { data: affiliate } = await admin
    .from('affiliates')
    .select('id, balance, total_earned')
    .eq('id', affiliateId)
    .maybeSingle()

  if (!affiliate) return { error: 'Affiliate not found' }

  // Update balance
  const { error: updateErr } = await admin
    .from('affiliates')
    .update({ 
      balance: Number(affiliate.balance || 0) + change,
      total_earned: change > 0 ? Number(affiliate.total_earned || 0) + change : affiliate.total_earned
    })
    .eq('id', affiliateId)

  if (updateErr) {
    console.error('[adjustBalance] update error:', updateErr)
    return { error: 'Failed to update balance' }
  }

  // Record it in commissions
  await admin.from('affiliate_commissions').insert({
    affiliate_id: affiliate.id,
    amount: change,
    type: 'manual',
    description: reason || (change > 0 ? 'Admin Bonus' : 'Admin Deduction')
  })

  revalidatePath('/admin/affiliates')
  return { success: true }
}

export async function approveAffiliate(affiliateId) {
  try {
    const { admin } = await verifyAdmin()

    const { data: affiliate, error: fetchErr } = await admin
      .from('affiliates')
      .select('id, user_id, user_profiles!affiliates_user_id_fkey(username, email)')
      .eq('id', affiliateId)
      .maybeSingle()

    if (fetchErr || !affiliate) {
      console.error('[approveAffiliate] fetch error:', fetchErr)
      return { error: 'Affiliate not found' }
    }

    const { error: updateErr } = await admin
      .from('affiliates')
      .update({ status: 'approved' })
      .eq('id', affiliateId)

    if (updateErr) {
      console.error('[approveAffiliate] update error:', updateErr)
      return { error: 'Failed to update status to approved' }
    }

    // Send a congratulatory message
    try {
      let { data: thread } = await admin
        .from('support_threads')
        .select('id')
        .eq('user_id', affiliate.user_id)
        .maybeSingle()

      if (!thread) {
        const { data: newThread } = await admin
          .from('support_threads')
          .insert({ 
            user_id: affiliate.user_id, 
            subject: `Support Request - ${affiliate.user_profiles?.username || 'User'}` 
          })
          .select('id')
          .single()
        thread = newThread
      }

      if (thread) {
        await admin.from('support_messages').insert({
          thread_id: thread.id,
          sender_role: 'admin',
          content: 'Congratulations! Your application to the Affiliate Program has been approved. You can now access your tracking link in your account dashboard and start earning commissions immediately!',
          is_read: false
        })
      }
    } catch (msgErr) {
      console.warn('[approveAffiliate] support message warning:', msgErr)
    }

    revalidatePath('/admin/affiliates')
    return { success: true }
  } catch (err) {
    console.error('[approveAffiliate] error:', err)
    return { error: err.message || 'Server error approving affiliate' }
  }
}

export async function rejectAffiliate(affiliateId) {
  try {
    const { admin } = await verifyAdmin()

    const { error } = await admin
      .from('affiliates')
      .update({ status: 'rejected' })
      .eq('id', affiliateId)

    if (error) {
      console.error('[rejectAffiliate] error:', error)
      return { error: 'Failed to reject affiliate' }
    }

    revalidatePath('/admin/affiliates')
    return { success: true }
  } catch (err) {
    console.error('[rejectAffiliate] error:', err)
    return { error: err.message || 'Server error rejecting affiliate' }
  }
}
