import { Inter } from "next/font/google";
import "./globals.css";
import MobileBottomNav from "@/components/MobileBottomNav";
import NextTopLoader from 'nextjs-toploader';
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import AffiliateTracker from "@/components/AffiliateTracker";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import React from 'react';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Flixon - Premium Movies & Series",
  description: "Watch the latest premium movies and series on Flixon. Stream or download anytime.",
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} antialiased`}
    >
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="FlixOn" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
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
        <PWAInstallPrompt />
        <MobileBottomNav />
      </body>
    </html>
  );
}
