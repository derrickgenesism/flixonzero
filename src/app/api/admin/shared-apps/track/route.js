import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action = 'download', appId, movieId, movieTitle, referrer, visitorId } = body || {};

    const admin = createAdminClient();
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const effectiveReferrer = referrer || request.headers.get('referer') || null;

    // A. Track Movie Click from Downloads
    if (action === 'movie_click' || movieId) {
      try {
        await admin.from('site_visits').insert({
          visitor_id: visitorId || crypto.randomUUID(),
          session_id: crypto.randomUUID(),
          path: `/downloads/movie-click/${movieId || 'free-catalog'}`,
          referrer: effectiveReferrer || 'https://flixon.net/downloads',
          user_agent: userAgent
        });
      } catch (logErr) {
        console.warn('Failed to log movie click visit:', logErr.message);
      }
      return NextResponse.json({ success: true, action: 'movie_click', movieId });
    }

    // B. Track External Embed View (e.g. Blogger widget)
    if (action === 'embed_view') {
      try {
        await admin.from('site_visits').insert({
          visitor_id: visitorId || crypto.randomUUID(),
          session_id: crypto.randomUUID(),
          path: '/downloads/blogger-embed',
          referrer: effectiveReferrer,
          user_agent: userAgent
        });
      } catch (logErr) {
        console.warn('Failed to log embed view visit:', logErr.message);
      }
      return NextResponse.json({ success: true, action: 'embed_view' });
    }

    // C. Default: Track APK Download
    if (!appId) {
      return NextResponse.json({ error: 'App ID is required' }, { status: 400 });
    }

    // 1. Increment download count in admin_settings -> shared_apps_list
    const { data: setting } = await admin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'shared_apps_list')
      .maybeSingle();

    let updatedCount = 0;
    if (setting?.setting_value) {
      let apps = [];
      try {
        apps = JSON.parse(setting.setting_value);
      } catch (_) {}

      if (Array.isArray(apps)) {
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
          setting_value: JSON.stringify(updatedApps)
        }, { onConflict: 'setting_key' });
      }
    }

    // 2. Also log download event to site_visits so it appears in analytics stream
    try {
      await admin.from('site_visits').insert({
        visitor_id: visitorId || crypto.randomUUID(),
        session_id: crypto.randomUUID(),
        path: `/downloads/download-started/${appId}`,
        referrer: effectiveReferrer || 'https://flixon.net/downloads',
        user_agent: userAgent
      });
    } catch (logErr) {
      console.warn('Failed to log download-started visit:', logErr.message);
    }

    return NextResponse.json({ success: true, appId, count: updatedCount });
  } catch (err) {
    console.error('Download tracker error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
