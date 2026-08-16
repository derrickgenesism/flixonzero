import { createClient } from '@/utils/supabase/server';
import { getActiveProfile } from '@/app/profiles/actions';
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
  const supabase = await createClient();
  const { data: movie } = await supabase.from('movies').select('title, description, thumbnail_url, categories, release_date, imdb_rating').eq('id', id).single();

  const vjName = detectVJ(movie?.categories);
  const plainDesc = movie?.description?.replace(/<[^>]+>/g, '').slice(0, 140) || '';
  const genre = Array.isArray(movie?.categories) ? movie.categories.filter(c => !VJ_NAMES.some(vj => c.toLowerCase().includes(vj.toLowerCase().replace('vj ', 'vj')))).join(', ') : '';

  const movieTitle = vjName
    ? `${movie.title} — Translated by ${vjName} | Luganda Movies Uganda`
    : movie?.title
      ? `${movie.title} | Watch Full Movie Online Uganda — FlixOn`
      : 'Watch on FlixOn Uganda';

  const movieDesc = vjName
    ? `Watch "${movie.title}" translated by ${vjName} in Luganda on FlixOn Uganda. ${plainDesc ? plainDesc + '. ' : ''}Stream or download ${genre || 'this'} movie with ${vjName}'s Ugandan voice-over. Uganda's #1 VJ movie streaming platform.`
    : movie?.title
      ? `Watch "${movie.title}" online on FlixOn Uganda. ${plainDesc ? plainDesc + '. ' : ''}Stream ${genre || ''} movies in Luganda with top Ugandan VJ translations. Stream or download anytime.`
      : 'Watch on FlixOn Uganda';

  const keywords = vjName
    ? [
        `${movie.title} ${vjName}`, `${movie.title} Luganda`, `${movie.title} translated Uganda`,
        `${vjName} movies`, `${vjName} translated`, `watch ${movie.title} online Uganda`,
        `${movie.title} Uganda`, 'VJ translated movies Uganda', 'Luganda movies online',
      ]
    : [
        `${movie?.title} Uganda`, `watch ${movie?.title} online`, `${movie?.title} stream`,
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
      images: movie?.thumbnail_url ? [{ url: movie.thumbnail_url, width: 1280, height: 720, alt: vjName ? `Watch ${movie.title} translated by ${vjName}` : `Watch ${movie.title} on FlixOn Uganda` }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: movieTitle,
      description: movieDesc.slice(0, 160),
      images: movie?.thumbnail_url ? [movie.thumbnail_url] : [],
    },
    alternates: {
      canonical: `/movie/${id}`,
    },
  };
}

export default async function MoviePage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: movie, error } = await supabase.from('movies').select('*').eq('id', id).single();

  if (error || !movie) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', background: 'var(--bg)', gap: '20px' }}>
        <Navbar />
        <h1 style={{ fontSize: '32px' }}>Movie Not Found</h1>
        <Link href="/" className="gms-btn gms-btn--primary">← Back to Home</Link>
      </div>
    );
  }

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
    const baseTitle = partMatch[1].trim();
    const { data: partsData } = await supabase.from('movies').select('*').ilike('title', `${baseTitle}%`).neq('id', movie.id).order('title', { ascending: true });
    if (partsData?.length > 0) relatedParts = partsData;
  }

  // More Like This (same category)
  let moreLikeThis = [];
  const cats = Array.isArray(movie.categories) ? movie.categories : [];
  if (cats.length > 0) {
    const { data: similar } = await supabase.from('movies').select('*').contains('categories', [cats[0]]).neq('id', movie.id).limit(12);
    moreLikeThis = similar || [];
  }

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

  let initialProgress = 0;

  // Avg rating
  const { data: allRatings } = await supabase.from('ratings').select('rating').eq('movie_id', movie.id);
  const avgRating = allRatings?.length ? (allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length).toFixed(1) : null;
  const ratingCount = allRatings?.length || 0;

  // PPV price from settings
  const { data: ppvSetting } = await supabase.from('admin_settings').select('setting_value').eq('setting_key', 'ppv_price').maybeSingle();
  const ppvPrice = Number(ppvSetting?.setting_value || 0);
  const ppvEnabled = ppvPrice > 0 && movie.type !== 'genesis_free_movie';

  const typeLabel = movie.type === 'genesis_free_movie' ? 'Free' : movie.type === 'gsm_series' ? 'Series' : 'Premium';
  const typeBadgeStyle = movie.type === 'genesis_free_movie'
    ? { background: '#166534', color: '#4ade80' }
    : movie.type === 'gsm_series'
    ? { background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' }
    : { background: 'rgba(229,9,20,0.2)', color: '#ff6b6b', border: '1px solid rgba(229,9,20,0.35)' };

  const castList = Array.isArray(movie.cast_list) ? movie.cast_list : [];

  const vjName = detectVJ(movie.categories);
  const baseUrl = 'https://flixon.ug';
  const movieUrl = `${baseUrl}/movie/${movie.id}`;
  const plainDescForSchema = movie.description?.replace(/<[^>]+>/g, '').slice(0, 500) || `Watch ${movie.title} on FlixOn Uganda.`;

  // Movie JSON-LD Schema
  const movieSchema = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    'name': movie.title,
    'url': movieUrl,
    'description': vjName
      ? `${movie.title} translated by ${vjName} in Luganda. ${plainDescForSchema}`
      : plainDescForSchema,
    'image': movie.thumbnail_url || undefined,
    'datePublished': movie.release_date || undefined,
    'inLanguage': vjName ? 'Luganda' : (movie.language || 'en'),
    'genre': cats.filter(c => !VJ_NAMES.some(vj => c.toLowerCase().includes(vj.toLowerCase().replace('vj ', 'vj')))),
    'contentRating': movie.content_rating || undefined,
    'director': movie.director ? { '@type': 'Person', 'name': movie.director } : undefined,
    'actor': castList.slice(0, 5).map(p => ({ '@type': 'Person', 'name': p.name })),
    ...(avgRating && ratingCount > 2 ? {
      'aggregateRating': {
        '@type': 'AggregateRating',
        'ratingValue': avgRating,
        'bestRating': '5',
        'worstRating': '1',
        'ratingCount': ratingCount,
      }
    } : {}),
    'offers': {
      '@type': 'Offer',
      'category': 'subscription',
      'url': `${baseUrl}/checkout`,
      'availableAtOrFrom': { '@type': 'Place', 'name': 'Uganda' },
    },
    'potentialAction': {
      '@type': 'WatchAction',
      'target': movieUrl,
    },
  };

  // VideoObject JSON-LD Schema — makes thumbnail appear in Google Search
  const videoSchema = actualVideoUrl ? {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    'name': vjName ? `${movie.title} — ${vjName} Translated (Luganda)` : movie.title,
    'description': vjName
      ? `Watch ${movie.title} translated by ${vjName} in Luganda on FlixOn Uganda.`
      : `Watch ${movie.title} on FlixOn Uganda.`,
    'thumbnailUrl': movie.thumbnail_url || undefined,
    'uploadDate': movie.created_at ? new Date(movie.created_at).toISOString() : undefined,
    'contentUrl': movieUrl,
    'embedUrl': movieUrl,
    'publisher': {
      '@type': 'Organization',
      'name': 'FlixOn Uganda',
      'logo': { '@type': 'ImageObject', 'url': `${baseUrl}/logo.png` },
    },
    'potentialAction': {
      '@type': 'WatchAction',
      'target': movieUrl,
    },
  } : null;

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': baseUrl },
      ...(cats[0] ? [{ '@type': 'ListItem', 'position': 2, 'name': cats[0], 'item': `${baseUrl}/category/${encodeURIComponent(cats[0])}` }] : []),
      { '@type': 'ListItem', 'position': cats[0] ? 3 : 2, 'name': movie.title, 'item': movieUrl },
    ],
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(movieSchema) }} />
      {videoSchema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchema) }} />}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Navbar />

      {/* Video / Paywall */}
      <div style={{ paddingTop: '68px', background: '#000' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', ...(hasAccess ? { aspectRatio: '16/9' } : { minHeight: 'max(450px, 60vh)', display: 'flex', padding: '20px' }), background: '#000' }}>
          {!hasAccess ? (
            <div className="flx-paywall" style={{ position: 'relative', flex: 1, minHeight: '100%', borderRadius: '16px', overflow: 'hidden', flexDirection: 'column' }}>
              <div className="flx-paywall-bg" style={{ backgroundImage: `url(${movie.thumbnail_url})` }} />
              <div className="flx-paywall-content">
                <svg style={{ margin: '0 auto 20px', color: 'var(--acc)', display: 'block' }} width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {movie.type === 'genesis_free_movie' ? (
                  <>
                    <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 12px', color: '#fff' }}>Free to Watch!</h2>
                    <p style={{ fontSize: '15px', color: 'var(--text2)', marginBottom: '28px', lineHeight: '1.7' }}>
                      Create a free account to watch <strong style={{ color: '#fff' }}>{movie.title}</strong>.
                    </p>
                    <Link href="/signup" className="gms-btn gms-btn--primary" style={{ fontSize: '16px', padding: '14px 32px' }}>Create Free Account</Link>
                    <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text3)' }}>
                      Already have an account? <Link href="/login" style={{ color: 'var(--text2)' }}>Sign In</Link>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontSize: '26px', fontWeight: '900', margin: '0 0 12px', color: '#fff' }}>Premium Content</h2>
                    <p style={{ fontSize: '15px', color: 'var(--text2)', marginBottom: '24px', lineHeight: '1.7' }}>
                      Subscribe to watch <strong style={{ color: '#fff' }}>{movie.title}</strong> and thousands of other titles.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Link href="/checkout" className="gms-btn gms-btn--primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
                        Subscribe to Watch
                      </Link>
                    </div>
                    {!user && (
                      <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text3)' }}>
                        <Link href="/login" style={{ color: 'var(--text2)' }}>Sign in</Link> to access this title
                      </p>
                    )}
                  </>
                )}
              </div>
              {ppvEnabled && user && (
                <div style={{ marginTop: '24px', zIndex: 2 }}>
                  <PayPerViewButton movieId={movie.id} movieTitle={movie.title} price={ppvPrice} variant="small" />
                </div>
              )}
            </div>
          ) : isIframe ? (
            <div 
              style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} 
              dangerouslySetInnerHTML={{ __html: movie.video_url.replace(/width=["']?[0-9%px]+["']?/, 'width="100%"').replace(/height=["']?[0-9%px]+["']?/, 'height="100%"') }}
            />
          ) : (actualVideoUrl || movie.video_url) ? (
            <VideoPlayer movie={movie} movieId={movie.id} initialProgress={initialProgress} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text2)', flexDirection: 'column', gap: '12px', aspectRatio: '16/9' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14v-4z" />
                <rect x="3" y="6" width="12" height="12" rx="2" ry="2" />
              </svg>
              <p style={{ margin: 0 }}>No video available for this title yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Movie Info */}
      <div className="flx-movie-info">
        <Link href="/" className="gms-view-more" style={{ marginBottom: '24px', border: 'none', padding: '0', background: 'transparent' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Home
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>

          {/* Details */}
          <div style={{ flex: 1, minWidth: '250px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <h1 style={{ fontSize: 'clamp(22px, 4vw, 40px)', fontWeight: '900', margin: 0, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
                {movie.title}
                {vjName && <span style={{ display: 'block', fontSize: 'clamp(13px, 2vw, 16px)', fontWeight: '600', color: 'var(--acc)', marginTop: '4px', letterSpacing: '0' }}>Translated by {vjName} (Luganda)</span>}
              </h1>
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.8px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '6px', flexShrink: 0, ...typeBadgeStyle }}>
                {typeLabel}
              </span>
            </div>

            {/* Meta badges */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px', alignItems: 'center' }}>
              {movie.imdb_rating && (
                <span style={{ background: '#f5c518', color: '#000', fontWeight: '800', fontSize: '12px', padding: '3px 8px', borderRadius: '4px' }}>
                  ⭐ {movie.imdb_rating} IMDb
                </span>
              )}
              {avgRating && (
                <span style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: '700', fontSize: '12px', padding: '3px 8px', borderRadius: '4px', border: '1px solid rgba(251,191,36,0.25)' }}>
                  ★ {avgRating}/5 ({ratingCount})
                </span>
              )}
              {movie.content_rating && (
                <span style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text2)', fontSize: '12px', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                  {movie.content_rating}
                </span>
              )}
              {movie.runtime && (
                <span style={{ color: 'var(--text3)', fontSize: '13px' }}>
                  🕐 {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </span>
              )}
              {movie.language && (
                <span style={{ color: 'var(--text3)', fontSize: '13px' }}>🌐 {movie.language}</span>
              )}
              {movie.release_date && (
                <span style={{ color: 'var(--text3)', fontSize: '13px' }}>
                  📅 {new Date(movie.release_date).getFullYear()}
                </span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '28px' }}>
              {hasAccess && (actualVideoUrl || isIframe) && (
                <>
                  {!isIframe && (
                    <Link href={`/movie/${movie.id}`} className="gms-btn gms-btn--primary">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5V19L19 12L8 5Z" /></svg>
                      Watch Now
                    </Link>
                  )}
                  {actualVideoUrl && !actualVideoUrl.includes('pelpic') && !actualVideoUrl.includes('upstream') && (
                    <DownloadButton movieId={movie.id} title={movie.title} />
                  )}
                </>
              )}
              {!hasAccess && (
                <Link href="/checkout" className="gms-btn gms-btn--primary">Subscribe to Watch</Link>
              )}
              {user && (
                <FavoriteButton movieId={movie.id} initialIsFavorite={isFavorite} />
              )}
              <ShareButton title={movie.title} />
            </div>

            {cats.length > 0 && (
              <div className="flx-movie-cats" style={{ marginBottom: '16px' }}>
                {cats.map(cat => (
                  <Link key={cat} href={`/category/${encodeURIComponent(cat)}`} className="flx-movie-cat">{cat}</Link>
                ))}
              </div>
            )}

            {movie.director && (
              <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '12px' }}>
                <strong style={{ color: 'var(--text2)' }}>Director:</strong> {movie.director}
              </p>
            )}

            <p style={{ fontSize: '15px', lineHeight: '1.75', color: 'var(--text2)', maxWidth: '680px', margin: '0 0 24px' }}>
              {movie.description
                ? <span dangerouslySetInnerHTML={{ __html: movie.description }} />
                : 'No description available for this title.'}
            </p>


            {/* Star Rating (logged-in users) */}
            {user && (
              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text3)', marginBottom: '8px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rate This</p>
                <StarRating movieId={movie.id} currentRating={userRating} totalCount={ratingCount} />
              </div>
            )}
          </div>
        </div>

        {/* Trailer Section */}
        {movie.trailer_url && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
              <span style={{ color: 'var(--acc)' }}>|</span> Trailer
            </h2>
            <div style={{ borderRadius: '12px', overflow: 'hidden', background: '#000', aspectRatio: '16/9', maxWidth: '760px' }}>
              <iframe
                src={movie.trailer_url.replace('watch?v=', 'embed/')}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}

        {/* Cast */}
        {castList.length > 0 && (
          <div style={{ marginTop: '40px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '16px', color: '#fff' }}>
              <span style={{ color: 'var(--acc)' }}>|</span> Cast
            </h2>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {castList.map((person, i) => (
                <div key={i} style={{ textAlign: 'center', width: '80px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--bg3)', overflow: 'hidden', marginBottom: '8px', border: '2px solid var(--border)' }}>
                    {person.photo_url
                      ? <img src={person.photo_url} alt={person.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>👤</div>
                    }
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#fff', lineHeight: '1.3' }}>{person.name}</div>
                  {person.role && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>{person.role}</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* More Like This */}
      {moreLikeThis.length > 0 && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '20px' }}>
          <MovieRow title="More Like This" movies={moreLikeThis} href={cats[0] ? `/category/${encodeURIComponent(cats[0])}` : undefined} />
        </div>
      )}

      {relatedParts.length > 0 && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' }}>
          <MovieRow title="More Episodes & Parts" movies={relatedParts} />
        </div>
      )}
    </div>
  );
}
