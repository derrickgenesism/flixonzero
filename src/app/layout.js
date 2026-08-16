import { Inter } from "next/font/google";
import "./globals.css";
import MobileBottomNav from "@/components/MobileBottomNav";
import NextTopLoader from 'nextjs-toploader';
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import AffiliateTracker from "@/components/AffiliateTracker";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import Link from 'next/link';
import React from 'react';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://flixon.ug'),
  title: {
    default: 'FlixOn Uganda — Watch VJ Translated Movies Online | Luganda Dubbed Films',
    template: '%s | FlixOn Uganda',
  },
  description: 'FlixOn is Uganda\'s #1 streaming platform for VJ translated movies. Watch the latest Hollywood and Bollywood films dubbed in Luganda by VJ Junior, VJ Emmy, VJ Ice P, VJ Jingo, VJ Mark and more. Stream or download movies online in Uganda.',
  keywords: [
    // VJ Specific
    'VJ Junior movies', 'VJ Emmy movies', 'VJ Ice P movies', 'VJ Jingo movies',
    'VJ Mark movies', 'VJ Kamil movies', 'VJ Junior translated movies',
    'VJ Emmy translated movies', 'VJ Ice P translated movies',
    'VJ Junior Uganda', 'VJ Emmy Uganda', 'VJ Ice P Uganda',
    // Translated Movies
    'translated movies Uganda', 'Luganda movies', 'Luganda dubbed movies',
    'VJ translated movies Uganda', 'VJ voice over movies Uganda',
    'Luganda translated movies', 'movies in Luganda', 'Luganda film',
    // Uganda Streaming
    'watch movies Uganda', 'stream movies Uganda', 'Uganda movies online',
    'Uganda streaming platform', 'Uganda Netflix', 'Uganda streaming',
    'download movies Uganda', 'watch online Uganda', 'movies Uganda',
    'FlixOn Uganda', 'FlixOn movies', 'Ugandan movies', 'Uganda film streaming',
    // Genre + Uganda
    'action movies Uganda', 'comedy movies Uganda', 'horror movies Uganda',
    'drama movies Uganda', 'romance movies Uganda', 'thriller movies Uganda',
    // General
    'watch movies online Uganda', 'free movies Uganda', 'latest movies Uganda',
    'Hollywood movies Uganda', 'Bollywood movies Uganda',
  ],
  openGraph: {
    type: 'website',
    siteName: 'FlixOn Uganda',
    title: 'FlixOn Uganda — Watch VJ Translated Movies Online',
    description: 'Uganda\'s #1 platform for VJ translated movies. Stream the latest films dubbed in Luganda by VJ Junior, VJ Emmy, VJ Ice P and more.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'FlixOn Uganda - VJ Translated Movies' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@FlixOnUganda',
    title: 'FlixOn Uganda — Watch VJ Translated Movies Online',
    description: 'Uganda\'s #1 platform for VJ translated movies. Stream the latest films dubbed in Luganda.',
    images: ['/og-image.png'],
  },
  manifest: "/manifest.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const VJ_CATEGORIES = [
  { name: 'VJ Junior', slug: 'VJ Junior' },
  { name: 'VJ Emmy', slug: 'VJ Emmy' },
  { name: 'VJ Ice P', slug: 'VJ ICE P' },
  { name: 'VJ Jingo', slug: 'VJ Jingo' },
  { name: 'VJ Mark', slug: 'VJ Mark' },
];

const GENRE_CATEGORIES = [
  { name: 'Action', slug: 'Action' },
  { name: 'Comedy', slug: 'Comedy' },
  { name: 'Drama', slug: 'Drama' },
  { name: 'Horror', slug: 'Horror' },
  { name: 'Romance', slug: 'Romance' },
  { name: 'Adventure', slug: 'Adventure' },
  { name: 'Thriller', slug: 'Thriller' },
  { name: 'Animation', slug: 'Animation' },
];

export default function RootLayout({ children }) {
  return (
    <html
      lang="en-UG"
      className={`${inter.variable} antialiased`}
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FlixOn Uganda" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="geo.region" content="UG" />
        <meta name="geo.placename" content="Uganda" />
        <meta name="language" content="English" />
      </head>
      <body>
        <ServiceWorkerRegistrar />
        <NextTopLoader
          color="#e50914"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #e50914,0 0 5px #e50914"
        />
        <React.Suspense fallback={null}>
          <AffiliateTracker />
          <AnalyticsTracker />
        </React.Suspense>
        {children}
        {/* SEO Internal Linking Footer — Critical for Google authority passing */}
        <footer aria-label="Site navigation" style={{ background: 'var(--bg2)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '32px 40px 80px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px 48px', marginBottom: '24px' }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--acc)', marginBottom: '12px', margin: '0 0 12px' }}>VJ Translators</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {VJ_CATEGORIES.map(vj => (
                    <li key={vj.slug}>
                      <Link href={`/category/${encodeURIComponent(vj.slug)}`} style={{ color: 'var(--text3)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                      >
                        {vj.name} Translated Movies
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--acc)', margin: '0 0 12px' }}>Browse by Genre</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {GENRE_CATEGORIES.map(g => (
                    <li key={g.slug}>
                      <Link href={`/category/${encodeURIComponent(g.slug)}`} style={{ color: 'var(--text3)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                      >
                        {g.name} Movies
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--acc)', margin: '0 0 12px' }}>FlixOn Uganda</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: 'Watch Movies Online', href: '/' },
                    { label: 'Free Movies Uganda', href: '/?category=Free' },
                    { label: 'Latest Movies 2026', href: '/?category=New%20Arrivals' },
                    { label: 'TV Series Uganda', href: '/series' },
                    { label: 'Top Rated Movies', href: '/?category=Top%20Rated' },
                  ].map(l => (
                    <li key={l.href}>
                      <Link href={l.href} style={{ color: 'var(--text3)', fontSize: '13px', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>
                © {new Date().getFullYear()} FlixOn Uganda — Uganda&apos;s #1 VJ Translated Movie Streaming Platform
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text3)', margin: 0 }}>
                Watch movies in Luganda online • VJ Junior • VJ Emmy • VJ Ice P • VJ Jingo • VJ Mark
              </p>
            </div>
          </div>
        </footer>
        <PWAInstallPrompt />
        <MobileBottomNav />
      </body>
    </html>
  );
}
