# 🍿 Turnkey Video & Movie Streaming Platform (SaaS / White-Label)

A modern, high-performance, full-stack video streaming and membership platform built with **Next.js (App Router)**, **Supabase**, and **Tailwind CSS**. Designed for creators, media companies, regional translators, and entrepreneurs wanting to launch their own streaming service like Netflix with built-in subscription monetization, automated payments, and direct/manual Mobile Money payments.

---

## 🌟 Key Features

### 🎬 Streaming Experience
- **Cinematic Homepage**: Dynamic Hero banner, Continue Watching carousel, Top 10, Trending, Free Movies, New Releases, and Categories.
- **Movies & TV Series**: Dedicated episode selector, seasons management, and full multi-season series browsing.
- **Custom Video Player**: HLS and MP4 playback, subtitle support, auto-resume, and watch history tracking.
- **Watchlist & Favorites ("My List")**: Seamless bookmarking for signed-in users.
- **Movie Request System**: Users can request movies; admins can review and fulfill them.
- **PWA Ready**: Works offline-first with home-screen install prompts for iOS & Android.

### 💰 Monetization & Payments
- **Dual Payment Engine**:
  - **Manual / Direct Payments**: Users send money to your personal phone numbers (MTN MoMo, Airtel Money, M-Pesa, Bank, Crypto) and click "I Have Sent Money". Admins approve them in 1-click inside the Admin Panel!
  - **Automated Payments**: Integrated with Flutterwave for direct card payments & automated mobile money PIN prompts.
- **Customizable Subscription Plans**: Create daily, weekly, monthly, and VIP passes with customizable duration in days.
- **Pay-Per-View (PPV Movie Rentals)**: Allow users to rent a single movie for 48 hours without a full subscription.
- **Promo Codes & Gift Cards**: Percentage or flat discounts with usage limits and expiration dates.
- **Conversion-Boosting Urgency Banner**: Configurable limited-time offer countdown timer.
- **Affiliate & Referral CPA System**: Reward users for referring paying subscribers with configurable CPA rewards.

### 🛡️ Security & Administration
- **Admin Dashboard (`/admin`)**: Clean control center for content, users, revenue, and settings.
- **1-Click TMDB Movie Importer**: Auto-fetch posters, cast, release year, genres, and overviews.
- **FraudGuard & IP Shield**: Detects proxies, hosting datacenters, and suspicious VPN abusers while allowing African mobile carriers (MTN & Airtel) to pass safely.
- **Live Threat Defense**: Real-time audit logs, banned IPs, and security event tracking.
- **Telegram Live Alerts**: Receive real-time push alerts on your phone whenever someone pays!

---

## 🚀 Quick Setup & Deployment

For a full step-by-step walkthrough, see **[BUYER_QUICKSTART_GUIDE.md](./BUYER_QUICKSTART_GUIDE.md)**.

1. **Database Setup**: Run [`DATABASE_SETUP.sql`](./DATABASE_SETUP.sql) in your Supabase SQL Editor.
2. **Environment Variables**: Copy `.env.example` to `.env.local` and add your Supabase URL & keys.
3. **Run Locally**:
   ```bash
   npm install
   npm run dev
   ```
4. **Deploy**: Push to GitHub and deploy to [Vercel](https://vercel.com) with 1-click.

---

## 📚 Documentation Links

- 🚀 **[Buyer's Quickstart Guide](./BUYER_QUICKSTART_GUIDE.md)**: From purchase to live website in under 20 minutes.
- 📖 **[Admin & Operations Manual](./ADMIN_USER_MANUAL.md)**: How to manage movies, payments, users, and settings.
- 🗄️ **[Database Setup Script](./DATABASE_SETUP.sql)**: Complete single-click SQL schema.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org)
- **Frontend**: [React 19](https://react.dev), Tailwind CSS, Inter Font
- **Backend / Database**: [Supabase](https://supabase.com) (PostgreSQL, Supabase Auth, Row Level Security)
- **Storage / CDN**: [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) S3-compatible video storage
- **Payments**: Manual Mobile Money / Direct Bank Transfer + Flutterwave API v3
- **Metadata**: [The Movie Database (TMDB) API](https://www.themoviedb.org)
