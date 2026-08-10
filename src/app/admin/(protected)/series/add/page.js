import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AddSeriesClient from './AddSeriesClient';
import { fetchTMDbApiKey } from '../../movies/add/actions';

export const metadata = { title: 'Add Series — Flixon Admin' };

export default async function AddSeriesPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
    return (
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>Access Denied</h1>
        <p style={{ color: 'var(--text2)' }}>You do not have permission to add series.</p>
      </div>
    );
  }

  const tmdbApiKey = await fetchTMDbApiKey();

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>Create New Series</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Create a series container. You can add individual episodes to this series later.
      </p>

      {tmdbApiKey ? (
        <AddSeriesClient tmdbApiKey={tmdbApiKey} />
      ) : (
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '20px', borderRadius: '8px', color: '#fff' }}>
          <h3 style={{ margin: '0 0 10px', color: '#e50914' }}>Missing TMDB API Key</h3>
          <p style={{ margin: 0 }}>You must configure your TMDB API Key in the Settings page before you can use the Smart Add tool.</p>
        </div>
      )}
    </div>
  );
}
