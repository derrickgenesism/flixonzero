import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/ppv/direct-charge
export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

    const { movieId, movieTitle, price, phoneNumber, network } = await request.json();

    const { data: settings } = await supabaseAdmin.from('admin_settings').select('*');
    const ppvEnabled = settings?.find(s => s.setting_key === 'ppv_enabled')?.setting_value === 'true';
    const ppvPrice   = Number(settings?.find(s => s.setting_key === 'ppv_price')?.setting_value || 0);

    if (!ppvEnabled || ppvPrice <= 0) {
      return NextResponse.json({ error: 'Pay-Per-View is not enabled.' }, { status: 400 });
    }

    const flwSecret = settings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value;
    if (!flwSecret) return NextResponse.json({ error: 'Payment gateway not configured.' }, { status: 500 });

    const tx_ref = `PPV-${movieId}-${user.id}-${Date.now()}`;

    // Record pending purchase
    await supabaseAdmin.from('ppv_purchases').upsert({
      user_id: user.id,
      movie_id: movieId,
      amount: ppvPrice,
      tx_ref,
      status: 'pending'
    }, { onConflict: 'user_id,movie_id' });

    const payload = {
      tx_ref,
      amount: ppvPrice,
      currency: 'UGX',
      email: user.email,
      fullname: user.email.split('@')[0],
      phone_number: phoneNumber,
      network: network || 'MTN',
      redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/movie/${movieId}?ppv=success`
    };

    const fwRes = await fetch('https://api.flutterwave.com/v3/charges?type=mobile_money_uganda', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${flwSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await fwRes.json();
    console.log("FLUTTERWAVE PPV DIRECT CHARGE:", data);

    if (data.status === 'success' || data.message === 'Charge initiated') {
      if (data.meta && data.meta.authorization && data.meta.authorization.mode === 'redirect') {
        return NextResponse.json({ success: true, redirect_url: data.meta.authorization.redirect, tx_ref });
      }
      return NextResponse.json({ success: true, tx_ref });
    } else {
      console.error("[PPV Direct Error]", data);
      return NextResponse.json({ error: data.message || 'Payment initiation failed' }, { status: 400 });
    }
  } catch (err) {
    console.error('[PPV direct charge err]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
