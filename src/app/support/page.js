import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import SupportClient from './SupportClient';

export const metadata = {
  title: 'Support — Flixon',
};

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, username, email')
    .eq('email', user.email)
    .single();

  if (!profile) redirect('/');

  // Get or Create Support Thread
  let { data: thread } = await supabase
    .from('support_threads')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (!thread) {
    const { data: newThread } = await supabase
      .from('support_threads')
      .insert({
        user_id: profile.id,
        subject: `Support Request - ${profile.username}`,
      })
      .select('*')
      .single();
    thread = newThread;
  }

  // Get Messages
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  return <SupportClient initialMessages={messages || []} threadId={thread.id} userProfile={profile} />;
}
