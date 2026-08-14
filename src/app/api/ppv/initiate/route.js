import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/ppv/initiate
// Body: { movieId, movieTitle, price }
export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });

    const { movieId, movieTitle, price } = await request.json();

    // Verify ppv_enabled + price from settings
    const { data: settings } = await supabaseAdmin.from('admin_settings').select('*');
    const ppvEnabled = settings?.find(s => s.setting_key === 'ppv_enabled')?.setting_value === 'true';
    const ppvPrice   = Number(settings?.find(s => s.setting_key === 'ppv_price')?.setting_value || 0);

    if (!ppvEnabled || ppvPrice <= 0) {
      return NextResponse.json({ error: 'Pay-Per-View is not enabled.' }, { status: 400 });
    }

    const { data: flwSettings } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['flutterwave_public_key', 'flutterwave_secret_key']);

    const flwPublic = flwSettings?.find(s => s.setting_key === 'flutterwave_public_key')?.setting_value;
    const flwSecret = flwSettings?.find(s => s.setting_key === 'flutterwave_secret_key')?.setting_value;

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

    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;

    // Create Flutterwave payment link
    const flwPayload = {
      tx_ref,
      amount: ppvPrice,
      currency: 'UGX',
      redirect_url: `${siteUrl}/movie/${movieId}?ppv=success`,
      customer: { email: user.email },
      customizations: {
        title: 'Flixon',
        description: `Rent: ${movieTitle} (48-hour access)`
      }
    };

    const flwRes = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${flwSecret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(flwPayload)
    });

    const flwData = await flwRes.json();
    if (flwData.status !== 'success' || !flwData.data?.link) {
      console.error('[PPV Flutterwave Error]', flwData);
      return NextResponse.json({ error: 'Payment gateway error. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ paymentLink: flwData.data.link });
  } catch (err) {
    console.error('[PPV initiate]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
