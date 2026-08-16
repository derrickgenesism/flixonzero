import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// All known categories and VJ translators — hard-coded to ensure they're always indexed
const STATIC_CATEGORIES = [
  // VJ Translators — highest priority (our main competitive edge)
  'VJ Junior', 'VJ Emmy', 'VJ ICE P', 'VJ Jingo', 'VJ Mark', 'VJ Kamil',
  // Genres
  'Action', 'Adventure', 'Drama', 'Comedy', 'Science Fiction', 'Horror',
  'Thriller', 'Romance', 'Family', 'Animation', 'Crime', 'Mystery',
  'Biography', 'History', 'Sport', 'War', 'Music', 'Documentary',
];

export async function GET() {
  const headersList = await headers();
  const host = headersList.get('host') || 'flixon.ug';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  // Movies
  const { data: movies } = await supabase
    .from('movies')
    .select('id, updated_at, title')
    .order('updated_at', { ascending: false });

  // Series
  const { data: series } = await supabase
    .from('series')
    .select('id, created_at')
    .order('created_at', { ascending: false });

  // Collections
  const { data: collections } = await supabase
    .from('collections')
    .select('slug, created_at')
    .eq('is_active', true);

  // Dynamic categories from DB (in case there are more)
  const { data: dbCategories } = await supabase
    .from('movies')
    .select('categories');

  const allDbCategories = new Set(STATIC_CATEGORIES);
  dbCategories?.forEach(row => {
    if (Array.isArray(row.categories)) {
      row.categories.forEach(cat => {
        if (cat && cat.trim()) allDbCategories.add(cat.trim());
      });
    }
  });

  // Static pages
  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/checkout', priority: '0.9', changefreq: 'weekly' },
    { url: '/series', priority: '0.8', changefreq: 'daily' },
    { url: '/search', priority: '0.7', changefreq: 'weekly' },
  ];

  // Category pages — VJ pages get highest priority
  const categoryUrls = Array.from(allDbCategories).map(cat => {
    const isVJ = cat.toLowerCase().startsWith('vj');
    return {
      url: `/category/${encodeURIComponent(cat)}`,
      priority: isVJ ? '0.95' : '0.80',
      changefreq: 'daily',
    };
  });

  // Movie pages
  const movieUrls = (movies || []).map(m => ({
    url: `/movie/${m.id}`,
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: m.updated_at ? new Date(m.updated_at).toISOString().split('T')[0] : undefined,
    // extra: use title in comment for readability
  }));

  // Series pages
  const seriesUrls = (series || []).map(s => ({
    url: `/series/${s.id}`,
    priority: '0.75',
    changefreq: 'weekly',
    lastmod: s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : undefined,
  }));

  // Collection pages
  const collectionUrls = (collections || []).map(c => ({
    url: `/collection/${c.slug}`,
    priority: '0.70',
    changefreq: 'weekly',
  }));

  const allUrls = [...staticPages, ...categoryUrls, ...movieUrls, ...seriesUrls, ...collectionUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allUrls.map(u => `  <url>
    <loc>${baseUrl}${u.url}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
    }
  });
}
