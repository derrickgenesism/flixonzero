const fs = require('fs');

let file = 'src/app/api/webhooks/flutterwave/route.js';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('logSecurityEvent')) {
  content = content.replace(
    "import { NextResponse } from 'next/server';",
    "import { NextResponse } from 'next/server';\nimport { logSecurityEvent } from '@/utils/securityLogger';"
  );
  content = content.replace(
    "console.error('Webhook Error: Invalid Signature');",
    "console.error('Webhook Error: Invalid Signature');\n      await logSecurityEvent('WEBHOOK_TAMPERING', 'CRITICAL', 'Invalid signature or secret mismatch detected in incoming Flutterwave Webhook', { signature, ip: req.headers.get('x-forwarded-for') });"
  );
  content = content.replace(
    "console.warn('Webhook Error: Amount paid', payload.data.amount, 'is less than required', existingPpv.amount);",
    "console.warn('Webhook Error: Amount paid', payload.data.amount, 'is less than required', existingPpv.amount);\n        await logSecurityEvent('PAYMENT_TAMPERING', 'HIGH', 'Webhook PPV payment amount is less than the required amount', { tx_ref: payload.data.tx_ref, paid: payload.data.amount, required: existingPpv.amount });"
  );
  content = content.replace(
    "console.warn('Webhook Error: Amount paid', payload.data.amount, 'is less than required', plan.price);",
    "console.warn('Webhook Error: Amount paid', payload.data.amount, 'is less than required', plan.price);\n            await logSecurityEvent('PAYMENT_TAMPERING', 'HIGH', 'Webhook Subscription payment amount is less than the required plan price', { tx_ref: payload.data.tx_ref, paid: payload.data.amount, required: plan.price });"
  );
  fs.writeFileSync(file, content);
}
console.log('Webhooks patched');
