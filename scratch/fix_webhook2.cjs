const fs = require('fs');
let code = fs.readFileSync('src/app/api/webhooks/flutterwave/route.js', 'utf8');

// Replace the messy block with a clean version
const oldBlock = `            // Check if we have a reward configured for this plan
            // E.g., setting_key could be 'affiliate_plan_1_reward' (using plan.id, but transaction has plan_name or duration?
            // transaction.plan_type is usually 'Monthly Pass' or 'Daily Pass' or 'extra_profile'
            // We should just use a generic 'affiliate_cpa_reward' or map it if we know the plan IDs.
            // Wait, we need to map the plan name or ID. Let's look up the plan by name.
            // plan_type is stored as the plan's numeric ID (e.g. "1", "2", "3")
            const planNumericId = Number(transaction.plan_type);
            const rewardSettingKey = \`affiliate_plan_\${planNumericId}_reward\`;
            const planData = { id: planNumericId }; // already have the ID

            if (!isNaN(planNumericId) && planNumericId > 0) {
              const rewardSettingKey = \`affiliate_plan_\${planNumericId}_reward\`;`;

const newBlock = `            // plan_type is stored as the plan's numeric ID string (e.g. "1", "2", "3")
            const planNumericId = Number(transaction.plan_type);

            if (!isNaN(planNumericId) && planNumericId > 0) {
              const rewardSettingKey = \`affiliate_plan_\${planNumericId}_reward\`;`;

if (code.includes(oldBlock)) {
  code = code.replace(oldBlock, newBlock);
  fs.writeFileSync('src/app/api/webhooks/flutterwave/route.js', code);
  console.log('Webhook cleanup done');
} else {
  console.log('Pattern not found - manual check needed');
}
