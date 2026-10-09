import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tx_ref = searchParams.get('tx_ref');

    if (!tx_ref) {
      return NextResponse.json({ error: 'Missing tx_ref' }, { status: 400 });
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch Flutterwave Secret Key
    const { data: settings } = await supabaseAdmin.from('admin_settings').select('*');
    const flwSecret = settings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value;

    if (!flwSecret) return NextResponse.json({ error: 'No secret key' }, { status: 500 });

    // Ping Flutterwave directly to ask for the live status of this tx_ref
    const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${flwSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyData = await verifyRes.json();
    console.log("[Test Polling FLW Status]", verifyData.data?.status);

    let status = 'pending';
    if (verifyData.status === 'success' && verifyData.data?.status === 'successful') {
      status = 'successful';
      // Mark it successful in DB
      await supabaseAdmin.from('transactions').update({ status: 'successful' }).eq('tx_ref', tx_ref);
    } else if (verifyData.data?.status === 'failed') {
      status = 'failed';
      // Mark failed in DB
      await supabaseAdmin.from('transactions').update({ status: 'failed' }).eq('tx_ref', tx_ref);
    }

    return NextResponse.json({ status });

  } catch (err) {
    console.error('[Test Verify Error]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
