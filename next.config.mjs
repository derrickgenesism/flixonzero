/** @type {import('next').NextConfig} */

// Payment / subscription-state routes must NEVER be cached by the browser,
// a CDN, or a service worker.
const noStore = [
  { key: 'Cache-Control', value: 'private, no-cache, no-store, max-age=0, must-revalidate' },
  { key: 'CDN-Cache-Control', value: 'no-store' },
  { key: 'Vercel-CDN-Cache-Control', value: 'no-store' },
];

const nextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
  },
  async headers() {
    return [
      { source: '/sw.js', headers: noStore },
      { source: '/checkout/:path*', headers: noStore },
      { source: '/account/:path*', headers: noStore },
      { source: '/api/payment/:path*', headers: noStore },
      { source: '/api/ppv/:path*', headers: noStore },
      { source: '/api/webhooks/:path*', headers: noStore },
      { source: '/api/v1/me', headers: noStore },
    ];
  },
};

export default nextConfig;
