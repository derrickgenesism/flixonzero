import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const dynamic = 'force-dynamic';

// GET /api/ppv/verify?tx_ref=XXX
export async function GET(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ status: 'unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const tx_ref = searchParams.get('tx_ref');
    if (!tx_ref) return NextResponse.json({ status: 'not_found' });

    // 1. Check local DB
    const { data: purchase } = await supabaseAdmin
      .from('ppv_purchases')
      .select('*')
      .eq('tx_ref', tx_ref)
      .single();

    if (!purchase) return NextResponse.json({ status: 'not_found' });
    if (purchase.status === 'success') return NextResponse.json({ status: 'success' });

    // 2. Fetch Flutterwave Secret Key
    const { data: settings } = await supabaseAdmin
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'flutterwave_secret_key')
      .single();

    const secretKey = settings?.setting_value;
    if (!secretKey) return NextResponse.json({ status: 'pending' });

    // 3. Check Flutterwave API
    const fwRes = await fetch(`https://api.flutterwave.com/v3/transactions/verify_by_reference?tx_ref=${tx_ref}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
      cache: 'no-store'
    });
    
    if (fwRes.ok) {
      const fwData = await fwRes.json();
      if (fwData.status === 'success' && fwData.data?.status === 'successful') {
        
        // Grant 48 hour access
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 48);

        await supabaseAdmin
          .from('ppv_purchases')
          .update({
            status: 'success',
            expires_at: expiresAt.toISOString(),
            flw_id: fwData.data.id.toString(),
            updated_at: new Date().toISOString()
          })
          .eq('tx_ref', tx_ref);

        return NextResponse.json({ status: 'success' });
      } else if (fwData.data?.status === 'failed') {
        await supabaseAdmin
          .from('ppv_purchases')
          .update({ status: 'failed' })
          .eq('tx_ref', tx_ref);
        return NextResponse.json({ status: 'failed' });
      }
    }
    
    return NextResponse.json({ status: 'pending' });
  } catch (err) {
    console.error('[PPV Verify err]', err);
    return NextResponse.json({ status: 'error', message: err.message }, { status: 500 });
  }
}
