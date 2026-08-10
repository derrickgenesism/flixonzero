'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function broadcastNotification(formData) {
  const title    = formData.get('title');
  const body     = formData.get('body');
  const link     = formData.get('link');
  const type     = formData.get('type') || 'general';
  const audience = formData.get('audience') || 'all';

  if (!title) return;

  if (audience === 'all') {
    // user_id = NULL means broadcast to everyone
    await supabase.from('notifications').insert({
      user_id: null,
      type,
      title,
      body: body || null,
      link: link || null,
      is_read: false
    });
  } else if (audience === 'subscribers') {
    // Fetch all active subscribers from user_profiles
    const now = new Date().toISOString();
    const { data: subscribers } = await supabase
      .from('user_profiles')
      .select('id')
      .gt('subscription_end_date', now);

    if (subscribers?.length > 0) {
      const notifications = subscribers.map(s => ({
        user_id: s.id,
        type,
        title,
        body: body || null,
        link: link || null,
        is_read: false
      }));
      // Insert in batches of 500
      for (let i = 0; i < notifications.length; i += 500) {
        await supabase.from('notifications').insert(notifications.slice(i, i + 500));
      }
    }
  }

  revalidatePath('/admin/notifications');
  redirect('/admin/notifications');
}
