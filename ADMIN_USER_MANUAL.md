# 📖 Administrator & Operations Manual
## Turnkey Video & Movie Streaming Platform

This manual covers the day-to-day operation and administration of your streaming platform, from adding content and managing subscriptions to approving manual payments and managing affiliates.

---

## 📑 Table of Contents

1. [Accessing the Admin Portal](#1-accessing-the-admin-portal)
2. [Setting Up Manual Payments (No API Required)](#2-setting-up-manual-payments-no-api-required)
3. [Approving & Managing Manual Customer Payments](#3-approving--managing-manual-customer-payments)
4. [Adding & Managing Movies](#4-adding--managing-movies)
5. [Adding & Managing TV Series & Episodes](#5-adding--managing-tv-series--episodes)
6. [Managing Subscription Plans & Pricing](#6-managing-subscription-plans--pricing)
7. [User & Member Management](#7-user--member-management)
8. [Promo Codes & Limited-Time Offers](#8-promo-codes--limited-time-offers)
9. [Affiliate & Referral CPA System](#9-affiliate--referral-cpa-system)
10. [Security Shield, VPN Blocking & Banned IPs](#10-security-shield-vpn-blocking--banned-ips)
11. [Live Telegram Notifications](#11-live-telegram-notifications)
12. [Cloudflare R2 Video Hosting Setup](#12-cloudflare-r2-video-hosting-setup)

---

## 1. Accessing the Admin Portal

- **URL**: `https://your-domain.com/admin`
- **Login Requirement**: An account in `user_profiles` with `role = 'administrator'`.
- If you ever need to grant administrator rights to an account, run this in your Supabase SQL Editor:
  ```sql
  UPDATE public.user_profiles 
  SET role = 'administrator' 
  WHERE email = 'admin@yourdomain.com';
  ```

---

## 2. Setting Up Manual Payments (No API Required)

This platform features a built-in **Direct / Manual Payment** mode specifically designed for markets where business merchant payment gateways are hard to obtain, or when you want customers to pay you directly to your personal Mobile Money or Bank accounts.

### How to configure:
1. In the Admin Dashboard, click **Settings** (`/admin/settings`).
2. Scroll to **📱 Manual Payments (No API Required)**:
   - **Enable Manual Payment Mode**: Check the box.
   - **Payment Method Title**: e.g., `MTN MoMo, Airtel Money & Bank Transfer`
   - **Payment Receiving Numbers & Accounts**:
     ```text
     MTN Mobile Money: 0772123456 (Account: Jane Doe)
     Airtel Money: 0752123456 (Account: Jane Doe)
     Equity Bank: 1002003004 (Account: Jane Doe)
     ```
   - **Instructions for Customer**:
     ```text
     1. Send the plan amount to one of our official numbers above.
     2. Enter the phone number or sender name you paid with below.
     3. Click "I Have Sent Money". Our team will verify and activate your subscription in 5-15 minutes!
     ```
3. Click **"Save Settings"**.

---

## 3. Approving & Managing Manual Customer Payments

When a customer pays via Manual Payment, the transaction status is marked as `Pending Approval`.

### Step-by-Step Approval:
1. Go to **Admin Dashboard** > **Transactions** (`/admin/transactions`).
2. Click the **📱 Manual Pending** tab.
3. You will see a list of submissions with:
   - **Customer Email**: Who wants the subscription.
   - **Amount & Plan**: How much and which plan they selected.
   - **Paid From**: The phone number or account the customer entered.
   - **Reference / Notes**: Any receipt reference or sender note.
   - **Status**: `Needs Approval` (highlighted in yellow).
4. Check your phone / mobile money SMS / bank app to confirm you received the funds.
5. Click **"✓ Approve"**:
   - The transaction status changes to `successful`.
   - The user's account is **immediately granted access** for the duration of the plan.
   - If the user was referred by an affiliate, the affiliate automatically gets credited!
   - If the customer is still on the checkout page, they will automatically be redirected to the homepage with active access!
6. If the customer didn't send money, click **"✕ Reject"** to mark the transaction as failed.

---

## 4. Adding & Managing Movies

### Option A: 1-Click TMDB Auto-Import (Recommended)
1. Get a free API Key from [https://www.themoviedb.org](https://www.themoviedb.org/settings/api).
2. Save it in **Admin Settings** > **TMDB API Key**.
3. Go to **Movies** > **Add Movie**.
4. In the **"Search TMDB"** field, type the movie name (e.g. *Inception*) and select the search result.
5. Title, description, poster, release year, cast, and genres will fill automatically!
6. Paste your streaming **Video URL** (Cloudflare R2 link, MP4 link, or HLS `.m3u8`).
7. Set Access Type:
   - **Premium**: Requires active subscription.
   - **Free**: Any registered user can watch.
8. Click **"Save Movie"**.

### Option B: Manual Entry
You can manually upload or paste image links for posters, enter custom titles, descriptions, and VJ/translator/director names.

---

## 5. Adding & Managing TV Series & Episodes

1. Go to **Series** (`/admin/series`).
2. Click **"Add New Series"**.
3. Fill in the Series Title, Overview, Poster URL, and Release Year.
4. Click into the newly created series:
   - Click **"Add Season"** (e.g. Season 1).
   - Click **"Add Episode"**: Enter Episode Number (e.g. 1), Episode Title, and Episode Video URL.
5. Users can now browse episodes with season selectors and episode cards!

---

## 6. Managing Subscription Plans & Pricing

1. Go to **Plans** (`/admin/plans`).
2. Edit existing plans or click **"Create Plan"**:
   - **Plan Name**: e.g., `Weekend Binge Pass`, `Monthly VIP`
   - **Price**: Enter price in your configured currency (e.g. 15,000).
   - **Duration (Days)**: Number of days of access granted upon payment (e.g. 30).
   - **Features**: Comma-separated list of perks shown to users.
   - **Active Toggle**: Hide or show plans on checkout.
3. Click **"Save"**. Changes appear immediately on `/checkout`.

---

## 7. User & Member Management

1. Go to **Users** (`/admin/users`).
2. View all registered accounts, their emails, subscription status, and expiry dates.
3. Click on any user to:
   - **Extend or Grant Subscription**: Add custom days (e.g. +7 days, +30 days).
   - **Cancel Subscription**: Set expiry date to past.
   - **Change Role**: Upgrade trusted users to `administrator`.
   - **Reset Password**: Send password reset email.

---

## 8. Promo Codes & Limited-Time Offers

### Promo Codes:
1. Go to **Promo Codes** (`/admin/promo-codes`).
2. Click **"Create Promo Code"**:
   - **Code**: e.g., `SAVE50`, `WELCOME10`
   - **Type**: Percentage discount (e.g. 50%) or Fixed amount (e.g. 5,000 UGX).
   - **Max Uses**: Optional limit on total redemptions.
   - **Expires At**: Optional expiration date.
3. Users can enter this code on `/checkout` to receive instant discounts.

### Limited-Time Offer Countdown Banner:
1. Go to **Settings** (`/admin/settings`).
2. Under **Limited-Time Offer Countdown**:
   - Enable the countdown timer.
   - Set length (e.g. 60 minutes) and discount display (e.g. 50% OFF).
   - This creates urgency on checkout and movie preview pages to maximize conversion!

---

## 9. Affiliate & Referral CPA System

1. Go to **Settings** (`/admin/settings`) > **Referral & Affiliate System**:
   - Check **"Enable Referral System"**.
   - Choose reward type: Flat amount per paying customer or percentage of plan price.
2. In **Payouts** (`/admin/payouts`):
   - Review payout requests from top affiliates.
   - Mark as paid after sending their mobile money reward.

---

## 10. Security Shield, VPN Blocking & Banned IPs

1. Go to **Settings** > **🛡️ Security & VPN Shield**:
   - Enable **Block VPN & Proxy Connections**.
   - Choose scope: **Whole Platform** or **Checkout Only**.
   - Intelligent detection allows Ugandan & African mobile carriers (MTN & Airtel) to pass while blocking automated bots and VPN fraud.
2. View real-time security events, blocked attempts, and ban malicious IPs in **Security Center** (`/admin/security-logs`).

---

## 11. Live Telegram Notifications

Get instant notifications on your phone whenever someone submits a payment!

1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`, choose a name, and copy the **Bot Token**.
3. Start a conversation with your bot or add it to a private admin group.
4. Get your **Chat ID** (using `@userinfobot` or `@getmyid_bot`).
5. In **Admin Settings**, paste:
   - `telegram_bot_token`
   - `telegram_chat_id`
6. Click **Save Settings**. You will now receive instant alerts whenever:
   - A customer submits a manual payment.
   - An automated payment is confirmed.
   - An affiliate earns a commission.

---

## 12. Cloudflare R2 Video Hosting Setup

Cloudflare R2 provides S3-compatible cloud video storage with **$0 egress fees** (meaning no surprise bills even if millions of people stream your videos!).

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com) and go to **R2 Object Storage**.
2. Click **"Create Bucket"** (e.g. `movies-vault`).
3. Click **"Manage R2 API Tokens"** > **"Create API Token"** with Object Read & Write permissions.
4. In **Admin Settings** (`/admin/settings`), paste:
   - **Cloudflare Account ID**
   - **R2 Bucket Name**
   - **R2 Access Key ID**
   - **R2 Secret Access Key**
   - **CDN Domain** (Connect your custom domain or Cloudflare public bucket URL)
5. Save settings. You can now stream videos seamlessly!
