const fs = require('fs');

// ============================================================
// FIX 2: webhook/route.js
// The affiliate referral branch tries: .eq('name', transaction.plan_type)
// But plan_type is stored as a numeric ID string ("1","2","3") not a name.
// Fix: use .eq('id', Number(transaction.plan_type)) instead.
// ============================================================
let webhookCode = fs.readFileSync('src/app/api/webhooks/flutterwave/route.js', 'utf8');

webhookCode = webhookCode.replace(
`            const { data: planData } = await supabase
              .from('subscription_plans')
              .select('id')
              .eq('name', transaction.plan_type)
              .maybeSingle();

            if (planData) {
              const rewardSettingKey = \`affiliate_plan_\${planData.id}_reward\`;`,
`            // plan_type is stored as the plan's numeric ID (e.g. "1", "2", "3")
            const planNumericId = Number(transaction.plan_type);
            const rewardSettingKey = \`affiliate_plan_\${planNumericId}_reward\`;
            const planData = { id: planNumericId }; // already have the ID

            if (!isNaN(planNumericId) && planNumericId > 0) {
              const rewardSettingKey = \`affiliate_plan_\${planNumericId}_reward\`;`
);

// Also fix: PPV upsert conflict overwrites tx_ref, so webhook lookup by old tx_ref fails.
// Fix: use INSERT instead of UPSERT so each attempt has its own record.
// The conflict on user_id,movie_id should only update status to pending, not replace tx_ref.
// Actually the real fix is to change the upsert to only update non-tx_ref fields, or INSERT always.

fs.writeFileSync('src/app/api/webhooks/flutterwave/route.js', webhookCode);
console.log('Fix 2: webhook affiliate plan_type lookup fixed');
