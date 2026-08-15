'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function saveHomepageSettings(categories, sections) {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const supabaseAuth = await createClient(); // Verify caller is admin
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const { data: profile } = await supabaseAuth
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator') {
    return { error: 'Access Denied: Admin only.' };
  }

  // UPSERT the settings
  const { error } = await supabaseAdmin
    .from('admin_settings')
    .upsert([
      { setting_key: 'homepage_categories', setting_value: JSON.stringify(categories) },
      { setting_key: 'homepage_sections', setting_value: JSON.stringify(sections) }
    ], { onConflict: 'setting_key' });

  if (error) {
    console.error("Save settings error:", error);
    return { error: 'Failed to save layout.' };
  }

  return { success: true };
}
