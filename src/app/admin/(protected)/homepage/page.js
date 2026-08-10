import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import HomepageClient from './HomepageClient';

export default async function AdminHomepageLayoutPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator') {
    return (
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text2)' }}>You do not have permission to manage the homepage layout.</p>
      </div>
    );
  }

  // Fetch current setting
  const { data: setting } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'homepage_categories')
    .single();

  let activeCategories = [];
  try {
    if (setting?.setting_value) {
      activeCategories = JSON.parse(setting.setting_value);
    }
  } catch(e) {
    console.error("Failed to parse homepage_categories");
  }

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Homepage Layout</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Select which categories you want to display on the homepage, and re-arrange them in any order you like.
        <br />
        <small style={{ color: 'var(--acc)' }}>Note: 'Continue Watching' and 'Latest Movies 2026' are pinned to the top automatically.</small>
      </p>

      <HomepageClient initialActiveCategories={activeCategories} />
    </div>
  );
}
