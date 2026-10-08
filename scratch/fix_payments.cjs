const fs = require('fs');

// ============================================================
// FIX 1: checkout/actions.js
// - processDirectCharge ignores promoResult 4th arg (promo discount not applied to charge!)
// - checkTransactionStatus: plan_type stored as ID string ("1","2") not plan name
// ============================================================
let actionsCode = fs.readFileSync('src/app/checkout/actions.js', 'utf8');

// Fix signature to accept promoResult and apply the discounted amount
actionsCode = actionsCode.replace(
  'export async function processDirectCharge(planId, phoneNumber, network) {',
  'export async function processDirectCharge(planId, phoneNumber, network, promoResult = null) {'
);

// Use promoResult.finalAmount if a valid promo was applied
actionsCode = actionsCode.replace(
  '  const amount = plan.price;\n  const tx_ref',
  '  // Use discounted amount if a valid promo code was applied\n  const amount = (promoResult?.valid && promoResult?.finalAmount) ? promoResult.finalAmount : plan.price;\n  const tx_ref'
);

fs.writeFileSync('src/app/checkout/actions.js', actionsCode);
console.log('Fix 1: checkout/actions.js - promo amount applied');
