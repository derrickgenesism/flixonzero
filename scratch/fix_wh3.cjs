const fs = require('fs');
let code = fs.readFileSync('src/app/api/webhooks/flutterwave/route.js', 'utf8');

// Add idempotency check at PPV branch: if already success, skip
code = code.replace(
  `      // --- PPV BRANCH ---
      if (tx_ref.startsWith('PPV-')) {
        const ppvRes = await supabase
          .from('ppv_purchases')
          .update({
            status: 'success',
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          })
          .eq('tx_ref', tx_ref)
          .select('user_id, movie_id')
          .single();`,
  `      // --- PPV BRANCH ---
      if (tx_ref.startsWith('PPV-')) {
        // Check if already processed (idempotency guard)
        const { data: existingPpv } = await supabase
          .from('ppv_purchases')
          .select('status, user_id, movie_id')
          .eq('tx_ref', tx_ref)
          .single();

        if (!existingPpv) {
          console.error('Webhook PPV: tx_ref not found in ppv_purchases:', tx_ref);
          return NextResponse.json({ status: 'ppv_not_found' }, { status: 200 });
        }

        if (existingPpv.status === 'success') {
          console.log('Webhook PPV: already processed, skipping:', tx_ref);
          return NextResponse.json({ status: 'already_processed' }, { status: 200 });
        }

        const ppvRes = await supabase
          .from('ppv_purchases')
          .update({
            status: 'success',
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          })
          .eq('tx_ref', tx_ref)
          .select('user_id, movie_id')
          .single();`
);

fs.writeFileSync('src/app/api/webhooks/flutterwave/route.js', code);
console.log('Fix 4: Webhook PPV idempotency + missing tx_ref guard added');
