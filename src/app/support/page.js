import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import SupportClient from './SupportClient';

export const metadata = {
  title: 'Support — Flixon',
};

export default async function SupportPage() {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  // Auth check using user client
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user profile — use user client (fine, reading own profile)
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, username, email')
    .eq('email', user.email)
    .single();

  if (!profile) redirect('/');

  // Get or Create Support Thread — use admin client to bypass RLS
  let { data: thread, error: fetchError } = await adminSupabase
    .from('support_threads')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error('Thread fetch error:', fetchError);
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--bg2)', padding: '32px', borderRadius: '12px', textAlign: 'center', maxWidth: '400px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>Database Not Configured</h2>
            <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.5' }}>
              The support feature requires a database update. Please ask the administrator to run the setup script in Supabase.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!thread) {
    // Create new thread using admin client to ensure it always succeeds
    const { data: newThread, error: insertError } = await adminSupabase
      .from('support_threads')
      .insert({
        user_id: profile.id,
        subject: `Support Request - ${profile.username || profile.email}`,
        status: 'open',
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Thread create error:', insertError);
      return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'red' }}>
            Failed to create support thread: {insertError.message}
          </main>
        </div>
      );
    }
    thread = newThread;

    // Send welcome message from Admin using admin client
    await adminSupabase
      .from('support_messages')
      .insert({
        thread_id: thread.id,
        sender_role: 'admin',
        sender_id: null,
        content: 'Hi! Welcome to FlixOn Support. How can we help you today? Feel free to ask about your account, subscription, payments, or any technical issues.',
        is_read: false,
      });
  }

  // Fetch messages using admin client — ensures all messages always load
  const { data: messages, error: msgError } = await adminSupabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  if (msgError) {
    console.error('Messages fetch error:', msgError);
  }

  // Mark admin messages as read (user has seen them)
  await adminSupabase
    .from('support_messages')
    .update({ is_read: true })
    .eq('thread_id', thread.id)
    .eq('sender_role', 'admin')
    .eq('is_read', false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <SupportClient initialMessages={messages || []} threadId={thread.id} userProfile={profile} />
    </div>
  );
}
