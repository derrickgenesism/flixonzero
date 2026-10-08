// Real calculation based on YOUR actual numbers
// 2,000 visitors/month total
// ~250 logged-in users/month
// ~1,750 just exploring (no login)
// Admin dashboard used daily

console.log("========================================");
console.log(" FLIXON — REAL USAGE CALCULATION");
console.log("========================================");
console.log("");

// ---------- VERCEL CURRENT ----------
console.log("=== VERCEL (current) ===");
console.log("Monthly budget: 4 hours = 240 minutes");
console.log("");

const vercel = {
  // Explorers (no login) - they see homepage, maybe 3-4 pages each
  // Non-logged pages are cheaper - no watch history, no favorites queries
  explorers: 1750,
  explorerPageViews: 1750 * 3, // avg 3 pages each
  explorerTimePerPage: 0.5, // seconds - lighter without user-specific queries

  // Logged-in users - more pages, heavier queries
  loggedIn: 250,
  loggedInPageViews: 250 * 8, // avg 8 pages per month (account, movie, checkout etc)
  loggedInTimePerPage: 1.0, // seconds

  // Admin (you, daily)
  adminDashboard: 30, // once per day x 30 days
  adminDashboardTime: 4.5,
  adminOtherPages: 60, // misc admin actions
  adminOtherTime: 1.0,

  // Payments
  paymentAttempts: 80, // some of the 250 logged-in users pay
  paymentTime: 2.0,

  // Cron jobs (backup + warm reminder)
  cronRuns: 60, // 2 per day x 30
  cronTime: 30,

  // Webhooks (payment confirmations)
  webhooks: 80,
  webhookTime: 0.5,
};

const explorerSeconds = vercel.explorerPageViews * vercel.explorerTimePerPage;
const loggedInSeconds = vercel.loggedInPageViews * vercel.loggedInTimePerPage;
const adminSeconds = (vercel.adminDashboard * vercel.adminDashboardTime) + (vercel.adminOtherPages * vercel.adminOtherTime);
const paymentSeconds = vercel.paymentAttempts * vercel.paymentTime;
const cronSeconds = vercel.cronRuns * vercel.cronTime;
const webhookSeconds = vercel.webhooks * vercel.webhookTime;

const totalSeconds = explorerSeconds + loggedInSeconds + adminSeconds + paymentSeconds + cronSeconds + webhookSeconds;
const totalMinutes = (totalSeconds / 60).toFixed(1);
const totalHours = (totalSeconds / 3600).toFixed(2);
const percentUsed = ((totalSeconds / 14400) * 100).toFixed(0);

console.log("WHERE YOUR 4 HOURS GO:");
console.log("  1,750 explorers (3 pages each):  " + (explorerSeconds/60).toFixed(0) + " minutes");
console.log("  250 logged-in users (8 pages):   " + (loggedInSeconds/60).toFixed(0) + " minutes");
console.log("  Admin dashboard (daily):          " + (adminSeconds/60).toFixed(0) + " minutes");
console.log("  Payments processing:              " + (paymentSeconds/60).toFixed(0) + " minutes");
console.log("  Cron jobs (backup, reminders):    " + (cronSeconds/60).toFixed(0) + " minutes");
console.log("  Webhooks (payment confirmations): " + (webhookSeconds/60).toFixed(0) + " minutes");
console.log("");
console.log("  TOTAL: " + totalMinutes + " minutes = " + totalHours + " hours");
console.log("  Budget used: " + percentUsed + "% of your 4 hours");
console.log("  Status: " + (totalSeconds > 14400 ? "RUNS OUT" : "SAFE - " + (240 - totalMinutes) + " minutes remaining"));

// WITH ISR FIX
const explorerWithISR = (24 * 0.8 * 30); // 24 renders per day instead of 5,250
const savedMinutes = ((explorerSeconds - explorerWithISR) / 60).toFixed(0);
const newTotal = (totalSeconds - explorerSeconds + explorerWithISR);
console.log("");
console.log("  IF we apply the ISR fix to homepage:");
console.log("    Explorer compute drops from " + (explorerSeconds/60).toFixed(0) + " min to " + (explorerWithISR/60).toFixed(0) + " min");
console.log("    Total drops to: " + (newTotal/60).toFixed(0) + " minutes = " + (newTotal/3600).toFixed(2) + " hours");
console.log("    Budget used: " + ((newTotal/14400)*100).toFixed(0) + "% (very safe even if you double traffic)");

console.log("");
console.log("");

// ---------- NETLIFY ----------
console.log("=== NETLIFY FREE (125,000 function calls/month) ===");
console.log("");

// Netlify counts REQUESTS, not time
// Each page = 1 function call for the page render
// Each Supabase query inside happens in the same function call (counted as 1)
const netlifyPageViews = vercel.explorerPageViews + vercel.loggedInPageViews + vercel.adminDashboard + vercel.adminOtherPages;
const netlifyPayments = vercel.paymentAttempts * 3; // initiate + verify + webhook
const netlifyCrons = vercel.cronRuns;
const netlifyTotal = netlifyPageViews + netlifyPayments + netlifyCrons;

console.log("  Explorer page views (3 pages x 1750):  " + vercel.explorerPageViews + " calls");
console.log("  Logged-in page views (8 pages x 250):  " + vercel.loggedInPageViews + " calls");
console.log("  Admin (dashboard + other):              " + (vercel.adminDashboard + vercel.adminOtherPages) + " calls");
console.log("  Payment flows:                          " + netlifyPayments + " calls");
console.log("  Cron jobs:                              " + netlifyCrons + " calls");
console.log("");
console.log("  TOTAL: " + netlifyTotal + " calls of your 125,000 limit");
console.log("  Percent used: " + ((netlifyTotal/125000)*100).toFixed(1) + "%");
console.log("  You could grow to: " + Math.floor(125000/netlifyTotal) + "x your current traffic and still be free");
console.log("  Safe for how long: Years at this traffic level");

console.log("");
console.log("");

// ---------- RENDER ----------
console.log("=== RENDER FREE (750 hours/month, sleeps after 15 min) ===");
console.log("");
console.log("  750 hours/month = 25 hours/day = basically unlimited");
console.log("  Problem: sleeps after 15 min of no traffic");
console.log("  Solution: UptimeRobot (free tool) pings site every 14 min");
console.log("    - UptimeRobot free plan: 50 monitors, checks every 5 minutes");
console.log("    - This keeps Render awake 24/7 for free");
console.log("    - First visitor never hits a sleeping site");
console.log("");
console.log("  BUT: Render does NOT support Vercel cron jobs format");
console.log("  Crons need to be rewritten for Render (or use external cron service)");
console.log("  Migration effort: Medium (2-4 hours of changes)");
