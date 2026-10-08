import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
import { getCachedMovies, getCachedMovieById, getCachedSettings } from '@/lib/cache';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import MovieRow from '@/components/MovieRow';
import VideoPlayer from './VideoPlayer';
import FavoriteButton from '@/components/FavoriteButton';
import DownloadButton from '@/components/DownloadButton';
import StarRating from '@/components/StarRating';
import ShareButton from '@/components/ShareButton';
import PayPerViewButton from '@/components/PayPerViewButton';

const VJ_NAMES = ['VJ Junior', 'VJ Emmy', 'VJ Ice P', 'VJ ICE P', 'VJ Jingo', 'VJ Mark', 'VJ Kamil'];

function detectVJ(categories) {
  if (!Array.isArray(categories)) return null;
  return VJ_NAMES.find(vj => categories.some(c => c.toLowerCase().includes(vj.toLowerCase().replace('vj ', 'vj')))) || null;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const movie = await getCachedMovieById(id);

  const vjName = detectVJ(movie?.categories);
  const plainDesc = movie?.description?.replace(/<[^>]+>/g, '').slice(0, 140) || '';
  const genre = Array.isArray(movie?.categories) ? movie.categories.filter(c => !VJ_NAMES.some(vj => c.toLowerCase().includes(vj.toLowerCase().replace('vj ', 'vj')))).join(', ') : '';

  const movieTitle = vjName
    ? \\ — Translated by \ | Luganda Movies Uganda\
    : movie?.title
      ? \\ | Watch Full Movie Online Uganda — FlixOn\
      : 'Watch on FlixOn Uganda';

  const movieDesc = vjName
    ? \Watch "\" translated by \ in Luganda on FlixOn Uganda. \Stream or download \ movie with \'s Ugandan voice-over. Uganda's #1 VJ movie streaming platform.\
    : movie?.title
      ? \Watch "\" online on FlixOn Uganda. \Stream \ movies in Luganda with top Ugandan VJ translations. Stream or download anytime.\
      : 'Watch on FlixOn Uganda';

  const keywords = vjName
    ? [
        \\ \\, \\ Luganda\, \\ translated Uganda\,
        \\ movies\, \\ translated\, \watch \ online Uganda\,
        \\ Uganda\, 'VJ translated movies Uganda', 'Luganda movies online',
      ]
    : [
        \\ Uganda\, \watch \ online\, \\ stream\,
        'Uganda movies online', 'FlixOn Uganda', 'watch movies online Uganda',
      ];

  return {
    title: movieTitle,
    description: movieDesc.slice(0, 160),
    keywords,
    openGraph: {
      title: movieTitle,
      description: movieDesc.slice(0, 160),
      type: 'video.movie',
      siteName: 'FlixOn Uganda',
      images: movie?.thumbnail_url ? [{ url: movie.thumbnail_url, width: 1280, height: 720, alt: vjName ? \Watch \ translated by \\ : \Watch \ on FlixOn Uganda\ }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: movieTitle,
      description: movieDesc.slice(0, 160),
      images: movie?.thumbnail_url ? [movie.thumbnail_url] : [],
    },
    alternates: {
      canonical: \/movie/\\,
    },
  };
}

export default async function MoviePage({ params }) {
  const { id } = await params;
  const movie = await getCachedMovieById(id);

  if (!movie) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'var(--bg)', gap: '20px' }}>
        <Navbar />
        <h1 style={{ fontSize: '32px' }}>Movie Not Found</h1>
        <Link href="/" className="gms-btn gms-btn--primary">? Back to Home</Link>
      </div>
    );
  }

  const supabase = await createClient();

  // Extract primary video URL or detect Iframe
  let actualVideoUrl = null;
  let isIframe = false;
  if (movie.video_url) {
    if (movie.video_url.includes('<iframe')) {
      isIframe = true;
    } else if (movie.video_url.includes('<video') || movie.video_url.includes('<source')) {
      const match = movie.video_url.match(/src=["']([^"']+)['"]/);
      if (match?.[1]) actualVideoUrl = match[1];
    } else {
      actualVideoUrl = movie.video_url;
    }
  }

  // Related parts engine
  let relatedParts = [];
  const partMatch = movie.title.match(/(.*?)(?:\b(?:part|ep|episode|season)\b\s*\d+)/i);
  if (partMatch?.[1]) {
    const baseTitle = partMatch[1].trim().toLowerCase();
    const allMovies = await getCachedMovies();
    relatedParts = allMovies.filter(m => m.id !== movie.id && m.title.toLowerCase().startsWith(baseTitle))
                            .sort((a, b) => a.title.localeCompare(b.title));
  }

  // More Like This (same category)
  let moreLikeThis = [];
  const cats = Array.isArray(movie.categories) ? movie.categories : [];
  if (cats.length > 0) {
    const allMovies = await getCachedMovies();
    moreLikeThis = allMovies.filter(m => m.id !== movie.id && Array.isArray(m.categories) && m.categories.includes(cats[0])).slice(0, 12);
  }

  let initialProgress = 0;

  // Auth + Access check
  const { data: { user } } = await supabase.auth.getUser();
  let hasAccess = false;
  let isFavorite = false;
  let hasPpvAccess = false;
  let userRating = 0;

  if (user) {
    if (movie.type === 'genesis_free_movie') {
      hasAccess = true;
    } else {
      const { data: profile } = await supabase.from('user_profiles').select('subscription_end_date').eq('email', user.email).single();
      if (profile?.subscription_end_date && new Date(profile.subscription_end_date) > new Date()) {
        hasAccess = true;
      }
    }

    // Check Pay-Per-View access
    if (!hasAccess) {
      const { data: ppvData } = await supabase
        .from('ppv_purchases')
        .select('expires_at')
        .eq('user_id', user.id)
        .eq('movie_id', movie.id)
        .eq('status', 'success')
        .maybeSingle();
      if (ppvData?.expires_at && new Date(ppvData.expires_at) > new Date()) {
        hasPpvAccess = true;
        hasAccess = true;
      }
    }

    // Watch progress
    const profile = await getActiveProfile();
    if (hasAccess && profile) {
      const { data: historyData } = await supabase.from('watch_history').select('progress_seconds').eq('profile_id', profile.id).eq('movie_id', movie.id).maybeSingle();
      if (historyData) initialProgress = historyData.progress_seconds;
    }

    // Favorites
    if (profile) {
      const { data: favData } = await supabase.from('favorites').select('id').eq('profile_id', profile.id).eq('movie_id', movie.id).maybeSingle();
      if (favData) isFavorite = true;
    }

    // User's own rating
    const { data: ratingData } = await supabase.from('ratings').select('rating').eq('user_id', user.id).eq('movie_id', movie.id).maybeSingle();
    if (ratingData) userRating = ratingData.rating;
  }

  // Calculate Average Rating
  const { data: allRatings } = await supabase.from('ratings').select('rating').eq('movie_id', movie.id);
  const averageRating = allRatings?.length > 0 
    ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(1)
    : movie.imdb_rating || 'N/A';
  const ratingCount = allRatings?.length || 0;

  // PPV price from settings
  const settings = await getCachedSettings();
  const ppvSetting = settings.find(s => s.setting_key === 'ppv_price');
  const ppvPrice = Number(ppvSetting?.setting_value || 0);
  const ppvEnabled = ppvPrice > 0 && movie.type !== 'genesis_free_movie';

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.flixon.ug';
  const movieUrl = \\/movie/\\;
  const vjName = detectVJ(movie.categories);
  const plainDesc = movie.description?.replace(/<[^>]+>/g, '').slice(0, 160) || '';

  const movieSchema = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    'name': vjName ? \\ (Translated by \)\ : movie.title,
    'description': plainDesc,
    'image': movie.thumbnail_url,
    'url': movieUrl,
    'dateCreated': movie.release_date || movie.created_at,
    'inLanguage': 'Luganda',
    'isFamilyFriendly': true,
  };

  if (allRatings?.length > 0) {
    movieSchema.aggregateRating = {
      '@type': 'AggregateRating',
      'ratingValue': averageRating,
      'bestRating': '5',
      'ratingCount': ratingCount,
    };
  }

  let videoSchema = null;
  if (movie.thumbnail_url) {
    videoSchema = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      'name': vjName ? \Watch \ translated by \\ : \Watch \ on FlixOn Uganda\,
      'description': plainDesc,
      'thumbnailUrl': movie.thumbnail_url,
      'uploadDate': movie.created_at,
      'contentUrl': movieUrl,
    };
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': baseUrl },
      ...(cats[0] ? [{ '@type': 'ListItem', 'position': 2, 'name': cats[0], 'item': \\/category/\\ }] : []),
      { '@type': 'ListItem', 'position': cats[0] ? 3 : 2, 'name': movie.title, 'item': movieUrl },
    ],
  };
