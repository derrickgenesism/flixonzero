/**
 * Watch Time Super-Conversion Engine
 *
 * Implements the supercharged rewards requested:
 * - 1,000 UGX -> 3 Days (3.0x bonus vs standard 1-day pass)
 * - 3,000 UGX -> 21 Days / 3 Weeks (1.5x bonus vs standard 14-day pass)
 * - 8,000 UGX -> 40 Days (1.33x bonus vs standard 30-day pass)
 *
 * Algorithmic greedy decomposition also scales to any custom amount,
 * multi-month packages, or future database plans.
 */

export function calculateBonusWatchDays(amount, activePlans = []) {
  const amt = Math.floor(Number(amount) || 0);
  if (amt < 1000) return 0;

  let remaining = amt;
  let totalDays = 0;

  // 1. Check for any higher VIP plans in the database (e.g. 90-day / 3-month VIP passes > 8,000 UGX)
  if (Array.isArray(activePlans) && activePlans.length > 0) {
    const higherPlans = activePlans
      .filter(p => p.is_active && Number(p.price) > 8000 && Number(p.duration_days) > 30)
      .sort((a, b) => Number(b.price) - Number(a.price));

    for (const plan of higherPlans) {
      const pPrice = Number(plan.price);
      const pDays = Number(plan.duration_days);
      if (remaining >= pPrice) {
        const count = Math.floor(remaining / pPrice);
        // 35% generous bonus days for higher VIP bundles
        const bonusDays = Math.round(pDays * 1.35);
        totalDays += count * bonusDays;
        remaining %= pPrice;
      }
    }
  }

  // 2. Monthly Super-Tier (8,000 UGX = 40 Days)
  if (remaining >= 8000) {
    const count = Math.floor(remaining / 8000);
    totalDays += count * 40;
    remaining %= 8000;
  }

  // 3. Two-Weeks Super-Tier (3,000 UGX = 21 Days / 3 Weeks)
  if (remaining >= 3000) {
    const count = Math.floor(remaining / 3000);
    totalDays += count * 21;
    remaining %= 3000;
  }

  // 4. Daily Super-Tier (1,000 UGX = 3 Days)
  if (remaining >= 1000) {
    const count = Math.floor(remaining / 1000);
    totalDays += count * 3;
    remaining %= 1000;
  }

  return totalDays;
}
