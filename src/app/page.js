import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
import { fetchMoviesPage } from '@/app/actions/fetchMovies';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MovieRow from '@/components/MovieRow';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import CategoryBar from '@/components/CategoryBar';

const POPULAR_CATEGORIES = [
  'Action', 'Adventure', 'Drama', 'Comedy', 'Science Fiction', 'Horror',
  'Thriller', 'Romance', 'Family', 'Animation',
  'VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark'
];

export default async function Home({ searchParams }) {
  const params = await searchParams;
  const category = params?.category;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = await getActiveProfile();

  let safeMovies = [];
  let categoryMovies = [];
  let categoryTotal = 0;

  if (category && category !== 'All') {
    // Use the paginated fetch action which correctly handles virtual categories
    const res = await fetchMoviesPage(category, 0, 24);
    categoryMovies = res.movies;
    categoryTotal = res.total;
  } else {
    // Fetch all movies for the homepage rows
    const { data: movies, error } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching movies:', error);
    safeMovies = movies || [];
  }

  // 2. Watch History (Continue Watching)
  let continueWatching = [];
  if (profile && (!category || category === 'All')) {
    const { data: history } = await supabase
      .from('watch_history')
      .select('movie_id, progress_seconds, updated_at')
      .eq('profile_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(15);

    if (history?.length > 0) {
      const ids = history.map(h => h.movie_id);
      continueWatching = ids.map(id => safeMovies.find(m => m.id === id)).filter(Boolean);
    }
  }

  // 2.5 My List (Favorites)
  let myList = [];
  if (profile && (!category || category === 'All')) {
    const { data: favorites } = await supabase
      .from('favorites')
      .select('movie_id')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (favorites?.length > 0) {
      const ids = favorites.map(f => f.movie_id);
      myList = ids.map(id => safeMovies.find(m => m.id === id)).filter(Boolean);
    }
  }

  // 3. Homepage dynamic categories setting
  const { data: settingCats } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'homepage_categories')
    .single();

  let dynamicCategories = ['Action', 'Adventure', 'Comedy'];
  if (settingCats?.setting_value) {
    try { dynamicCategories = JSON.parse(settingCats.setting_value); } catch (e) {}
  }

  // 3.5 Homepage sections setting
  const { data: settingSecs } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'homepage_sections')
    .single();

  let hpSections = {};
  if (settingSecs?.setting_value) {
    try { hpSections = JSON.parse(settingSecs.setting_value); } catch (e) {}
  }
  const isSectionEnabled = (name) => hpSections[name] !== false; // Default to true if missing

  // 3.7 App Download URL setting
  const { data: settingAppUrl } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'app_download_url')
    .single();
  const appDownloadUrl = settingAppUrl?.setting_value || '';

  // 4. Data slices
  const heroMovies = safeMovies.filter(m => m.thumbnail_url).slice(0, 6);
  const latest2026 = safeMovies.filter(m => new Date(m.created_at).getFullYear() === 2026).slice(0, 15);
  const premium = safeMovies.filter(m => m.type === 'video').slice(0, 15);
  const freeMovies = safeMovies.filter(m => m.type === 'genesis_free_movie').slice(0, 15);
  const comingSoon = safeMovies.filter(m => m.is_coming_soon).slice(0, 10);

  // Series setting & Fetch
  const { data: settingSeries } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', 'series_enabled')
    .maybeSingle();
  const seriesEnabled = settingSeries?.setting_value === 'true';

  let series = [];
  if (seriesEnabled && isSectionEnabled('Popular Series')) {
    const { data: fetchedSeries } = await supabase
      .from('series')
      .select('id, title, thumbnail_url, categories, created_at')
      .order('created_at', { ascending: false })
      .limit(15);
    
    if (fetchedSeries) {
      series = fetchedSeries.map(s => ({ ...s, is_series: true }));
    }
  }

  // Smart rows - Trending (by view_count), New Arrivals (last 30 days), Top Rated
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newArrivals = safeMovies
    .filter(m => new Date(m.created_at) > thirtyDaysAgo)
    .slice(0, 15);
  const trending = [...safeMovies]
    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
    .slice(0, 15);
  const topRated = [...safeMovies]
    .filter(m => m.imdb_rating)
    .sort((a, b) => (b.imdb_rating || 0) - (a.imdb_rating || 0))
    .slice(0, 15);


  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* Hero Slider */}
      {!category && <Hero movies={heroMovies} appDownloadUrl={appDownloadUrl} />}

      <main style={{
        marginTop: category ? '90px' : 0,
        position: 'relative',
        zIndex: 10,
        paddingBottom: '20px'
      }}>
        <div style={{ paddingTop: category ? '20px' : '36px' }}>
          <CategoryBar categories={POPULAR_CATEGORIES} />
        </div>

        {category && category !== 'All' ? (
          <PaginatedMovieGrid 
            title={`${category} Movies`} 
            initialMovies={categoryMovies} 
            totalCount={categoryTotal} 
            fetchAction={fetchMoviesPage} 
            actionArg={category} 
          />
        ) : (
          <>
            {isSectionEnabled('Continue Watching') && continueWatching.length > 0 && (
              <MovieRow title="Continue Watching" movies={continueWatching} />
            )}

            {isSectionEnabled('My List') && myList.length > 0 && (
              <MovieRow title="My List" movies={myList} href="/my-list" />
            )}

            {isSectionEnabled('Trending') && trending.length > 0 && (
              <MovieRow title="Trending" movies={trending} href="/?category=Trending" />
            )}

            {isSectionEnabled('New Arrivals') && newArrivals.length > 0 && (
              <MovieRow title="New Arrivals" movies={newArrivals} href="/?category=New Arrivals" />
            )}

            {isSectionEnabled('Latest 2026') && latest2026.length > 0 && (
              <MovieRow title="Latest 2026" movies={latest2026} href="/?category=Latest%202026" />
            )}

            {isSectionEnabled('Free') && freeMovies.length > 0 && (
              <MovieRow title="Free" movies={freeMovies} href="/?category=Free" />
            )}

            {dynamicCategories.map(cat => {
              const catMovies = safeMovies.filter(m => m.categories?.includes(cat) && !m.is_coming_soon).slice(0, 15);
              if (catMovies.length === 0) return null;
              return <MovieRow key={cat} title={cat} movies={catMovies} href={`/?category=${encodeURIComponent(cat)}`} />;
            })}

            {isSectionEnabled('Top Rated') && topRated.length > 0 && (
              <MovieRow title="Top Rated" movies={topRated} href="/?category=Top%20Rated" />
            )}

            {isSectionEnabled('Premium Exclusives') && premium.length > 0 && (
              <MovieRow title="Premium Exclusives" movies={premium} href="/?category=Premium%20Exclusives" />
            )}

            {isSectionEnabled('Popular Series') && series.length > 0 && (
              <MovieRow title="Popular Series" movies={series} href="/series" />
            )}

            {isSectionEnabled('Coming Soon') && comingSoon.length > 0 && (
              <>
                <div style={{ padding: '0 40px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#fff', margin: 0 }}>
                    <span style={{ color: 'var(--acc)' }}>|</span> Coming Soon
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '16px', padding: '0 40px', overflowX: 'auto', paddingBottom: '16px' }}>
                  {comingSoon.map(m => (
                    <div key={m.id} style={{ flexShrink: 0, width: '160px', position: 'relative' }}>
                      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '2/3', background: 'var(--bg2)' }}>
                        {m.thumbnail_url && <img src={m.thumbnail_url} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />}
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ fontSize: '28px' }}>🎬</span>
                          <span style={{ fontSize: '11px', fontWeight: '700', background: 'var(--acc)', padding: '3px 10px', borderRadius: '20px', color: '#fff' }}>COMING SOON</span>
                        </div>
                      </div>
                      <p style={{ fontSize: '12px', fontWeight: '600', color: '#fff', margin: '8px 0 2px', lineHeight: '1.3' }}>{m.title}</p>
                      {m.release_date && (
                        <p style={{ fontSize: '11px', color: 'var(--text3)', margin: 0 }}>
                          {new Date(m.release_date).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Footer banner */}
        <div className="gms-app-banner">
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
