'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveSettings(formData) {
  const supabase = await createClient()

  const checkboxKeys = ['referrals_enabled', 'ppv_enabled', 'promo_enabled', 'profiles_enabled']
  const keys = [
    'tmdb_api_key',
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
    'profiles_enabled',
    'profiles_enabled',
    'free_profiles_limit',
    'extra_profile_price',
    'r2_account_id',
    'r2_access_key',
    'r2_secret_key',
    'r2_bucket_name',
    'cdn_domain'
  ]

  for (const key of keys) {
    let value = formData.get(key)

    // Checkboxes send 'on' when checked, null when not
    if (checkboxKeys.includes(key)) {
      value = value === 'on' ? 'true' : 'false'
    }

    await supabase
      .from('admin_settings')
      .upsert({ setting_key: key, setting_value: value ?? '' }, { onConflict: 'setting_key' })
  }

  // Handle homepage sections manually since they are dynamic
  const hpSections = {};
  ['Continue Watching', 'My List', 'Trending', 'New Arrivals', 'Latest 2026', 'Free', 'Top Rated', 'Premium Exclusives', 'Popular Series', 'Coming Soon'].forEach(section => {
    hpSections[section] = formData.get(`hp_section_${section}`) === 'on';
  });

  await supabase
    .from('admin_settings')
    .upsert({ setting_key: 'homepage_sections', setting_value: JSON.stringify(hpSections) }, { onConflict: 'setting_key' })

  revalidatePath('/admin/settings')
}
