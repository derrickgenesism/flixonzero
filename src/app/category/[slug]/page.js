import { createClient } from '@/utils/supabase/server';
import { fetchMoviesPage } from '@/app/actions/fetchMovies';
import Navbar from '@/components/Navbar';
import PaginatedMovieGrid from '@/components/PaginatedMovieGrid';
import Link from 'next/link';

// VJ translator names
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

  const title = isVJ
    ? `Latest ${name} Luganda Translated Movies (2026) | Translated Movies Uganda`
    : `${name} Luganda Translated Movies | Translated Movies Uganda`;

  const description = isVJ
    ? `Download or watch the latest movies translated by ${name} in Luganda. Stream the best ${name} action movies online in Uganda today on FlixOn.`
    : `Browse the best ${name} translated movies on FlixOn Uganda. Stream ${name} movies dubbed in Luganda by top Ugandan VJ translators. Watch online or download.`;

  const keywords = [
    `${name} translated movies`, `${name} filimu enjogerere`, 'filimu enjogerere',
    `${name} Luganda movies`, `download ${name} movies`, `watch ${name} translated movies`,
    `latest ${name} movies 2026`, 'VJ translated movies Uganda', 'Luganda movies online'
  ];

  return {
    title,
    description,
    keywords,
    openGraph: { title, description, type: 'website', siteName: 'FlixOn Uganda' },
    twitter: { card: 'summary_large_image', title, description },
    alternates: { canonical: `https://flixon.net/category/${slug}` },
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
  const baseUrl = 'https://flixon.net';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': `${name} Translated Movies`,
    'description': `Movies translated by ${name} in Luganda, available on FlixOn Uganda.`,
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main style={{ paddingTop: '100px', paddingBottom: '60px' }}>
        {/* SEO-rich heading section */}
        <div style={{ padding: '0 40px 24px', maxWidth: '1100px', margin: '0 auto' }}>
          <nav aria-label="Breadcrumb" style={{ marginBottom: '12px' }}>
            <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <li><Link href="/" style={{ color: 'var(--text3)', fontSize: '13px', textDecoration: 'none' }}>Home</Link></li>
              <li style={{ color: 'var(--text3)', fontSize: '13px' }}>/</li>
              <li><span style={{ color: 'var(--text2)', fontSize: '13px' }}>{name}</span></li>
            </ol>
          </nav>

          <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: '900', margin: '0 0 10px', color: '#fff', letterSpacing: '-0.5px' }}>
            {isVJ ? `Latest ${name} Translated Movies` : `${name} Translated Movies`}
          </h1>

          <p style={{ fontSize: '15px', color: 'var(--text2)', margin: '0 0 8px', maxWidth: '700px', lineHeight: '1.6' }}>
            Stream the best <strong>translated movies</strong> dubbed by <strong style={{ color: '#fff' }}>{name}</strong> in Luganda.
            Download or watch online &mdash; action, comedy, drama and more.
          </p>

          {total > 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text3)', margin: 0 }}>
              {total} {name} translated movies available
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

        {/* FAQ Section for SEO */}
        <section aria-label={`FAQ for ${name} translated movies`} style={{ maxWidth: '1100px', margin: '40px auto 0', padding: '0 40px' }}>
          <div style={{ background: 'var(--bg2)', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.07)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: '0 0 16px' }}>
              Frequently Asked Questions: {name} Translated Movies
            </h2>
            
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 4px' }}>Where can I download {name} translated movies?</h3>
              <p style={{ fontSize: '14px', color: 'var(--text2)', margin: 0, lineHeight: '1.6' }}>You can download and watch all the latest movies translated by {name} directly on FlixOn Uganda. We offer fast mobile downloads and HD streaming.</p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', color: '#fff', margin: '0 0 4px' }}>Are these movies dubbed in Luganda?</h3>
              <p style={{ fontSize: '14px', color: 'var(--text2)', margin: 0, lineHeight: '1.6' }}>Yes, all our translated movies feature top Ugandan VJs providing high-quality Luganda voice-overs for the best viewing experience.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
