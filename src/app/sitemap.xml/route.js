import { createAdminClient } from '@/utils/supabase/admin';
import { headers } from 'next/headers';

// ALL known VJ and genre category pages — hardcoded so they ALWAYS appear in sitemap
// regardless of DB connectivity. These are our highest-value SEO pages.
const STATIC_CATEGORIES = [
  // VJ Translators — priority 0.95
  { slug: 'VJ Junior', isVJ: true },
  { slug: 'VJ Emmy', isVJ: true },
  { slug: 'VJ ICE P', isVJ: true },
  { slug: 'VJ Jingo', isVJ: true },
  { slug: 'VJ Mark', isVJ: true },
  { slug: 'VJ Kamil', isVJ: true },
  // Genres — priority 0.80
  { slug: 'Action', isVJ: false },
  { slug: 'Adventure', isVJ: false },
  { slug: 'Drama', isVJ: false },
  { slug: 'Comedy', isVJ: false },
  { slug: 'Science Fiction', isVJ: false },
  { slug: 'Horror', isVJ: false },
  { slug: 'Thriller', isVJ: false },
  { slug: 'Romance', isVJ: false },
  { slug: 'Family', isVJ: false },
  { slug: 'Animation', isVJ: false },
  { slug: 'Crime', isVJ: false },
  { slug: 'Mystery', isVJ: false },
  { slug: 'Biography', isVJ: false },
  { slug: 'History', isVJ: false },
  { slug: 'Sport', isVJ: false },
  { slug: 'War', isVJ: false },
  { slug: 'Music', isVJ: false },
  { slug: 'Documentary', isVJ: false },
];

export async function GET() {
  const headersList = await headers();
  const host = headersList.get('host') || 'flixon.ug';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/checkout', priority: '0.9', changefreq: 'weekly' },
    { url: '/series', priority: '0.8', changefreq: 'daily' },
    { url: '/search', priority: '0.7', changefreq: 'weekly' },
  ];

  // Hardcoded category pages — always included, never fail
  const categoryUrls = STATIC_CATEGORIES.map(cat => ({
    url: `/category/${encodeURIComponent(cat.slug)}`,
    priority: cat.isVJ ? '0.95' : '0.80',
    changefreq: 'daily',
  }));

  // Fetch movies from DB — graceful fallback to empty if it fails
  let movieUrls = [];
  let seriesUrls = [];
  let collectionUrls = [];

  try {
    const supabase = createAdminClient();

    const { data: movies } = await supabase
      .from('movies')
      .select('id, updated_at')
      .order('updated_at', { ascending: false });

    movieUrls = (movies || []).map(m => ({
      url: `/movie/${m.id}`,
      priority: '0.9',
      changefreq: 'weekly',
      lastmod: m.updated_at ? new Date(m.updated_at).toISOString().split('T')[0] : undefined,
    }));

    const { data: series } = await supabase
      .from('series')
      .select('id, created_at')
      .order('created_at', { ascending: false });

    seriesUrls = (series || []).map(s => ({
      url: `/series/${s.id}`,
      priority: '0.75',
      changefreq: 'weekly',
      lastmod: s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : undefined,
    }));

    const { data: collections } = await supabase
      .from('collections')
      .select('slug, created_at')
      .eq('is_active', true);

    collectionUrls = (collections || []).map(c => ({
      url: `/collection/${c.slug}`,
      priority: '0.70',
      changefreq: 'weekly',
    }));

    // Also discover any extra categories from the DB not in our static list
    const { data: dbCats } = await supabase
      .from('movies')
      .select('categories');

    if (dbCats) {
      const knownSlugs = new Set(STATIC_CATEGORIES.map(c => c.slug.toLowerCase()));
      const extraCats = new Set();
      dbCats.forEach(row => {
        if (Array.isArray(row.categories)) {
          row.categories.forEach(cat => {
            if (cat && cat.trim() && !knownSlugs.has(cat.toLowerCase().trim())) {
              extraCats.add(cat.trim());
            }
          });
        }
      });
      extraCats.forEach(cat => {
        categoryUrls.push({
          url: `/category/${encodeURIComponent(cat)}`,
          priority: cat.toLowerCase().startsWith('vj') ? '0.90' : '0.75',
          changefreq: 'daily',
        });
      });
    }
  } catch (err) {
    // DB failed — static URLs still included above
    console.error('Sitemap DB error (non-fatal):', err.message);
  }

  const allUrls = [...staticPages, ...categoryUrls, ...movieUrls, ...seriesUrls, ...collectionUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${baseUrl}${u.url}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
