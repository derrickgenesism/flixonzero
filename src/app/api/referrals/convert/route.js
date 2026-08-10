import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// POST /api/referrals/convert
// Convert referral earnings into subscription watch days
export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { days } = await request.json();
    if (!days || days < 1) return NextResponse.json({ error: 'Invalid days' }, { status: 400 });

    // Get UGX rate per day from settings
    const { data: setting } = await supabaseAdmin.from('admin_settings').select('setting_value').eq('setting_key', 'referral_ugx_per_day').maybeSingle();
    const ugxPerDay = Number(setting?.setting_value || 500);
    const totalCost = days * ugxPerDay;

    // Get current earnings
    const { data: earnings } = await supabaseAdmin
      .from('referral_earnings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const available = Number(earnings?.amount_earned || 0) - Number(earnings?.amount_withdrawn || 0) - Number(earnings?.amount_converted || 0);

    if (available < totalCost) {
      return NextResponse.json({ error: `Insufficient balance. You need ${totalCost.toLocaleString()} UGX but only have ${available.toLocaleString()} UGX.` }, { status: 400 });
    }

    // Update or extend subscription
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_end_date')
      .eq('id', user.id)
      .single();

    const currentEnd = profile?.subscription_end_date && new Date(profile.subscription_end_date) > new Date()
      ? new Date(profile.subscription_end_date)
      : new Date();

    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

    await supabaseAdmin
      .from('user_profiles')
      .update({ subscription_end_date: newEnd.toISOString() })
      .eq('id', user.id);

    // Deduct from earnings
    await supabaseAdmin
      .from('referral_earnings')
      .update({ amount_converted: Number(earnings?.amount_converted || 0) + totalCost })
      .eq('user_id', user.id);

    // Send notification
    await supabaseAdmin.from('notifications').insert({
      user_id: user.id,
      type: 'referral_earned',
      title: `${days} Watch Days Added!`,
      body: `Your referral balance of ${totalCost.toLocaleString()} UGX was converted into ${days} days of streaming access.`,
      link: '/account'
    });

    return NextResponse.json({
      success: true,
      daysAdded: days,
      newExpiry: newEnd.toISOString()
    });
  } catch (err) {
    console.error('[convert]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
