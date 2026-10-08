// Deep analysis of every page query - what runs for which user type
// User types: guest (no login), unpaid (logged in, no sub), paid (100 active), admin

const pages = [
  {
    name: "HOMEPAGE",
    queries: [
      { name: "auth.getUser()",              runsFor: "all",     ms: 80,  canRemove: false, note: "Auth check - always needed" },
      { name: "getActiveProfile()",          runsFor: "loggedIn", ms: 120, canRemove: "guests", note: "No point for guests" },
      { name: "movies (ALL rows SELECT *)",  runsFor: "all",     ms: 300, canRemove: false, note: "CACHE WITH ISR" },
      { name: "watch_history (15 rows)",     runsFor: "loggedIn", ms: 80,  canRemove: "unpaid", note: "Unpaid dont watch - SKIP for unpaid" },
      { name: "favorites (20 rows)",         runsFor: "loggedIn", ms: 80,  canRemove: "unpaid", note: "Unpaid dont save - SKIP for unpaid" },
      { name: "admin_settings (categories)", runsFor: "all",     ms: 60,  canRemove: "cache", note: "CACHE - changes never" },
      { name: "admin_settings (sections)",   runsFor: "all",     ms: 60,  canRemove: "cache", note: "CACHE - changes never" },
      { name: "admin_settings (app_url)",    runsFor: "all",     ms: 60,  canRemove: "cache", note: "CACHE - changes never" },
      { name: "series (15 rows)",            runsFor: "all",     ms: 80,  canRemove: "cache", note: "Cache or ISR" },
    ]
  },
  {
    name: "MOVIE PAGE",
    queries: [
      { name: "generateMetadata ? movies",    runsFor: "all",    ms: 100, canRemove: false, note: "SEO required - cache it" },
      { name: "movies SELECT * (movie data)", runsFor: "all",    ms: 100, canRemove: "cache", note: "CACHE WITH ISR per movie ID" },
      { name: "movies (related parts)",       runsFor: "all",    ms: 80,  canRemove: false, note: "Only runs if title has 'Part/Ep'" },
      { name: "movies (more like this)",      runsFor: "all",    ms: 80,  canRemove: false, note: "Reasonable - keep" },
      { name: "auth.getUser()",               runsFor: "all",    ms: 80,  canRemove: false, note: "Must check" },
      { name: "user_profiles (sub check)",    runsFor: "loggedIn",ms: 80, canRemove: false, note: "Must check subscription" },
      { name: "ppv_purchases (ppv check)",    runsFor: "unpaid",  ms: 60, canRemove: false, note: "Needed for PPV users - keep" },
      { name: "watch_history (progress)",     runsFor: "paid",    ms: 60, canRemove: false, note: "Only paid with access - already gated" },
      { name: "favorites check",              runsFor: "loggedIn",ms: 60, canRemove: "client", note: "MOVE TO CLIENT SIDE" },
      { name: "ratings (user own rating)",    runsFor: "loggedIn",ms: 60, canRemove: "client", note: "MOVE TO CLIENT SIDE" },
      { name: "ratings (avg rating ALL rows)",runsFor: "all",    ms: 100, canRemove: "cache", note: "CACHE - aggregate, not realtime" },
      { name: "admin_settings (ppv_price)",   runsFor: "all",    ms: 60,  canRemove: "cache", note: "CACHE IT" },
    ]
  },
  {
    name: "ADMIN DASHBOARD",
    queries: [
      { name: "user_profiles ALL rows",        runsFor: "admin", ms: 800, canRemove: "optimize", note: "HUGE - fetch ONLY counts + last 10" },
      { name: "transactions ALL rows",         runsFor: "admin", ms: 600, canRemove: "optimize", note: "HUGE - fetch last 90 days only" },
      { name: "watch_history 5000 rows",       runsFor: "admin", ms: 1500,canRemove: "optimize", note: "MASSIVE - reduce to 500 rows" },
      { name: "movies count",                  runsFor: "admin", ms: 60,  canRemove: false, note: "Fine - count only" },
      { name: "ppv_purchases",                 runsFor: "admin", ms: 100, canRemove: false, note: "Fine - already filtered" },
      { name: "promo_codes count",             runsFor: "admin", ms: 60,  canRemove: false, note: "Fine - count only" },
      { name: "site_visits ALL rows",          runsFor: "admin", ms: 800, canRemove: "optimize", note: "HUGE - aggregate in DB not JS" },
    ]
  }
];

console.log("========== DEEP QUERY AUDIT ==========");
console.log("");

let totalWaste = 0;
let totalSaveable = 0;

for (const page of pages) {
  const totalMs = page.queries.reduce((s, q) => s + q.ms, 0);
  const wastable = page.queries.filter(q => q.canRemove && q.canRemove !== false).reduce((s, q) => s + q.ms, 0);
  totalWaste += wastable;
  totalSaveable += wastable;
  
  console.log("--- " + page.name + " ---");
  console.log("  Current total: " + totalMs + "ms per visit");
  console.log("  Could save:    " + wastable + "ms (" + Math.round(wastable/totalMs*100) + "%)");
  console.log("");
  
  const issues = page.queries.filter(q => q.canRemove && q.canRemove !== false);
  for (const q of issues) {
    console.log("  FIX [" + q.canRemove.toUpperCase() + "] " + q.name);
    console.log("    ? " + q.note);
  }
  console.log("");
}

// Monthly savings estimate
const homepageVisits = 2500; // 2-3k visitors
const moviePageVisits = 4000;
const adminVisits = 30; // daily

const homeCurrentMs = 920; const homeNewMs = 920 - 340; // ISR + skip unpaid queries
const movieCurrentMs = 880; const movieNewMs = 880 - 220; // cache + client-side
const adminCurrentMs = 3960; const adminNewMs = 3960 - 2900; // optimize heavy queries

const currentTotal = (homepageVisits * homeCurrentMs + moviePageVisits * movieCurrentMs + adminVisits * adminCurrentMs) / 1000;
const newTotal = (homepageVisits * homeNewMs + moviePageVisits * movieNewMs + adminVisits * adminNewMs) / 1000;
// Plus ISR: homepage renders only 24x/day instead of 2500x/month
const isrSavings = (homepageVisits * homeNewMs - 24*30*homeNewMs) / 1000;

console.log("========== MONTHLY SAVINGS ESTIMATE ==========");
console.log("");
console.log("Current monthly compute:");
console.log("  Homepage (2500 visits × 920ms):  " + (homepageVisits * homeCurrentMs / 60000).toFixed(0) + " minutes");
console.log("  Movie pages (4000 visits × 880ms): " + (moviePageVisits * movieCurrentMs / 60000).toFixed(0) + " minutes");  
console.log("  Admin (30 visits × 3960ms):       " + (adminVisits * adminCurrentMs / 60000).toFixed(0) + " minutes");
console.log("  Cron jobs:                         30 minutes");
console.log("  TOTAL CURRENT: ~" + Math.round((homepageVisits*homeCurrentMs + moviePageVisits*movieCurrentMs + adminVisits*adminCurrentMs)/60000 + 30) + " minutes");
console.log("");
console.log("After optimizations:");
console.log("  Homepage (ISR = only 720 renders/month × 580ms): " + (720 * homeNewMs / 60000).toFixed(0) + " minutes  (was " + (homepageVisits * homeCurrentMs / 60000).toFixed(0) + ")");
console.log("  Movie pages (4000 × 660ms):       " + (moviePageVisits * movieNewMs / 60000).toFixed(0) + " minutes  (was " + (moviePageVisits * movieCurrentMs / 60000).toFixed(0) + ")");
console.log("  Admin (30 × 1060ms):              " + (adminVisits * adminNewMs / 60000).toFixed(0) + " minutes  (was " + (adminVisits * adminCurrentMs / 60000).toFixed(0) + ")");
console.log("  Cron jobs:                         30 minutes");
console.log("  TOTAL AFTER: ~" + Math.round((720*homeNewMs + moviePageVisits*movieNewMs + adminVisits*adminNewMs)/60000 + 30) + " minutes");
