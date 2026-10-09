import { createAdminClient } from '@/utils/supabase/admin';

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

export default async function sitemap() {
  const baseUrl = 'https://flixon.net';

  // Base static routes
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/series`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/movies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Hardcoded category pages — always included
  const categoryUrls = STATIC_CATEGORIES.map(cat => ({
    url: `${baseUrl}/category/${encodeURIComponent(cat.slug)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: cat.isVJ ? 0.95 : 0.80,
  }));

  let movieUrls = [];
  let seriesUrls = [];
  let collectionUrls = [];

  try {
    const supabase = createAdminClient();

    // 1. Fetch movies
    const { data: movies } = await supabase
      .from('movies')
      .select('id, updated_at, created_at')
      .order('updated_at', { ascending: false });

    if (movies && movies.length > 0) {
      movieUrls = movies.map(m => ({
        url: `${baseUrl}/movie/${m.id}`,
        lastModified: new Date(m.updated_at || m.created_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.9,
      }));
    }

    // 2. Fetch series
    const { data: series } = await supabase
      .from('series')
      .select('id, created_at')
      .order('created_at', { ascending: false });

    if (series && series.length > 0) {
      seriesUrls = series.map(s => ({
        url: `${baseUrl}/series/${s.id}`,
        lastModified: new Date(s.created_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.75,
      }));
    }

    // 3. Fetch collections
    const { data: collections } = await supabase
      .from('collections')
      .select('slug, created_at')
      .eq('is_active', true);

    if (collections && collections.length > 0) {
      collectionUrls = collections.map(c => ({
        url: `${baseUrl}/collection/${c.slug}`,
        lastModified: new Date(c.created_at || new Date()),
        changeFrequency: 'weekly',
        priority: 0.70,
      }));
    }

    // 4. Discover any dynamic categories in the DB
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
          url: `${baseUrl}/category/${encodeURIComponent(cat)}`,
          lastModified: new Date(),
          changeFrequency: 'daily',
          priority: cat.toLowerCase().startsWith('vj') ? 0.90 : 0.75,
        });
      });
    }
  } catch (err) {
    console.error('Sitemap DB error (non-fatal):', err.message);
  }

  return [...staticPages, ...categoryUrls, ...movieUrls, ...seriesUrls, ...collectionUrls];
}
