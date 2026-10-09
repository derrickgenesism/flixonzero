import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Please log in to test payments.' }, { status: 401 });
    }

    const { amount, phoneNumber, network } = await request.json();

    if (!amount || !phoneNumber) {
      return NextResponse.json({ error: 'Amount and Phone Number are required.' }, { status: 400 });
    }

    // Get FLW Secret Key
    const { data: settings } = await supabaseAdmin.from('admin_settings').select('*');
    const flwSecret = settings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value;
    
    if (!flwSecret) {
      return NextResponse.json({ error: 'Flutterwave secret key is not configured.' }, { status: 500 });
    }

    const tx_ref = `TEST-${user.id}-${Date.now()}`;

    // Record pending transaction
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      amount: Number(amount),
      currency: 'UGX',
      tx_ref,
      status: 'pending',
      payment_method: 'mobile_money'
    });

    // We use the exact payload required for Uganda Mobile Money Direct Charge
    const payload = {
      tx_ref,
      amount: Number(amount),
      currency: 'UGX',
      email: user.email,
      phone_number: phoneNumber,
      network: network || 'MTN',
      // We don't actually care about the redirect URL because we are intentionally bypassing it on the frontend!
      redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/test-payment?status=success`
    };

    console.log("[Test Payment] Initiating FLW Charge:", payload);

    const fwRes = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_uganda', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flwSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await fwRes.json();
    console.log("[Test Payment] FLW Response:", data);

    if (data.status === 'success' || data.message === 'Charge initiated') {
      // SUCCESS! We purposely ignore the data.meta.authorization.redirect URL
      // We just tell the frontend that the push was successful.
      return NextResponse.json({ 
        success: true, 
        tx_ref,
        flw_id: data.data?.id,
        message: 'Push initiated successfully. Check your phone.' 
      });
    } else {
      return NextResponse.json({ error: data.message || 'Payment initiation failed' }, { status: 400 });
    }
  } catch (err) {
    console.error('[Test Payment Error]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
