import { createClient } from '@/utils/supabase/server'
import TMDBImporterClient from './TMDBImporterClient'

export default async function AdminTMDBPage({ searchParams }) {
  const params = await searchParams;
  const sort = params?.sort || 'missing';

  const supabase = await createClient()

  // Fetch API key
  const { data: settings } = await supabase.from('admin_settings').select('*')
  const tmdbKey = settings?.find(s => s.setting_key === 'tmdb_api_key')?.setting_value || ''

  let query = supabase.from('movies').select('id, title, thumbnail_url, description');

  if (sort === 'missing') {
    query = query.order('description', { ascending: true, nullsFirst: true }).order('created_at', { ascending: true });
  } else if (sort === 'latest') {
    query = query.order('created_at', { ascending: false });
  } else if (sort === 'oldest') {
    query = query.order('created_at', { ascending: true });
  }

  // Fetch movies
  const { data: movies } = await query.limit(500);

  if (!tmdbKey) {
    return (
      <div>
        <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>TMDB Importer</h1>
        <div style={{ background: '#e50914', padding: '20px', borderRadius: '8px', color: '#fff' }}>
          <strong>Missing API Key:</strong> Please go to Settings & API Keys and add your TMDB API Key first!
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>TMDB Movie Importer</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Search TMDB for official posters, descriptions, and metadata to instantly update your existing movies.
      </p>

      <TMDBImporterClient movies={movies || []} apiKey={tmdbKey} />
    </div>
  )
}
