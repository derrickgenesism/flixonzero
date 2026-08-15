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
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['homepage_categories', 'homepage_sections']);

  let activeCategories = [];
  let activeSections = {};
  
  settings?.forEach(setting => {
    try {
      if (setting.setting_key === 'homepage_categories' && setting.setting_value) {
        activeCategories = JSON.parse(setting.setting_value);
      }
      if (setting.setting_key === 'homepage_sections' && setting.setting_value) {
        activeSections = JSON.parse(setting.setting_value);
      }
    } catch(e) {
      console.error(`Failed to parse ${setting.setting_key}`);
    }
  });

  return (
    <div>
      <h1 style={{ fontSize: '32px', margin: '0 0 10px 0' }}>Homepage Layout</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Select which categories and sections you want to display on the homepage. You can re-arrange dynamic categories in any order.
      </p>

      <HomepageClient initialActiveCategories={activeCategories} initialSections={activeSections} />
    </div>
  );
}
