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
  let { data: thread, error: fetchError } = await supabase
    .from('support_threads')
    .select('*')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (fetchError && fetchError.code !== 'PGRST116') {
    // Possibly table doesn't exist yet
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
    const { data: newThread, error: insertError } = await supabase
      .from('support_threads')
      .insert({
        user_id: profile.id,
        subject: `Support Request - ${profile.username}`,
      })
      .select('*')
      .single();
      
    if (insertError) {
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

    // Send the default welcome message from Admin
    await adminSupabase
      .from('support_messages')
      .insert({
        thread_id: thread.id,
        sender_role: 'admin',
        content: 'Hi! Welcome to Flixon. Let me know if you need any help with your account, payments, or have any other issues.',
        is_read: false
      });
  }

  // Get Messages
  const { data: messages } = await supabase
    .from('support_messages')
    .select('*')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });

  // Mark unread messages from admin as read
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
