import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ProfileFormClient from './ProfileFormClient';

export const metadata = { title: 'Profile Settings — Flixon' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('email', user.email)
    .single();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ paddingTop: '100px', paddingBottom: '60px', maxWidth: '600px', margin: '0 auto', padding: '100px 24px 60px' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <Link href="/account" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>←</span> Back to Account
          </Link>
          <h1 style={{ fontSize: '32px', fontWeight: '900', marginTop: '16px', marginBottom: '8px' }}>Profile Settings</h1>
          <p style={{ color: 'var(--text2)', margin: 0 }}>Manage your personal details and security preferences.</p>
        </div>

        <ProfileFormClient user={user} profile={profile} />

      </main>
    </div>
  );
}
