const fs = require('fs');
let code = fs.readFileSync('src/app/api/payment/check-pending/route.js', 'utf8');

code = code.replace(
  '    // 3. Safety check: only allow re-verification of transactions from the last 24 hours\n    // This prevents users from accidentally reactivating very old failed payments\n    const txAge = Date.now() - new Date(transaction.created_at).getTime();\n    const twentyFourHours = 24 * 60 * 60 * 1000;\n\n    if (txAge > twentyFourHours) {\n      console.warn(`[check-pending] User ${user.id} tried to verify old tx (${transaction.tx_ref}), age: ${Math.round(txAge / 3600000)}h`);\n      return NextResponse.json({ tx_ref: null, reason: \'too_old\' });\n    }',
  '    // 3. Safety check: only allow re-verification of transactions from the last 72 hours\n    // This covers weekend delays and slow mobile money networks while blocking stale reactivation\n    const txAge = Date.now() - new Date(transaction.created_at).getTime();\n    const seventyTwoHours = 72 * 60 * 60 * 1000;\n\n    if (txAge > seventyTwoHours) {\n      console.warn(`[check-pending] User ${user.id} tried to verify old tx (${transaction.tx_ref}), age: ${Math.round(txAge / 3600000)}h - too old`);\n      return NextResponse.json({ tx_ref: null, reason: \'too_old\' });\n    }'
);

fs.writeFileSync('src/app/api/payment/check-pending/route.js', code);
console.log('Fix 6: check-pending window extended to 72h');
