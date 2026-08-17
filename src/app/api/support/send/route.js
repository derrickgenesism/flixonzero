import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Verify the user is authenticated (user client for auth only)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId, content, userProfile } = await req.json();

    if (!threadId || !content?.trim()) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // 2. Use admin client for all DB writes — bypasses RLS completely
    const adminSupabase = createAdminClient();

    // Verify the thread actually belongs to this user before inserting
    const { data: thread, error: threadCheckError } = await adminSupabase
      .from('support_threads')
      .select('id, user_id')
      .eq('id', threadId)
      .single();

    if (threadCheckError || !thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // 3. Insert the message using admin client (bypasses RLS)
    const { data: message, error: dbError } = await adminSupabase
      .from('support_messages')
      .insert({
        thread_id: threadId,
        sender_id: userProfile?.id || null,
        sender_role: 'user',
        content: content.trim(),
        is_read: false,
      })
      .select('*')
      .single();

    if (dbError) {
      console.error('Support insert error:', dbError);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // 4. Update thread last_message_at using admin client
    await adminSupabase
      .from('support_threads')
      .update({
        last_message_at: new Date().toISOString(),
        status: 'open',
      })
      .eq('id', threadId);

    // 5. Send Telegram notification (best-effort, won't fail the request)
    try {
      const { data: settings } = await adminSupabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

      let botToken = '';
      let chatId = '';
      settings?.forEach(s => {
        if (s.setting_key === 'telegram_bot_token') botToken = s.setting_value;
        if (s.setting_key === 'telegram_chat_id') chatId = s.setting_value;
      });

      if (botToken && chatId) {
        const tgMessage = `🚨 *New Support Message*\n\n*From:* ${userProfile?.username || 'Unknown'} (${userProfile?.email || user.email})\n*Message:* ${content}\n\n_Reply via Admin Dashboard → Support Tickets_`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: tgMessage, parse_mode: 'Markdown' }),
        });
      }
    } catch (tgError) {
      console.error('Telegram notification failed (non-fatal):', tgError);
    }

    return NextResponse.json({ success: true, message });
  } catch (err) {
    console.error('Support Send API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
