import { Inter } from "next/font/google";
import "./globals.css";
import MobileBottomNav from "@/components/MobileBottomNav";
import NextTopLoader from 'nextjs-toploader';
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata = {
  title: "Flixon - Premium Movies & Series",
  description: "Watch the latest premium movies and series.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} antialiased`}
    >
      <body>
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
        {children}
        <PWAInstallPrompt />
        <MobileBottomNav />
      </body>
    </html>
  );
}
