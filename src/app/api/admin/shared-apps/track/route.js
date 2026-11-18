import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { appId } = body || {};

    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: setting } = await admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_apps_list')
      .maybeSingle();

    if (!setting?.setting_value) {
      return NextResponse.json({ success: true });
    }

    let apps = [];
    try {
      apps = JSON.parse(setting.setting_value);
    } catch (_) {}

    if (!Array.isArray(apps)) {
      return NextResponse.json({ success: true });
    }

    let updatedCount = 0;
    const updatedApps = apps.map(app => {
      if (app.id === appId) {
        updatedCount = (app.download_count || 0) + 1;
        return {
          ...app,
          download_count: updatedCount
        };
      }
      return app;
    });

    await admin.from('admin_settings').upsert({
      setting_key: 'shared_apps_list',
      setting_value: JSON.stringify(updatedApps),
      updated_at: new Date().toISOString()
    }, { onConflict: 'setting_key' });

    return NextResponse.json({ success: true, appId, count: updatedCount });
  } catch (err) {
    console.error('Download tracker error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
