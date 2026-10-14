import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// POST /api/referrals/convert
// Convert referral earnings into subscription watch days
export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { days } = await request.json();
    if (!days || days < 1) return NextResponse.json({ error: 'Invalid days' }, { status: 400 });

    const admin = createAdminClient();

    // Rate: 10,000 UGX = 30 days (~333.33 UGX per day)
    const { data: setting } = await admin.from('admin_settings').select('setting_value').eq('setting_key', 'referral_ugx_per_day').maybeSingle();
    const ugxPerDay = Number(setting?.setting_value || 333);
    const totalCost = days * ugxPerDay;

    // Get user profile
    const { data: profile } = await admin
      .from('user_profiles')
      .select('id, email, subscription_end_date')
      .eq('email', user.email)
      .maybeSingle();

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    // Get affiliate balance
    const { data: affiliate } = await admin
      .from('affiliates')
      .select('id, balance, total_withdrawn')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (!affiliate) return NextResponse.json({ error: 'Affiliate account not found' }, { status: 404 });

    const available = Number(affiliate.balance || 0);
    if (available < totalCost) {
      return NextResponse.json({ 
        error: `Insufficient balance. You need ${totalCost.toLocaleString()} UGX but only have ${available.toLocaleString()} UGX.` 
      }, { status: 400 });
    }

    // 1. Deduct from affiliate balance
    await admin
      .from('affiliates')
      .update({
        balance: available - totalCost,
        total_withdrawn: Number(affiliate.total_withdrawn || 0) + totalCost
      })
      .eq('id', affiliate.id);

    // 2. Extend subscription
    const currentEnd = profile.subscription_end_date && new Date(profile.subscription_end_date) > new Date()
      ? new Date(profile.subscription_end_date)
      : new Date();

    const newEnd = new Date(currentEnd.getTime() + days * 24 * 60 * 60 * 1000);

    await admin
      .from('user_profiles')
      .update({ 
        subscription_end_date: newEnd.toISOString(),
        subscription_plan: 'affiliate_reward'
      })
      .eq('id', profile.id);

    // 3. Record in affiliate_commissions
    await admin.from('affiliate_commissions').insert({
      affiliate_id: affiliate.id,
      amount: -totalCost,
      type: 'watch_days',
      description: `Converted ${totalCost.toLocaleString()} UGX to ${days} Watch Days`
    });

    return NextResponse.json({
      success: true,
      daysAdded: days,
      newExpiry: newEnd.toISOString()
    });
  } catch (err) {
    console.error('[convert error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
