import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
import { fetchMoviesPage } from '@/app/actions/fetchMovies';
import { getCachedMovies, getCachedSettings, getCachedSeries } from '@/lib/cache';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import MovieRow from '@/components/MovieRow';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import CategoryBar from '@/components/CategoryBar';

export const metadata = {
  title: 'FlixOn Uganda — Watch VJ Translated Movies Online | Luganda Dubbed Films',
  description: 'FlixOn is Uganda\'s #1 streaming platform for VJ translated movies. Watch the latest Hollywood and Bollywood films dubbed in Luganda by VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo, VJ Mark and more. Stream or download movies online in Uganda.',
  alternates: {
    canonical: '/',
  },
};

export const revalidate = 3600;

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
  
  let profile = null;
  let isSubscribed = false;

  if (user) {
    profile = await getActiveProfile();
    const { data: userProfile } = await supabase.from('user_profiles').select('subscription_end_date').eq('email', user.email).single();
    if (userProfile?.subscription_end_date && new Date(userProfile.subscription_end_date) > new Date()) {
      isSubscribed = true;
    }
  }

  let safeMovies = [];
  let categoryMovies = [];
  let categoryTotal = 0;

  if (category && category !== 'All') {
    // Use the paginated fetch action which correctly handles virtual categories
    const res = await fetchMoviesPage(category, 0, 24);
    categoryMovies = res.movies;
    categoryTotal = res.total;
  } else {
    // Fetch all movies from cache
    safeMovies = await getCachedMovies();
  }

  // 2. Watch History (Continue Watching) - ONLY FOR SUBSCRIBED USERS
  let continueWatching = [];
  if (isSubscribed && profile && (!category || category === 'All')) {
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

  // 2.5 My List (Favorites) - ONLY FOR SUBSCRIBED USERS
  let myList = [];
  if (isSubscribed && profile && (!category || category === 'All')) {
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

  // 3. Admin Settings Cache
  const settings = await getCachedSettings();
  
  let dynamicCategories = ['Action', 'Adventure', 'Comedy'];
  const settingCats = settings.find(s => s.setting_key === 'homepage_categories');
  if (settingCats?.setting_value) {
    try { dynamicCategories = JSON.parse(settingCats.setting_value); } catch (e) {}
  }

  let hpSections = {};
  const settingSecs = settings.find(s => s.setting_key === 'homepage_sections');
  if (settingSecs?.setting_value) {
    try { hpSections = JSON.parse(settingSecs.setting_value); } catch (e) {}
  }

  const isSectionEnabled = (name) => {
    if (Object.keys(hpSections).length === 0) return true;
    return hpSections[name] !== false;
  };

  const settingAppUrl = settings.find(s => s.setting_key === 'app_download_url');
  const appDownloadUrl = settingAppUrl?.setting_value || '';

  const trending = isSectionEnabled('Trending') ? safeMovies.filter(m => m.is_trending && !m.is_coming_soon).slice(0, 15) : [];
  const latest2026 = isSectionEnabled('Latest 2026') ? safeMovies.filter(m => {
    if (m.is_coming_soon) return false;
    const d = new Date(m.release_date);
    return d.getFullYear() === 2026;
  }).slice(0, 15) : [];
  const freeMovies = isSectionEnabled('Free') ? safeMovies.filter(m => m.type === 'genesis_free_movie' && !m.is_coming_soon).slice(0, 15) : [];
  const newArrivals = isSectionEnabled('New Arrivals') ? safeMovies.filter(m => !m.is_coming_soon).slice(0, 15) : [];
  const topRated = isSectionEnabled('Top Rated') ? [...safeMovies].filter(m => !m.is_coming_soon).sort((a, b) => (b.imdb_rating || 0) - (a.imdb_rating || 0)).slice(0, 15) : [];
  const premium = isSectionEnabled('Premium Exclusives') ? safeMovies.filter(m => m.type === 'genesis_premium' && !m.is_coming_soon).slice(0, 15) : [];
  const comingSoon = isSectionEnabled('Coming Soon') ? safeMovies.filter(m => m.is_coming_soon).slice(0, 15) : [];

  // Series Fetching (Cached)
  let series = [];
  if (isSectionEnabled('Popular Series') && (!category || category === 'All')) {
    series = await getCachedSeries();
    series = series.slice(0, 15);
  }
