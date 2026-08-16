import { createClient } from '@/utils/supabase/server';
import { fetchMoviesPage } from '@/app/actions/fetchMovies';
import Navbar from '@/components/Navbar';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import Link from 'next/link';

// VJ translator names — used for VJ-specific SEO copy
const VJ_NAMES = ['VJ Junior', 'VJ Emmy', 'VJ Ice P', 'VJ ICE P', 'VJ Jingo', 'VJ Mark', 'VJ Kamil'];

function isVJCategory(slug) {
  return VJ_NAMES.some(vj => slug.toLowerCase().includes(vj.toLowerCase().replace('vj ', 'vj')));
}

function getCanonicalVJName(slug) {
  return VJ_NAMES.find(vj => slug.toLowerCase().includes(vj.toLowerCase().split(' ').pop().toLowerCase())) || slug;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  const isVJ = isVJCategory(name);
  const vjName = isVJ ? getCanonicalVJName(name) : null;

  const title = isVJ
    ? `${name} Translated Movies Uganda | Watch in Luganda — FlixOn`
    : `${name} Movies Uganda | Watch Online — FlixOn`;

  const description = isVJ
    ? `Watch the latest and best movies translated by ${name} in Luganda on FlixOn Uganda. Stream or download ${name} action movies, comedies, dramas and more online. Uganda's #1 platform for ${name} translated movies.`
    : `Browse all ${name} movies on FlixOn Uganda. Stream the best ${name} films online — action, comedy, drama and more. Watch ${name} movies dubbed in Luganda by top Ugandan VJ translators.`;

  const keywords = isVJ
    ? [
        `${name} movies`, `${name} translated movies`, `${name} Uganda`,
        `${name} Luganda movies`, `watch ${name} movies online`, `${name} movies download`,
        `${name} latest movies`, `${name} action movies`, `${name} comedy movies`,
        `${name} translated movies Uganda`, `VJ translated movies Uganda`, 'Luganda movies Uganda',
      ]
    : [
        `${name} movies Uganda`, `${name} movies online Uganda`, `watch ${name} movies`,
        `${name} translated Uganda`, `${name} Luganda movies`, `Uganda ${name} movies`,
      ];

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'FlixOn Uganda',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Number(sp?.page) || 0;
  const name = decodeURIComponent(slug);
  const isVJ = isVJCategory(name);

  // Fetch movies for this category
  const { movies, total } = await fetchMoviesPage(name, page, 24);

  // Build JSON-LD ItemList for Google
  const baseUrl = 'https://flixon.ug';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': isVJ ? `${name} Translated Movies` : `${name} Movies`,
    'description': isVJ
      ? `Movies translated by ${name} in Luganda, available on FlixOn Uganda.`
      : `${name} movies available to stream on FlixOn Uganda.`,
    'url': `${baseUrl}/category/${slug}`,
    'numberOfItems': total,
    'itemListElement': movies.slice(0, 20).map((movie, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'url': `${baseUrl}/movie/${movie.id}`,
      'name': movie.title,
      'image': movie.thumbnail_url || undefined,
    })),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        {/* SEO-rich heading section */}
        <div style={{ padding: '0 40px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <nav aria-label="Breadcrumb" style={{ marginBottom: '12px' }}>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <li><Link href="/" style={{ color: 'var(--text3)', fontSize: '13px', textDecoration: 'none' }}>Home</Link></li>
              <li style={{ color: 'var(--text3)', fontSize: '13px' }}>›</li>
              <li><span style={{ color: 'var(--text2)', fontSize: '13px' }}>{name}</span></li>
            </ol>
          </nav>

          <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: '900', margin: '0 0 10px', color: '#fff', letterSpacing: '-0.5px' }}>
            {isVJ ? `${name} Translated Movies` : `${name} Movies`}
          </h1>

          {isVJ && (
            <p style={{ fontSize: '15px', color: 'var(--text2)', margin: '0 0 8px', maxWidth: '700px', lineHeight: '1.6' }}>
              Stream the best movies translated by <strong style={{ color: '#fff' }}>{name}</strong> in Luganda on FlixOn Uganda.
              Download or watch online — action, comedy, drama and more.
            </p>
          )}

          {total > 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>
              {total} {isVJ ? `${name} translated` : name} movies available
            </p>
          )}
        </div>

        <PaginatedMovieGrid
          title=""
          initialMovies={movies}
          totalCount={total}
          fetchAction={fetchMoviesPage}
          actionArg={name}
        />

        {/* Additional SEO text for VJ pages */}
        {isVJ && (
          <section aria-label={`About ${name} translated movies`} style={{ maxWidth: '1100px', margin: '40px auto 0', padding: '0 40px' }}>
            <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 12px' }}>
                About {name} Translated Movies on FlixOn Uganda
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.8', margin: '0 0 12px' }}>
                {name} is one of Uganda&apos;s most popular VJ translators, known for delivering energetic and authentic Luganda voice-overs for Hollywood, Bollywood, and African films. On FlixOn Uganda, you can find the most comprehensive collection of {name} translated movies, all available to stream instantly or download for offline viewing.
              </p>
              <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.8', margin: 0 }}>
                Whether you&apos;re looking for the latest {name} action movies, comedies, dramas, or thrillers — FlixOn has the biggest library of {name} translated films in Uganda. Subscribe today to unlock full access to all {name} movies and thousands of other VJ translated titles.
              </p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
