import { Inter } from "next/font/google";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
