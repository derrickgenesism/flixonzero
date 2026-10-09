'use server'
const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logSecurityEvent } from '@/utils/securityLogger';

export async function saveSettings(formData) {
  const supabase = await createClient()

  // SECURITY PATCH: Verify admin status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    await logSecurityEvent('UNAUTHORIZED_ACCESS', 'HIGH', 'Attempt to access saveSettings action without authentication', {});
    throw new Error("Unauthorized");
  }
  
  const { data: adminCheck } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();
    
  if (adminCheck?.role !== 'administrator') {
    await logSecurityEvent('ROLE_ESCALATION_ATTEMPT', 'CRITICAL', `User ${user.email} attempted to save admin settings but is not an administrator`, { email: user.email, actualRole: adminCheck?.role });
    throw new Error("Forbidden");
  }

  const checkboxKeys = ['free_mode_enabled', 'referrals_enabled', 'ppv_enabled', 'promo_enabled', 'profiles_enabled', 'series_enabled', 'google_auth_enabled']
  const keys = [
    'free_mode_enabled',
    'tmdb_api_key',
    'app_download_url',
    'flutterwave_public_key',
    'flutterwave_secret_key',
    'flutterwave_webhook_secret',
    'referrals_enabled',
    'referral_reward_type',
    'referral_reward_amount',
    'referral_ugx_per_day',
    'ppv_enabled',
    'ppv_price',
    'promo_enabled',
    'profiles_enabled',
    'free_profiles_limit',
    'extra_profile_price',
    'r2_account_id',
    'r2_access_key',
    'r2_secret_key',
    'r2_bucket_name',
    'cdn_domain',
    'series_enabled'
  ]

  for (const key of keys) {
    let value = formData.get(key)

    // Checkboxes send 'on' when checked, null when not
    if (checkboxKeys.includes(key)) {
      value = value === 'on' ? 'true' : 'false'
    }

    await _injectedAdminClient().from('admin_settings')
      .upsert({ setting_key: key, setting_value: value ?? '' }, { onConflict: 'setting_key' })
  }

  // Handle homepage sections manually since they are dynamic
  const hpSections = {};
  ['Continue Watching', 'My List', 'Trending', 'New Arrivals', 'Latest 2026', 'Free', 'Top Rated', 'Premium Exclusives', 'Popular Series', 'Coming Soon'].forEach(section => {
    hpSections[section] = formData.get(`hp_section_${section}`) === 'on';
  });

  await _injectedAdminClient().from('admin_settings')
    .upsert({ setting_key: 'homepage_sections', setting_value: JSON.stringify(hpSections) }, { onConflict: 'setting_key' })

  await logSecurityEvent('SETTINGS_CHANGED', 'LOW', `Admin ${user.email} updated platform settings`, { email: user.email });
  revalidatePath('/admin/settings')
}
