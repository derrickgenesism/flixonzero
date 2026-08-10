export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flixon.com';
  
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
