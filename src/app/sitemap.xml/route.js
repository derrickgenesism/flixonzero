import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();
  const host = headersList.get('host') || 'flixon.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const { data: movies } = await supabase
    .from('movies')
    .select('id, updated_at')
    .order('updated_at', { ascending: false });

  const { data: collections } = await supabase
    .from('collections')
    .select('slug, created_at')
    .eq('is_active', true);

  const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/checkout', priority: '0.8', changefreq: 'weekly' },
    { url: '/search', priority: '0.6', changefreq: 'weekly' },
  ];

  const movieUrls = (movies || []).map(m => ({
    url: `/movie/${m.id}`,
    priority: '0.9',
    changefreq: 'weekly',
    lastmod: m.updated_at ? new Date(m.updated_at).toISOString().split('T')[0] : undefined
  }));

  const collectionUrls = (collections || []).map(c => ({
    url: `/collection/${c.slug}`,
    priority: '0.7',
    changefreq: 'weekly'
  }));

  const allUrls = [...staticPages, ...movieUrls, ...collectionUrls];

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
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
