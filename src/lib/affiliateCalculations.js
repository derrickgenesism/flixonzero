/**
 * Unified Affiliate & Commission Calculations
 * Used across Account, Affiliate Dashboard, and Checkout/Ledger.
 */

export function parseAffiliateSettings(settingsRows = []) {
  const map = {};
  if (Array.isArray(settingsRows)) {
    settingsRows.forEach(row => {
      if (row && row.setting_key) {
        map[row.setting_key] = row.setting_value;
      }
    });
  } else if (typeof settingsRows === 'object' && settingsRows !== null) {
    Object.assign(map, settingsRows);
  }

  const commissionPercentage = Number(map.affiliate_commission_percentage || 35);
  const minPayout = Number(map.affiliate_min_payout !== undefined ? map.affiliate_min_payout : 5000);
  const withdrawalFee = Number(map.affiliate_withdrawal_fee !== undefined ? map.affiliate_withdrawal_fee : 500);
  const commissionType = map.affiliate_commission_type || 'percentage';
  const cpaEnabled = map.affiliate_cpa_enabled !== 'false';
  const ppcEnabled = map.affiliate_ppc_enabled === 'true';
  const cpmRate = Number(map.affiliate_cpm_rate || 5000);
  const ppcReward = Number(map.affiliate_ppc_reward || (cpmRate ? Math.round(cpmRate / 1000) : 5));

  // Boost calculation
  const boostEnabled = map.affiliate_boost_enabled === 'true';
  const boostEndsAt = map.affiliate_boost_ends_at;
  const isBoostActive = boostEnabled && (!boostEndsAt || new Date(boostEndsAt) > new Date());
  const boostMultiplier = isBoostActive ? Math.max(1, Number(map.affiliate_boost_multiplier || 2)) : 1;
  const boostName = map.affiliate_boost_name || 'Special Multiplier Boost';

  return {
    raw: map,
    commissionPercentage,
    minPayout,
    withdrawalFee,
    commissionType,
    cpaEnabled,
    ppcEnabled,
    ppcReward,
    cpmRate,
    isBoostActive,
    boostMultiplier,
    boostName,
    boostEndsAt
  };
}

export function calculatePlanAffiliateReward(plan, parsedConfig) {
  if (!plan) return null;
  const config = parsedConfig?.raw ? parsedConfig : parseAffiliateSettings(parsedConfig);
  const rawMap = config.raw || {};

  const price = Number(plan.price || 0);
  const planId = plan.id;
  const planMode = rawMap[`affiliate_plan_${planId}_mode`] || config.commissionType || 'percentage';
  const rawReward = rawMap[`affiliate_plan_${planId}_reward`];
  const globalPct = config.commissionPercentage || 35;

  let baseReward = 0;
  let basePercent = 0;

  if (planMode === 'percentage') {
    const pct = (rawReward !== undefined && rawReward !== null && Number(rawReward) <= 100 && Number(rawReward) > 0)
      ? Number(rawReward)
      : globalPct;
    basePercent = Math.round(pct);
    baseReward = Math.round(price * (pct / 100));
  } else {
    // Fixed amount mode
    if (rawReward !== undefined && rawReward !== null && Number(rawReward) > 0) {
      baseReward = Number(rawReward);
    } else {
      // Calibrated defaults based on price tier
      if (price <= 1500) {
        baseReward = Math.round(price * 0.35);
      } else if (price <= 4500) {
        baseReward = Math.round(price * 0.35);
      } else {
        baseReward = Math.round(price * 0.35);
      }
    }
    basePercent = price > 0 ? Math.round((baseReward / price) * 100) : 0;
  }

  const multiplier = config.boostMultiplier || 1;
  const finalReward = config.isBoostActive ? Math.round(baseReward * multiplier) : baseReward;
  const finalPercent = price > 0 ? Math.round((finalReward / price) * 100) : basePercent;

  return {
    planId: plan.id,
    planName: plan.name,
    price,
    durationDays: plan.duration_days,
    baseReward,
    basePercent,
    reward: finalReward,
    percent: finalPercent,
    isBoosted: config.isBoostActive && multiplier > 1,
    multiplier
  };
}

export function calculateAllPlanRewards(plans = [], parsedConfig) {
  const config = parsedConfig?.raw ? parsedConfig : parseAffiliateSettings(parsedConfig);
  return (plans || []).map(plan => calculatePlanAffiliateReward(plan, config)).filter(Boolean);
}
