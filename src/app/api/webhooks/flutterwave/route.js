const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { activateTransaction } from '@/lib/payments';

export async function POST(req) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1. Fetch webhook secret from DB settings
    const { data: settings } = await _injectedAdminClient().from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'flutterwave_webhook_secret')
      .single();

    const webhookSecret = settings?.setting_value;

    // 2. Verify Webhook Signature
    const signature = req.headers.get('verif-hash');
    if (!webhookSecret || signature !== webhookSecret) {
      console.error('Webhook Error: Invalid Signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    console.log('Flutterwave Webhook received:', payload);

    // 3. Process Successful Payment
    if (payload.event === 'charge.completed' && payload.data.status === 'successful') {
      const tx_ref = payload.data.tx_ref;
      
      // --- PPV BRANCH ---
      if (tx_ref.startsWith('PPV-')) {
        // Check if already processed (idempotency guard)
        const { data: existingPpv } = await supabase
          .from('ppv_purchases')
          .select('status, user_id, movie_id, amount')
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

        if (existingPpv.amount && payload.data.amount < existingPpv.amount) {
          console.error('Webhook PPV Error: Amount mismatch. Expected ' + existingPpv.amount + ', got ' + payload.data.amount);
          return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
        }

        const ppvRes = await supabase
          .from('ppv_purchases')
          .update({
            status: 'success',
            expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
          })
          .eq('tx_ref', tx_ref)
          .select('user_id, movie_id')
          .single();

        if (ppvRes.data) {
          // Notify user
          await supabase.from('notifications').insert({
            user_id: ppvRes.data.user_id,
            type: 'ppv_activated',
            title: '48-Hour Access Activated!',
            body: 'Your rental is now active. Enjoy watching!',
            link: `/movie/${ppvRes.data.movie_id}`
          });
        }

        console.log('PPV activated for tx_ref:', tx_ref);
        return NextResponse.json({ status: 'ppv_success' }, { status: 200 });
      }

      // --- SUBSCRIPTION BRANCH ---
      // Look up the transaction in our DB
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('tx_ref', tx_ref)
        .single();

      if (txError || !transaction) {
        console.error('Webhook Error: Transaction not found in DB', tx_ref);
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // If already processed, ignore (fast path; the claim below is the real guard)
      if (transaction.status === 'successful') {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }

      if (transaction.amount && payload.data.amount < transaction.amount) {
        console.error('Webhook Error: Amount mismatch. Expected ' + transaction.amount + ', got ' + payload.data.amount);
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      // Atomic claim + grant (shared with the in-app polling fallback so access
      // and affiliate commission are applied exactly once, whichever path wins).
      const result = await activateTransaction(_injectedAdminClient(), transaction, payload.data.id);

      if (result.activated) {
        console.log(`Successfully processed ${result.type} for user ${transaction.user_id} (${transaction.plan_type})`);
        revalidatePath('/', 'layout');
      } else {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }

      return NextResponse.json({ status: result.type === 'extra_profile' ? 'extra_profile_success' : 'success' }, { status: 200 });
    }

    // Ignore other events (e.g. transfer.completed)
    return NextResponse.json({ status: 'ignored' }, { status: 200 });

  } catch (err) {
    console.error('Webhook Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

