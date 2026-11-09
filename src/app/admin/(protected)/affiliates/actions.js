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
    .select('role, is_admin')
    .eq('email', user.email)
    .maybeSingle()

  const isAdmin = adminCheck?.role === 'administrator' || adminCheck?.is_admin === true
  if (!isAdmin) throw new Error("Forbidden")
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

  const planSettingKeys = (plans || []).flatMap(p => [
    `affiliate_plan_${p.id}_reward`,
    `affiliate_plan_${p.id}_mode`
  ])

  const { data: settings } = await admin
    .from('admin_settings')
    .select('*')
    .in('setting_key', [
      'affiliate_ppc_enabled',
      'affiliate_cpa_enabled',
      'affiliate_cpm_rate',
      'affiliate_commission_type',
      'affiliate_commission_percentage',
      'affiliate_reward_scope',
      'affiliate_withdrawal_fee',
      'affiliate_min_payout',
      'affiliate_boost_enabled',
      'affiliate_boost_multiplier',
      'affiliate_boost_ends_at',
      'affiliate_boost_name',
      'affiliate_plan_1_reward',
      'affiliate_plan_1_mode',
      'affiliate_plan_2_reward',
      'affiliate_plan_2_mode',
      'affiliate_plan_3_reward',
      'affiliate_plan_3_mode',
      ...planSettingKeys
    ])

  const config = {}
  settings?.forEach(s => {
    config[s.setting_key] = s.setting_value
  })

  // Parallel fetch: affiliates, clicks, referred users, recent commissions
  const now = new Date();
  const [
    { data: affiliates, error: affErr },
    { data: clicksRaw },
    { data: referredUsersRaw },
    { data: commissionsRaw }
  ] = await Promise.all([
    admin.from('affiliates')
      .select('*, user_profiles!affiliates_user_id_fkey(email, username)')
      .order('created_at', { ascending: false }),
    admin.from('affiliate_clicks').select('affiliate_id'),
    admin.from('user_profiles')
      .select('id, email, username, referred_by, subscription_end_date, created_at')
      .not('referred_by', 'is', null),
    admin.from('affiliate_commissions')
      .select('id, affiliate_id, amount, type, description, created_at')
      .order('created_at', { ascending: false })
      .limit(500)
  ]);

  if (affErr) console.error('Error fetching affiliates:', affErr);

  // Group clicks by affiliate_id
  const clicksMap = {};
  (clicksRaw || []).forEach(c => {
    clicksMap[c.affiliate_id] = (clicksMap[c.affiliate_id] || 0) + 1;
  });

  // Group referred users by affiliate_id
  const referralsMap = {};
  (referredUsersRaw || []).forEach(u => {
    if (!referralsMap[u.referred_by]) referralsMap[u.referred_by] = [];
    referralsMap[u.referred_by].push({
      id: u.id,
      email: u.email,
      username: u.username,
      hasActiveSub: u.subscription_end_date ? new Date(u.subscription_end_date) > now : false,
      joinedAt: u.created_at
    });
  });

  // Group commissions by affiliate_id
  const commissionsMap = {};
  (commissionsRaw || []).forEach(c => {
    if (!commissionsMap[c.affiliate_id]) commissionsMap[c.affiliate_id] = [];
    commissionsMap[c.affiliate_id].push(c);
  });

  // Enrich each affiliate with performance metrics
  let totalClicks = (clicksRaw || []).length;
  let totalSignups = (referredUsersRaw || []).length;
  let totalPaidSubs = 0;
  let totalBalanceUnpaid = 0;
  let totalEarnedAll = 0;

  const enrichedAffiliates = (affiliates || []).map(a => {
    const clicks = clicksMap[a.id] || 0;
    const referredList = referralsMap[a.id] || [];
    const signups = referredList.length;
    const activeSubs = referredList.filter(u => u.hasActiveSub).length;
    totalPaidSubs += activeSubs;
    totalBalanceUnpaid += Number(a.balance || 0);
    totalEarnedAll += Number(a.total_earned || 0);

    const clickToSignupRate = clicks > 0 ? ((signups / clicks) * 100).toFixed(1) : '0';
    const signupToPaidRate = signups > 0 ? ((activeSubs / signups) * 100).toFixed(1) : '0';

    return {
      ...a,
      clicksCount: clicks,
      signupsCount: signups,
      activeSubsCount: activeSubs,
      clickToSignupRate,
      signupToPaidRate,
      referredList,
      commissions: commissionsMap[a.id] || []
    };
  });

  const overview = {
    totalPartners: enrichedAffiliates.length,
    totalClicks,
    totalSignups,
    totalPaidSubs,
    totalBalanceUnpaid,
    totalEarnedAll
  };

  return { config, affiliates: enrichedAffiliates, plans: plans || [], overview }
}

export async function updateSettings(formData) {
  const { admin } = await verifyAdmin()

  // Track checkboxes present in submitted form
  const formKeys = new Set(Array.from(formData.keys()))

  // If a specific section form was submitted, handle unchecked checkboxes
  if (formKeys.has('_section_boost')) {
    if (!formKeys.has('affiliate_boost_enabled')) {
      await admin.from('admin_settings').upsert({ setting_key: 'affiliate_boost_enabled', setting_value: 'false' }, { onConflict: 'setting_key' })
    }
  }
  if (formKeys.has('_section_cpa')) {
    if (!formKeys.has('affiliate_cpa_enabled')) {
      await admin.from('admin_settings').upsert({ setting_key: 'affiliate_cpa_enabled', setting_value: 'false' }, { onConflict: 'setting_key' })
    }
  }
  if (formKeys.has('_section_ppc')) {
    if (!formKeys.has('affiliate_ppc_enabled')) {
      await admin.from('admin_settings').upsert({ setting_key: 'affiliate_ppc_enabled', setting_value: 'false' }, { onConflict: 'setting_key' })
    }
  }

  for (const [key, val] of formData.entries()) {
    if (key.startsWith('affiliate_')) {
      await admin.from('admin_settings').upsert(
        { setting_key: key, setting_value: String(val).trim() },
        { onConflict: 'setting_key' }
      )
    }
  }

  revalidatePath('/admin/affiliates')
  revalidatePath('/account')
  revalidatePath('/account/referrals')
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
    revalidatePath('/account/referrals')
    return { success: true }
  } catch (err) {
    console.error('[approveAffiliate] error:', err)
    return { error: err.message || 'Server error approving affiliate' }
  }
}

export async function approveAllPending() {
  try {
    const { admin } = await verifyAdmin()

    const { data: pendingAffs, error: fetchErr } = await admin
      .from('affiliates')
      .select('id, user_id, referral_code, user_profiles!affiliates_user_id_fkey(username, email)')
      .eq('status', 'pending')

    if (fetchErr || !pendingAffs || pendingAffs.length === 0) {
      return { success: true, count: 0, message: 'No pending partner applications found.' }
    }

    const ids = pendingAffs.map(a => a.id)
    const { error: updateErr } = await admin
      .from('affiliates')
      .update({ status: 'approved' })
      .in('id', ids)

    if (updateErr) {
      console.error('[approveAllPending] update error:', updateErr)
      return { error: 'Failed to approve all pending applications' }
    }

    // Send support message notification to each approved partner
    for (const aff of pendingAffs) {
      try {
        let { data: thread } = await admin
          .from('support_threads')
          .select('id')
          .eq('user_id', aff.user_id)
          .maybeSingle()

        if (!thread) {
          const { data: newThread } = await admin
            .from('support_threads')
            .insert({ 
              user_id: aff.user_id, 
              subject: `Partner Program - @${aff.user_profiles?.username || 'User'}` 
            })
            .select('id')
            .single()
          thread = newThread
        }

        if (thread) {
          await admin.from('support_messages').insert({
            thread_id: thread.id,
            sender_role: 'admin',
            content: '🎉 Congratulations! Your partner application has been approved. Your custom referral link and dashboard are now live in your account under Referrals!',
            is_read: false
          })
        }
      } catch (e) {
        // Non-fatal
      }
    }

    revalidatePath('/admin/affiliates')
    revalidatePath('/account/referrals')
    return { success: true, count: pendingAffs.length }
  } catch (err) {
    console.error('[approveAllPending] error:', err)
    return { error: err.message || 'Server error approving all pending applications' }
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
    revalidatePath('/account/referrals')
    return { success: true }
  } catch (err) {
    console.error('[rejectAffiliate] error:', err)
    return { error: err.message || 'Server error rejecting affiliate' }
  }
}
