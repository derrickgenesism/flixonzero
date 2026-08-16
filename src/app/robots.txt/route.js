import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();
  const host = headersList.get('host') || 'flixon.ug';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const content = `User-agent: *
Allow: /
Allow: /movie/
Allow: /category/
Allow: /series/
Allow: /collection/
Allow: /search
Disallow: /admin/
Disallow: /api/
Disallow: /account/
Disallow: /profiles/
Disallow: /checkout/
Disallow: /onboarding/
Disallow: /force-reset/
Disallow: /update-password/

# Priority crawling for VJ category pages
User-agent: Googlebot
Allow: /category/VJ%20Junior
Allow: /category/VJ%20Emmy
Allow: /category/VJ%20ICE%20P
Allow: /category/VJ%20Jingo
Allow: /category/VJ%20Mark
Crawl-delay: 0

Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
