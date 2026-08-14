'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function getSupportData() {
  const supabase = createAdminClient();

  // 1. Get Telegram Settings
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('*')
    .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

  const config = { telegram_bot_token: '', telegram_chat_id: '' };
  settings?.forEach(s => { config[s.setting_key] = s.setting_value });

  // 2. Get Threads
  const { data: threads } = await supabase
    .from('support_threads')
    .select('*, user_profiles(email, username), support_messages(is_read, sender_role)')
    .order('last_message_at', { ascending: false });

  const threadsWithUnread = threads?.map(t => {
    const unreadCount = t.support_messages?.filter(m => !m.is_read && m.sender_role === 'user').length || 0;
    // Don't send all messages to client, just the count
    const { support_messages, ...rest } = t;
    return { ...rest, unreadCount };
  }) || [];

  return { config, threads: threadsWithUnread };
}

export async function getThreadMessages(threadId) {
  const supabase = createAdminClient();
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  
  // Mark user messages as read
  await supabase
    .from('support_messages')
    .update({ is_read: true })
    .eq('thread_id', threadId)
    .eq('sender_role', 'user')
    .eq('is_read', false);

  return messages || [];
}

export async function replyToThread(threadId, content) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const supabaseAdmin = createAdminClient();

  // Insert admin reply
  const { error } = await supabaseAdmin
    .from('support_messages')
    .insert({
      thread_id: threadId,
      sender_id: null, // Admin
      sender_role: 'admin',
      content: content
    });

  if (error) return { error: error.message };

  // Update thread last_message_at
  await supabaseAdmin
    .from('support_threads')
    .update({ last_message_at: new Date().toISOString(), status: 'open' })
    .eq('id', threadId);

  revalidatePath('/admin/support');
  return { success: true };
}

export async function updateTelegramSettings(formData) {
  const supabase = createAdminClient();
  
  const token = formData.get('telegram_bot_token');
  const chatId = formData.get('telegram_chat_id');

  if (token !== null) {
    await supabase.from('admin_settings').update({ setting_value: token }).eq('setting_key', 'telegram_bot_token');
  }
  if (chatId !== null) {
    await supabase.from('admin_settings').update({ setting_value: chatId }).eq('setting_key', 'telegram_chat_id');
  }

  revalidatePath('/admin/support');
  return { success: true };
}

export async function deleteThread(threadId) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  const supabaseAdmin = createAdminClient();

  // Delete the thread (cascades to messages)
  const { error } = await supabaseAdmin
    .from('support_threads')
    .delete()
    .eq('id', threadId);

  if (error) return { error: error.message };

  revalidatePath('/admin/support');
  return { success: true };
}
