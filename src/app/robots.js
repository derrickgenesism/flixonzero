export default function robots() {
  const baseUrl = 'https://flixon.net';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/movie/',
          '/category/',
          '/series/',
          '/collection/',
          '/search',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/account/',
          '/profiles/',
          '/checkout/',
          '/onboarding/',
          '/force-reset/',
          '/update-password/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/movie/',
          '/category/',
          '/series/',
          '/collection/',
          '/search',
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
          '/checkout/',
          '/onboarding/',
          '/force-reset/',
          '/update-password/',
        ],
        crawlDelay: 0,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
