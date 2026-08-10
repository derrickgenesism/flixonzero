import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
import { fetchFavoritesPage } from '@/app/actions/fetchMovies';
import Navbar from '@/components/Navbar';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const metadata = { title: 'My List — Flixon' };

export default async function MyListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const profile = await getActiveProfile();
  if (!profile) redirect('/profiles');

  const { movies, total } = await fetchFavoritesPage(profile.id, 0, 24);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ paddingTop: '88px', maxWidth: '1200px', margin: '0 auto', padding: '88px 40px 60px' }}>
        <div style={{ marginBottom: '36px' }}>
          <Link href="/" style={{ color: 'var(--text3)', textDecoration: 'none', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
            ← Back to Home
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ width: '56px', height: '56px', background: 'rgba(229,9,20,0.1)', border: '2px solid rgba(229,9,20,0.3)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px' }}>
              ❤️
            </div>
            <div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: '900', margin: '0 0 6px', color: '#fff' }}>My List</h1>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--text3)' }}>
                {movies.length} saved title{movies.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {movies.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎬</div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '12px', color: '#fff' }}>Your list is empty</h2>
            <p style={{ fontSize: '15px', color: 'var(--text3)', maxWidth: '380px', margin: '0 auto 28px' }}>
              Browse movies and tap the heart icon to save titles you want to watch later.
            </p>
            <Link href="/" className="gms-btn gms-btn--primary" style={{ display: 'inline-block' }}>
              Explore Movies
            </Link>
          </div>
        ) : (
          <PaginatedMovieGrid 
            initialMovies={movies} 
            totalCount={total} 
            fetchAction={fetchFavoritesPage} 
            actionArg={profile.id} 
          />
        )}
      </main>
    </div>
  );
}
