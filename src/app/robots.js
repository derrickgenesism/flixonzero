export default function robots() {
  const baseUrl = 'https://flixon.net';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/movie/',
          '/movies',
          '/category/',
          '/series/',
          '/series',
          '/collection/',
          '/search',
          '/checkout',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/profiles/',
          '/onboarding/',
          '/force-reset/',
          '/update-password/',
          '/ip-blocked',
          '/vpn-blocked',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/movie/',
          '/movies',
          '/category/',
          '/series/',
          '/series',
          '/collection/',
          '/search',
          '/checkout',
          '/category/VJ%20Junior',
          '/category/VJ%20Emmy',
          '/category/VJ%20ICE%20P',
          '/category/VJ%20Jingo',
          '/category/VJ%20Mark',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/profiles/',
          '/onboarding/',
          '/force-reset/',
          '/update-password/',
          '/ip-blocked',
          '/vpn-blocked',
        ],
        crawlDelay: 0,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
