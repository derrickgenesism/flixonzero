# 🚀 Turnkey Video & Movie Streaming Platform — Buyer's Quickstart Guide

Congratulations on acquiring this complete, production-ready video and movie streaming membership platform! 

This guide will walk you through launching your platform in **under 20 minutes**, customizing it with your own name, logo, and currency, pushing it to your GitHub, and setting up **Manual Payments (Mobile Money / Bank Transfer)** so you can start charging users immediately without needing any merchant APIs!

---

## 📋 What You Get Out of the Box

- 🎬 **Full Netflix-Style Streaming Web App**: Responsive UI for desktop, tablet, and mobile.
- 📱 **Progressive Web App (PWA)**: Users can install it directly onto Android and iOS homescreens like a native app.
- 💳 **Dual Payment System**:
  - **Manual / Direct Payment**: Users send money to your MTN/Airtel/M-Pesa/Bank accounts, submit their number, and you approve them with 1-click in the Admin Dashboard! (No API keys needed).
  - **Automated Payment**: Built-in support for Flutterwave automated telecom prompts & card payments.
- ⚙️ **Complete Admin Dashboard (`/admin`)**:
  - Add & edit movies and TV series (seasons & episodes).
  - 1-click automatic movie metadata & poster import via TMDB.
  - Video streaming via Cloudflare R2 or direct video links.
  - Manage subscription plans, pricing, and durations.
  - 1-click manual payment verification & approval.
  - Manage users, roles, and expiry dates.
  - Promo codes & gift codes system.
  - Affiliate & referral commission system.
  - Live customer support chat & movie requests system.
  - Advanced Security Shield & VPN blocker.

---

## 🛠️ Launch Steps (Summary)

1. [Set up Free Database (Supabase)](#step-1-create-your-database-supabase)
2. [Customize Your Brand & Currency](#step-2-customize-your-brand-name--currency)
3. [Push Code to Your GitHub](#step-3-push-code-to-your-github)
4. [Deploy for Free on Vercel](#step-4-deploy-to-vercel)
5. [Log into Admin & Enable Manual Payments](#step-5-log-into-admin--enable-manual-payments)
6. [Add Your First Movie & Start Selling](#step-6-add-movies--stream)

---

## Step 1: Create Your Database (Supabase)

The platform uses **Supabase** (PostgreSQL + Auth + Storage), which offers a generous **free tier**.

1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **"New Project"**.
   - **Name**: e.g., `MyStreamingApp`
   - **Database Password**: Choose a strong password and save it somewhere secure.
   - **Region**: Choose the region closest to your audience.
   - Click **"Create new project"** (takes about 1-2 minutes to initialize).
3. In your Supabase Dashboard:
   - Click on the **SQL Editor** icon in the left sidebar.
   - Click **"New Query"**.
   - Open the file [`DATABASE_SETUP.sql`](./DATABASE_SETUP.sql) included in this repository.
   - Copy the entire SQL content, paste it into the Supabase SQL editor, and click **"Run"** (green button).
   - You should see `Success. No rows returned`. All tables, triggers, and default settings are now created!
4. Get your API credentials:
   - Go to **Project Settings** (gear icon at the bottom left) > **API**.
   - Note down:
     - **Project URL** (`https://xyz.supabase.co`)
     - **anon / public key** (`ey...`)
     - **service_role key** (secret key used by the backend to manage subscriptions)

---

## Step 2: Customize Your Brand Name & Currency

You can customize your brand name in **two ways**:

### Method A: In Admin Settings (No code editing needed!)
Once you log into your Admin Dashboard (`/admin/settings`), you can change:
- **Platform Name**: (e.g. `StreamZone`, `CineUganda`, `AfroFlix`)
- **Platform Currency**: (e.g. `UGX`, `USD`, `KES`, `NGN`, `TZS`, `GHS`, `EUR`, `GBP`)
- **Manual Payment Numbers & Instructions**

### Method B: In Code / Environment Variables
Open `src/config/site.js` to change defaults, or set these in your `.env.local` / Vercel Environment Variables:
```env
NEXT_PUBLIC_APP_NAME=MyPlatform
NEXT_PUBLIC_CURRENCY=UGX
NEXT_PUBLIC_SITE_URL=https://myplatform.com
```

### Changing Your Logo:
- Replace `public/logo.png` with your own transparent PNG logo (recommended height: 80px).
- Replace `public/favicon.ico` with your icon.

---

## Step 3: Push Code to Your GitHub

1. Create a new repository on your GitHub account ([https://github.com/new](https://github.com/new)):
   - Repository name: e.g. `my-movie-platform`
   - Set to **Private** (recommended).
   - Do NOT check "Initialize with README".
2. On your computer terminal inside the project directory:
```bash
git init
git add .
git commit -m "Initial commit of streaming platform"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/my-movie-platform.git
git push -u origin main
```

---

## Step 4: Deploy to Vercel (Free Hosting)

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **"Add New..."** > **"Project"**.
3. Select your newly pushed GitHub repository and click **"Import"**.
4. In the **"Environment Variables"** section, add the following variables:

| Variable Name | Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-ref.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhb...` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhb...` | Your Supabase service_role secret key |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Your live website domain |
| `NEXT_PUBLIC_APP_NAME` | `Your Brand Name` | Name shown on website and emails |
| `NEXT_PUBLIC_CURRENCY` | `UGX` (or USD, KES, NGN) | Currency symbol |
| `CRON_SECRET` | `any-random-string-12345` | Secret for cache warmers & background jobs |

5. Click **"Deploy"**.
6. Within 2 minutes, your website is live worldwide with free SSL!

---

## Step 5: Log into Admin & Enable Manual Payments

### 1. Make Yourself an Administrator
1. Go to your live website and click **"Sign In"** > register an account with your email and password.
2. Go to your **Supabase Dashboard** > **SQL Editor** and run:
```sql
UPDATE public.user_profiles 
SET role = 'administrator' 
WHERE email = 'your-email@example.com';
```
3. Now go to `https://your-domain.com/admin` — you have full administrator access!

### 2. Configure Manual Payments (Mobile Money / Bank Transfer)
1. Go to **Admin Dashboard** > **Settings** (`/admin/settings`).
2. Find the **📱 Manual Payments (No API Required)** section:
   - Check **"Enable Manual / Direct Payment Mode"**.
   - **Payment Method Title**: e.g. `MTN MoMo & Airtel Money`
   - **Payment Receiving Numbers**: Enter your phone numbers or accounts line-by-line:
     ```text
     MTN Mobile Money: 0772123456 (John Doe)
     Airtel Money: 0752123456 (John Doe)
     ```
   - **Instructions for Customer**: Customize instructions:
     ```text
     1. Send the plan price to any of our official numbers above.
     2. Enter the phone number you used to send payment below.
     3. Click "I Have Sent Money". Our team will verify and activate your subscription in 5-15 minutes!
     ```
3. Click **"Save Settings"**.

### 3. How Manual Payments Work in Action
1. **User visits `/checkout`**:
   - Picks a subscription plan (e.g. Weekly Pass - 5,000 UGX).
   - Sees your payment numbers with 1-tap **"Copy"** buttons.
   - Sends money via their phone or bank app.
   - Enters their phone number (e.g. `0772123456`) and clicks **"I Have Sent Money (Submit)"**.
2. **You (The Admin)**:
   - Open your Admin Dashboard and click **Transactions** (`/admin/transactions`).
   - Click the **📱 Manual Pending** tab.
   - You will see the customer's email, plan, amount, and the phone number they paid from.
   - Check your Mobile Money phone SMS or statement to confirm receipt.
   - Click **"✓ Approve"**!
   - Instantly, the customer's subscription is activated for the plan duration, and they can watch immediately!

---

## Step 6: Add Movies & Start Streaming

### Free Video Hosting Options:
1. **Cloudflare R2 (Recommended)**: 
   - Super affordable (zero egress bandwidth fees!).
   - In `/admin/settings`, add your Cloudflare R2 Account ID, Bucket Name, and Access Keys.
   - Videos stream fast worldwide.
2. **Direct Video Links**:
   - You can paste any direct MP4 / HLS (`.m3u8`) streaming URL into the movie's `Video URL` field.

### Adding Movies:
1. Go to **Admin Dashboard** > **Movies** > **Add Movie**.
2. **Automatic TMDB Import**:
   - If you add a free TMDB API key in Settings, simply type the movie title (e.g. *Avatar: The Way of Water*) and click **"Search TMDB"**.
   - It will automatically fill the poster, description, release year, cast, and genres for you!
3. Paste the **Video URL** and choose whether it is **Free** or **Premium (Subscription required)**.
4. Click **"Save Movie"**. It is now live on your homepage!

---

## 💡 Troubleshooting & FAQ

- **Q: Can I change subscription plan prices?**
  - Yes! Go to `/admin/plans` and you can edit names, prices, durations (in days), and features, or create new plans.
- **Q: Can I use both Flutterwave automated payments and Manual payments together?**
  - Yes! If Flutterwave keys are entered, users can choose between an instant telecom PIN prompt OR manual transfer. If no Flutterwave keys are entered, the system automatically uses Manual payment without showing any error!
- **Q: How do I receive Telegram alerts when someone pays?**
  - In `/admin/settings`, add your `telegram_bot_token` and `telegram_chat_id`. The platform will automatically message your Telegram bot every time someone submits a manual payment or purchases a plan!
