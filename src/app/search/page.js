import { searchMoviesPage } from '@/app/actions/fetchMovies';
import Navbar from '@/components/Navbar';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import SearchInput from '@/components/SearchInput';
import Link from 'next/link';

export const metadata = { title: 'Search - Flixon' };

const CATEGORIES = ['Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Romance', 'Thriller', 'Adventure', 'Animation', 'Crime', 'Documentary', 'Family', 'Fantasy'];
const VJS = ['VJ Junior', 'VJ Emmy', 'VJ Ice P', 'VJ Jingo', 'VJ Mark', 'VJ Kamil'];

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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: '40px' }}>
      <Navbar />
      
      <div style={{ paddingTop: '80px', maxWidth: '1200px', margin: '0 auto', padding: '80px 20px 0' }}>
        
        {/* COMPACT BUT BRIGHT SEARCH HEADER */}
        <div style={{ background: 'linear-gradient(180deg, rgba(229,9,20,0.05) 0%, rgba(10,10,10,0) 100%)', borderRadius: '16px', padding: '20px', textAlign: 'center', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.03)' }}>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Find Your Next Favorite
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '16px' }}>
            Search for movies, series, or VJ translations
          </p>
          <div className="search-page-input-wrapper" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'left' }}>
            <SearchInput />
          </div>
        </div>

        {/* Search Results OR Explore Section */}
        {query ? (
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: '#fff' }}>
              Search results for &quot;{query}&quot;
            </h2>
            <p style={{ color: 'var(--text2)', marginBottom: '24px', fontSize: '14px' }}>
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
              <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg2)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
                <svg style={{ margin: '0 auto 12px', color: 'var(--text3)' }} width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3 style={{ color: '#fff', fontSize: '18px', marginBottom: '8px' }}>No matches found</h3>
                <p style={{ color: 'var(--text3)', fontSize: '14px' }}>Try searching for a different title, genre, or VJ.</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* COMPACT Free Movies Callout */}
            <div className="search-free-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5V19L19 12L8 5Z" /></svg>
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#4ade80', margin: '0 0 2px 0' }}>Watch Free Movies</h2>
                  <p style={{ color: '#a7f3d0', fontSize: '13px', margin: 0 }}>Enjoy premium movies completely for free.</p>
                </div>
              </div>
              <Link href="/category/Free%20to%20Watch" className="gms-btn" style={{ background: '#4ade80', color: '#064e3b', fontWeight: '800', padding: '8px 16px', fontSize: '13px', flexShrink: 0, textDecoration: 'none' }}>
                Explore Free Movies
              </Link>
            </div>

            {/* VJs Section */}
            <section>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '3px', height: '18px', background: 'var(--acc)', borderRadius: '2px' }}></span>
                Top VJ Translators
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px' }}>
                {VJS.map(vj => (
                  <Link key={vj} href={/category/ + encodeURIComponent(vj)} style={{ background: 'var(--bg2)', padding: '12px', borderRadius: '10px', textAlign: 'center', border: '1px solid var(--border)', transition: 'var(--tr)', textDecoration: 'none' }} className="hover-lift">
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg3)', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                      🎙️
                    </div>
                    <span style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>{vj}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Categories Section */}
            <section>
              <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '3px', height: '18px', background: 'var(--acc)', borderRadius: '2px' }}></span>
                Browse by Genre
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <Link key={cat} href={/category/ + encodeURIComponent(cat)} style={{ padding: '8px 16px', background: 'var(--bg2)', borderRadius: '20px', color: '#fff', fontSize: '13px', fontWeight: '600', border: '1px solid var(--border)', transition: 'var(--tr)', textDecoration: 'none' }} className="hover-lift">
                    {cat}
                  </Link>
                ))}
              </div>
            </section>

          </div>
        )}
      </div>
      
      <style>{`
        /* Make the search bar input glow brightly on the search page */
        .search-page-input-wrapper .flx-search-bar {
          border: 2px solid var(--acc) !important;
          box-shadow: 0 0 12px rgba(229, 9, 20, 0.4), inset 0 0 8px rgba(229, 9, 20, 0.2) !important;
          background: rgba(0, 0, 0, 0.6) !important;
          height: 48px;
        }
        .search-page-input-wrapper .flx-search-bar input {
          font-size: 16px;
          color: #fff;
        }
        .search-page-input-wrapper .flx-search-bar svg {
          color: var(--acc) !important;
        }

        .search-free-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: linear-gradient(90deg, #166534 0%, #064e3b 100%);
          padding: 12px 20px;
          border-radius: 12px;
          border: 1px solid #4ade8040;
          gap: 16px;
        }
        @media (max-width: 768px) {
          .search-free-banner { flex-direction: column; text-align: center; }
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          border-color: var(--acc);
          background: rgba(229,9,20,0.05) !important;
        }
      `}</style>
    </div>
  );
}
