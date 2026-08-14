import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();
  const host = headersList.get('host') || 'flixon.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;
  const content = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /account/

Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain' }
  });
}
