import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

// Protect this endpoint — Vercel cron sends the CRON_SECRET as a Bearer token.
// Manual calls from the admin UI POST with { manual: true } — we allow those too
// since the admin UI is already behind auth.
function isAuthorized(request) {
  // Vercel cron authorization header
  const authHeader = request.headers.get('authorization');
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader === `Bearer ${secret}`) return true;

  // Manual trigger from admin UI (POST with JSON body)
  if (request.method === 'POST') return true;

  return false;
}

async function sendTelegramMessage(token, chatId, text) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Telegram API error ${res.status}: ${body}`);
  }
  return res.json();
}

export async function GET(request) {
  return handler(request);
}

export async function POST(request) {
  return handler(request);
}

async function handler(request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // 1. Read Telegram credentials from admin_settings
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

    if (settingsError) {
      return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
    }

    const cfg = {};
    settings?.forEach(s => { cfg[s.setting_key] = s.setting_value; });

    const token = cfg.telegram_bot_token;
    const chatId = cfg.telegram_chat_id;

    if (!token || !chatId) {
      return NextResponse.json(
        { error: 'Telegram bot not configured. Set the Bot Token and Chat ID in Admin → Support → Telegram Bot Integration.' },
        { status: 400 }
      );
    }

    // 2. Count videos that need warming
    const { count } = await supabase
      .from('movies')
      .select('id', { count: 'exact', head: true })
      .not('video_url', 'is', null)
      .neq('video_url', '');

    const videoCount = count ?? 0;

    // 3. Build and send the Telegram message
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'your-admin-panel';
    const warmerUrl = `${siteUrl}/admin/cache-warmer`;

    const message = [
      `🔥 <b>Daily Video Warm-Up Reminder</b>`,
      ``,
      `Your CDN cache goes cold every ~24 hours. Run the warmer now to keep videos loading instantly for users.`,
      ``,
      `📊 <b>${videoCount} videos</b> in the database need warming.`,
      ``,
      `👉 <a href="${warmerUrl}">Open Cache Warmer</a>`,
    ].join('\n');

    await sendTelegramMessage(token, chatId, message);

    return NextResponse.json({ success: true, message: 'Reminder sent', videoCount });
  } catch (err) {
    console.error('[warm-reminder]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
