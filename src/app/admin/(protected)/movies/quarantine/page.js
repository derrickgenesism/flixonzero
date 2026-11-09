import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import QuarantineClient from './QuarantineClient';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export const metadata = {
  title: 'Quarantined Movies — FlixOn Admin',
};

export default async function QuarantinePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .maybeSingle();

  if (profile?.role !== 'administrator') {
    return (
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text2)' }}>Only administrators can view quarantined movies.</p>
      </div>
    );
  }

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: movies, error } = await admin
    .from('movies')
    .select('id, title, type, video_url, thumbnail_url, created_at, description')
    .eq('type', 'broken_quarantine')
    .order('created_at', { ascending: false });

  if (error) {
    return (
      <div style={{ color: '#ff6b6b', padding: '20px', background: 'rgba(255,107,107,0.1)', borderRadius: '8px' }}>
        <h2>Error loading quarantined movies</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  // Categorise by source
  const categorised = (movies || []).map(m => {
    let source = 'Unknown';
    let sourceBadge = '#888';
    if (!m.video_url) {
      source = 'No URL';
      sourceBadge = '#666';
    } else if (m.video_url.includes('jimmy.pearlpix.xyz')) {
      source = 'pearlpix (deleted)';
      sourceBadge = '#e50914';
    } else if (m.video_url.includes('r2.dev')) {
      source = 'Cloudflare R2';
      sourceBadge = '#f97316';
    } else if (m.video_url.includes('cdn.flixon.net') || m.video_url.includes('backblaze')) {
      source = 'FlixOn B2 (OK)';
      sourceBadge = '#4ade80';
    }
    return { ...m, source, sourceBadge };
  });

  const stats = {
    total: categorised.length,
    pearlpix: categorised.filter(m => m.source === 'pearlpix (deleted)').length,
    r2: categorised.filter(m => m.source === 'Cloudflare R2').length,
    noUrl: categorised.filter(m => m.source === 'No URL').length,
  };

  return <QuarantineClient movies={categorised} stats={stats} />;
}
