import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId, content, userProfile } = await req.json();

    if (!threadId || !content) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 1. Save to DB
    const { data: message, error: dbError } = await supabase
      .from('support_messages')
      .insert({
        thread_id: threadId,
        sender_id: userProfile.id,
        sender_role: 'user',
        content: content
      })
      .select('*')
      .single();

    if (dbError) {
      throw dbError;
    }

    // 2. Fetch Telegram Settings
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

    let botToken = '';
    let chatId = '';

    settings?.forEach(s => {
      if (s.setting_key === 'telegram_bot_token') botToken = s.setting_value;
      if (s.setting_key === 'telegram_chat_id') chatId = s.setting_value;
    });

    // 3. Send to Telegram
    if (botToken && chatId) {
      const tgMessage = `🚨 *New Support Message*\n\n*From:* ${userProfile?.username || 'Unknown'} (${userProfile?.email || user.email})\n*Message:* ${content}\n\n_Reply via Admin Dashboard_`;
      
      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: tgMessage,
            parse_mode: 'Markdown'
          })
        });
      } catch (tgError) {
        console.error('Failed to send to telegram:', tgError);
        // We don't fail the whole request if telegram fails
      }
    }

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error('Support Send API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
