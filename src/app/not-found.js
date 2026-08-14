import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import MovieRow from '@/components/MovieRow';
import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found — Flixon',
};

export default async function NotFound() {
  const supabase = await createClient();
  
  // Fetch recent movies
  const { data: recentMovies } = await supabase
    .from('movies')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(15);

  // Fetch free movies
  const { data: freeMovies } = await supabase
    .from('movies')
    .select('*')
    .eq('type', 'genesis_free_movie')
    .order('created_at', { ascending: false })
    .limit(15);

  // Fetch app download URL
  const { data: settingAppUrl } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'app_download_url')
    .single();
  const appDownloadUrl = settingAppUrl?.setting_value || '';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', paddingBottom: '20px' }}>
        <div style={{ textAlign: 'center', padding: '0 20px', marginBottom: '50px', maxWidth: '600px' }}>
          <div style={{ fontSize: '100px', marginBottom: '-20px' }}>🍿</div>
          <h1 style={{ fontSize: '60px', fontWeight: '900', color: 'var(--acc)', margin: '0 0 10px', lineHeight: '1' }}>404</h1>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#fff', margin: '0 0 15px' }}>Lost your way?</h2>
          <p style={{ color: 'var(--text2)', fontSize: '16px', margin: '0 auto 30px', lineHeight: '1.6' }}>
            It looks like you've wandered off the script! We couldn't find that page. You might have followed an old link, but don't worry—there's plenty of great content to watch right now.
          </p>
          <Link href="/" style={{
            display: 'inline-block',
            background: 'var(--acc)',
            color: '#fff',
            textDecoration: 'none',
            padding: '14px 36px',
            borderRadius: '30px',
            fontWeight: '700',
            fontSize: '16px',
            boxShadow: '0 4px 15px rgba(229, 9, 20, 0.4)'
          }}>
            Return to Homepage
          </Link>
        </div>

        <div style={{ width: '100%', position: 'relative', zIndex: 10, paddingBottom: '20px' }}>
          {recentMovies && recentMovies.length > 0 && (
            <MovieRow title="New Arrivals" movies={recentMovies} href="/?category=New Arrivals" />
          )}
          
          {freeMovies && freeMovies.length > 0 && (
            <MovieRow title="Watch For Free" movies={freeMovies} href="/?category=Free" />
          )}
        </div>

        {/* App Download Banner */}
        <div className="gms-app-banner" style={{ width: '100%' }}>
          <div>
            <h3 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: '800' }}>Watch Anywhere, Anytime</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text2)', fontSize: '15px' }}>Stream on your phone, tablet, or desktop with a single subscription.</p>
            <a href={appDownloadUrl || '#'} className="gms-app-banner-btn" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.32.07 2.23.73 3 .77 1.13-.16 2.2-.82 3.43-.77 1.5.07 2.58.69 3.3 1.71-3 1.88-2.51 5.7.27 6.97-.57 1.53-1.32 3.04-2 4.2zM12.03 7.25C11.79 5.12 13.55 3.38 15.62 3c.26 2.26-2.03 4.07-3.59 4.25z"/>
              </svg>
              Get the App
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
