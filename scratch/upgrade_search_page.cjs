const fs = require('fs');
let file = 'src/app/search/page.js';

const content = `import { searchMoviesPage } from '@/app/actions/fetchMovies';
import Navbar from '@/components/Navbar';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import SearchInput from '@/components/SearchInput';
import Link from 'next/link';

export const metadata = { title: 'Search ?" Flixon' };

const CATEGORIES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Adventure', 'Animation', 'Crime', 'Documentary', 'Family', 'Fantasy'];
const VJS = ['VJ Junior', 'VJ Emmy', 'VJ ICE P', 'VJ Jingo', 'VJ Mark', 'VJ Kamil'];

export default async function SearchPage({ searchParams }) {
  const params = await searchParams;
  const query = params?.q || '';

  let movies = [];
  let totalCount = 0;
  if (query) {
    const res = await searchMoviesPage(query, 0, 24);
    movies = res.movies;
    totalCount = res.total;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '80px' }}>
      <Navbar />
      
      <div style={{ paddingTop: '90px', maxWidth: '1200px', margin: '0 auto', padding: '90px 20px 0' }}>
        
        {/* MASSIVE UPGRADED SEARCH HEADER */}
        <div style={{ background: 'linear-gradient(180deg, rgba(229,9,20,0.1) 0%, rgba(10,10,10,0) 100%)', borderRadius: '24px', padding: '40px 20px', textAlign: 'center', marginBottom: '40px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#fff', marginBottom: '12px' }}>
            Find Your Next Favorite
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '16px', marginBottom: '32px' }}>
            Search for movies, series, VJ translations, and more.
          </p>
          <div style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'left' }}>
            <SearchInput />
          </div>
        </div>

        {/* Search Results OR Explore Section */}
        {query ? (
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              Search results for "{query}"
            </h2>
            <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>
              {movies.length} {movies.length === 1 ? 'result' : 'results'} found
            </p>
            {movies.length > 0 ? (
              <PaginatedMovieGrid 
                initialMovies={movies} 
                totalCount={totalCount} 
                fetchAction={searchMoviesPage} 
                actionArg={query} 
              />
            ) : (
              <div style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg2)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
                <svg style={{ margin: '0 auto 16px', color: 'var(--text3)' }} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>No matches found</h3>
                <p style={{ color: 'var(--text3)' }}>Try searching for a different title, genre, or VJ.</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* Free Movies Callout */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(90deg, #166534 0%, #064e3b 100%)', padding: '24px 32px', borderRadius: '16px', border: '1px solid #4ade8040' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#4ade80', margin: '0 0 8px 0' }}>Watch Free Movies</h2>
                <p style={{ color: '#a7f3d0', fontSize: '15px', margin: 0 }}>Enjoy a selection of premium movies completely for free. No subscription required.</p>
              </div>
              <Link href="/category/Free%20to%20Watch" className="gms-btn" style={{ background: '#4ade80', color: '#064e3b', fontWeight: '800', padding: '12px 24px', fontSize: '15px', flexShrink: 0 }}>
                Explore Free Movies
              </Link>
            </div>

            {/* VJs Section */}
            <section>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '4px', height: '24px', background: 'var(--acc)', borderRadius: '2px' }}></span>
                Top VJ Translators
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px' }}>
                {VJS.map(vj => (
                  <Link key={vj} href={`/category/${encodeURIComponent(vj)}`} style={{ background: 'var(--bg2)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border)', transition: 'var(--tr)', textDecoration: 'none' }} className="hover-lift">
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg3)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                      Z
                    </div>
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '15px' }}>{vj}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Categories Section */}
            <section>
              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ width: '4px', height: '24px', background: 'var(--acc)', borderRadius: '2px' }}></span>
                Browse by Genre
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {CATEGORIES.map(cat => (
                  <Link key={cat} href={`/category/${encodeURIComponent(cat)}`} style={{ padding: '12px 24px', background: 'var(--bg2)', borderRadius: '30px', color: '#fff', fontSize: '14px', fontWeight: '600', border: '1px solid var(--border)', transition: 'var(--tr)', textDecoration: 'none' }} className="hover-lift">
                    {cat}
                  </Link>
                ))}
              </div>
            </section>

          </div>
        )}
      </div>
      
      <style>{`
        .hover-lift:hover {
          transform: translateY(-4px);
          border-color: var(--acc);
          background: rgba(229,9,20,0.05) !important;
        }
        @media (max-width: 768px) {
          .flx-search-dropdown { width: 100% !important; right: 0; left: 0; }
        }
      `}</style>
    </div>
  );
}
`;

fs.writeFileSync(file, content);
console.log('Massive upgrade for SearchPage completed');
