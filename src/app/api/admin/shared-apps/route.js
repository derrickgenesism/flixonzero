import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

const DEFAULT_STARTER_APPS = [
  {
    id: 'vidmate',
    name: 'Vidmate No Ads',
    version: 'v5.24',
    category: 'Video Downloader',
    badge: 'MOD / NO ADS',
    file_size: '22.4 MB',
    file_url: 'https://upload.am/d/87bf7216-c9a0-4cff-bb67-9e5eb24c2b11',
    storage_key: '',
    storage_provider: 'b2',
    gradient: 'linear-gradient(135deg, #f43f5e, #fb923c)',
    icon_svg: 'download',
    description: 'Download HD videos from YouTube, TikTok, Facebook, Instagram & 1,000+ sites with zero ads.',
    download_count: 1840,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'snaptube',
    name: 'Snaptube VIP',
    version: 'v7.12',
    category: 'Video & Audio',
    badge: 'FAST DL',
    file_size: '28.1 MB',
    file_url: 'https://upload.am/d/009cfa07-1420-45a6-ae99-fd99fb03d4cb',
    storage_key: '',
    storage_provider: 'b2',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    icon_svg: 'bolt',
    description: 'High-speed 4K & MP3 converter. Download audio and video streams instantly in one tap.',
    download_count: 1420,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'seal',
    name: 'Seal downloader',
    version: 'v1.12.1',
    category: 'Open Source',
    badge: 'CLEAN UI',
    file_size: '34.8 MB',
    file_url: 'https://upload.am/d/c12d5465-a4ef-43f3-8fc9-d46105785473',
    storage_key: '',
    storage_provider: 'b2',
    gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
    icon_svg: 'shield',
    description: 'Material You yt-dlp downloader for Android with custom formats, subtitle extraction, and zero trackers.',
    download_count: 980,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'blackhole',
    name: 'BlackHole v48 (Premium).apk',
    version: 'v48 (Premium)',
    category: 'Music & Audio',
    badge: 'PREMIUM',
    file_size: '19.2 MB',
    file_url: 'https://upload.am/d/4408fbea-9060-4a5c-839c-bad085e4fa65',
    storage_key: '',
    storage_provider: 'b2',
    gradient: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    icon_svg: 'circle',
    description: 'High-fidelity music streaming and offline downloader with 320kbps audio quality and lyrics support.',
    download_count: 2150,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: setting } = await admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_apps_list')
      .maybeSingle();

    let apps = null;
    if (setting?.setting_value) {
      try {
        apps = JSON.parse(setting.setting_value);
      } catch (_) {}
    }

    if (!Array.isArray(apps) || apps.length === 0) {
      apps = DEFAULT_STARTER_APPS;
      // Auto-save default starter apps
      await admin.from('admin_settings').upsert({
        setting_key: 'shared_apps_list',
        setting_value: JSON.stringify(apps)
      }, { onConflict: 'setting_key' });
    }

    return NextResponse.json({ success: true, apps });
  } catch (err) {
    console.error('Error fetching shared apps:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { apps } = body || {};

    if (!Array.isArray(apps)) {
      return NextResponse.json({ error: 'Invalid apps data format' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { error } = await admin.from('admin_settings').upsert({
      setting_key: 'shared_apps_list',
      setting_value: JSON.stringify(apps)
    }, { onConflict: 'setting_key' });

    if (error) throw error;

    return NextResponse.json({ success: true, apps });
  } catch (err) {
    console.error('Error saving shared apps:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
