const fs = require('fs');
let code = fs.readFileSync('src/app/api/webhooks/flutterwave/route.js', 'utf8');

const ppvCheck = \        if (existingPpv.status === 'success') {
          console.log('Webhook PPV: already processed, skipping:', tx_ref);
          return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }

        if (existingPpv.amount && payload.data.amount < existingPpv.amount) {
          console.error('Webhook PPV Error: Amount mismatch. Expected ' + existingPpv.amount + ', got ' + payload.data.amount);
          return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        }\;

code = code.replace(
/        if \\(existingPpv\\.status === 'success'\\) \\{[\\s\\S]*?return NextResponse\\.json\\(\\{ status: 'already_processed' \\}, \\{ status: 200 \\}\\);\\s*\\}/,
  ppvCheck
);

const subCheck = \      // If already processed, ignore
      if (transaction.status === 'successful') {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }

      if (transaction.amount && payload.data.amount < transaction.amount) {
        console.error('Webhook Error: Amount mismatch. Expected ' + transaction.amount + ', got ' + payload.data.amount);
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }\;

code = code.replace(
/      \\/\\/ If already processed, ignore[\\s\\S]*?return NextResponse\\.json\\(\\{ status: 'already_processed' \\}, \\{ status: 200 \\}\\);\\s*\\}/,
  subCheck
);

fs.writeFileSync('src/app/api/webhooks/flutterwave/route.js', code);
