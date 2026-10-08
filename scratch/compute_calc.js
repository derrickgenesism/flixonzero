// Compute usage calculator for FlixOn
// Budget: 4 hours = 240 minutes = 14,400 seconds per month

const budget = { hours: 4, minutes: 240, seconds: 14400 };

// Time each action takes (in seconds)
const actions = [
  { name: "User opens homepage",          seconds: 0.8,  label: "< 1 second" },
  { name: "User opens a movie page",      seconds: 1.0,  label: "~1 second"  },
  { name: "User opens account page",      seconds: 0.5,  label: "< 1 second" },
  { name: "User makes a payment",         seconds: 1.5,  label: "~1.5 seconds" },
  { name: "Admin opens dashboard",        seconds: 4.5,  label: "~4-5 seconds" },
  { name: "Admin opens any other page",   seconds: 1.0,  label: "~1 second"  },
  { name: "Cron job runs (backup etc)",   seconds: 30,   label: "~30 seconds" },
  { name: "Webhook fires (payment done)", seconds: 0.5,  label: "< 1 second" },
];

// Scenarios
const scenarios = [
  {
    name: "LOW TRAFFIC (50 visitors/day)",
    homepage: 50, moviePages: 80, accounts: 15, payments: 5,
    adminDash: 2, adminOther: 10, crons: 2, webhooks: 5
  },
  {
    name: "MEDIUM TRAFFIC (150 visitors/day)",
    homepage: 150, moviePages: 250, accounts: 45, payments: 15,
    adminDash: 2, adminOther: 15, crons: 2, webhooks: 15
  },
  {
    name: "BUSY TRAFFIC (300 visitors/day)",
    homepage: 300, moviePages: 500, accounts: 90, payments: 30,
    adminDash: 3, adminOther: 20, crons: 2, webhooks: 30
  }
];

console.log("=== YOUR VERCEL FLUID COMPUTE BUDGET ===");
console.log("Monthly limit: 4 hours = 240 minutes = 14,400 seconds");
console.log("");

for (const sc of scenarios) {
  const dailySeconds =
    sc.homepage * 0.8 +
    sc.moviePages * 1.0 +
    sc.accounts * 0.5 +
    sc.payments * 1.5 +
    sc.adminDash * 4.5 +
    sc.adminOther * 1.0 +
    sc.crons * 30 +
    sc.webhooks * 0.5;

  const monthlySeconds = dailySeconds * 30;
  const monthlyMinutes = (monthlySeconds / 60).toFixed(1);
  const monthlyHours = (monthlySeconds / 3600).toFixed(2);
  const percentUsed = ((monthlySeconds / budget.seconds) * 100).toFixed(0);
  const safeOrNot = monthlySeconds > budget.seconds ? "RUNS OUT!" : "SAFE";

  console.log("--- " + sc.name + " ---");
  console.log("  Daily usage:   " + (dailySeconds/60).toFixed(1) + " minutes per day");
  console.log("  Monthly usage: " + monthlyMinutes + " minutes  /  " + monthlyHours + " hours");
  console.log("  Budget used:   " + percentUsed + "% of your 4 hours");
  console.log("  Status:        " + safeOrNot);
  console.log("");
  
  console.log("  Breakdown of where time goes:");
  console.log("    Homepage visits:    " + (sc.homepage * 0.8 * 30 / 60).toFixed(1) + " min/month");
  console.log("    Movie page visits:  " + (sc.moviePages * 1.0 * 30 / 60).toFixed(1) + " min/month");
  console.log("    Account page:       " + (sc.accounts * 0.5 * 30 / 60).toFixed(1) + " min/month");
  console.log("    Payments:           " + (sc.payments * 1.5 * 30 / 60).toFixed(1) + " min/month");
  console.log("    Admin dashboard:    " + (sc.adminDash * 4.5 * 30 / 60).toFixed(1) + " min/month");
  console.log("    Cron jobs:          " + (sc.crons * 30 * 30 / 60).toFixed(1) + " min/month");
  console.log("    Webhooks:           " + (sc.webhooks * 0.5 * 30 / 60).toFixed(1) + " min/month");
  console.log("");
}
