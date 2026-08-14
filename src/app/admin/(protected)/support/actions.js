'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSupportData() {
  const supabase = await createClient();

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
    .select('*, user_profiles(email, username)')
    .order('last_message_at', { ascending: false });

  return { config, threads: threads || [] };
}

export async function getThreadMessages(threadId) {
  const supabase = await createClient();
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true });
  
  return messages || [];
}

export async function replyToThread(threadId, content) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Unauthorized' };

  // Insert admin reply
  const { error } = await supabase
    .from('support_messages')
    .insert({
      thread_id: threadId,
      sender_id: user.id,
      sender_role: 'admin',
      content: content
    });

  if (error) return { error: error.message };

  // Update thread last_message_at
  await supabase
    .from('support_threads')
    .update({ last_message_at: new Date().toISOString(), status: 'open' })
    .eq('id', threadId);

  revalidatePath('/admin/support');
  return { success: true };
}

export async function updateTelegramSettings(formData) {
  const supabase = await createClient();
  
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
