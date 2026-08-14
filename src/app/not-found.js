import { createClient } from '@/utils/supabase/server';
import Navbar from '@/components/Navbar';
import MovieRow from '@/components/MovieRow';
import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found — Flixon',
};

export default async function NotFound() {
  const supabase = await createClient();
  
  // Fetch some trending movies to keep them engaged
  const { data: movies } = await supabase
    .from('movies')
    .select('*')
    .order('view_count', { ascending: false })
    .limit(15);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '100px', paddingBottom: '60px' }}>
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

        <div style={{ width: '100%', position: 'relative', zIndex: 10 }}>
          {movies && movies.length > 0 && (
            <MovieRow title="Keep Watching: Popular Right Now" movies={movies} />
          )}
        </div>
      </main>
    </div>
  );
}
