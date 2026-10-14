import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// POST /api/referrals/convert
// Convert referral earnings into subscription watch days based directly on platform subscription plans
export async function POST(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const daysRequested = Number(body.days);
    if (!daysRequested || daysRequested < 1) {
      return NextResponse.json({ error: 'Invalid number of days' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch active subscription plans to determine pricing equivalent
    const { data: plans } = await admin
      .from('subscription_plans')
      .select('id, name, price, duration_days')
      .eq('is_active', true)
      .order('price', { ascending: true });

    const dailyPlan = plans?.find(p => p.duration_days === 1) || { price: 1000, duration_days: 1 };
    const twoWeeksPlan = plans?.find(p => p.duration_days === 14);
    const monthlyPlan = plans?.find(p => p.duration_days === 30);

    const dailyRate = Math.round(Number(dailyPlan.price) / Number(dailyPlan.duration_days));

    // Determine cost: package pricing if exact match, otherwise dailyRate per day
    let totalCost = 0;
    if (twoWeeksPlan && daysRequested === 14) {
      totalCost = Number(twoWeeksPlan.price);
    } else if (monthlyPlan && daysRequested === 30) {
      totalCost = Number(monthlyPlan.price);
    } else {
      totalCost = daysRequested * dailyRate;
    }

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
    const now = new Date();
    const isCurrentlyActive = profile.subscription_end_date && new Date(profile.subscription_end_date) > now;
    const currentEnd = isCurrentlyActive ? new Date(profile.subscription_end_date) : now;
    const prevDays = isCurrentlyActive
      ? Math.max(0, Math.ceil((new Date(profile.subscription_end_date) - now) / (1000 * 60 * 60 * 24)))
      : 0;

    const newEnd = new Date(currentEnd.getTime() + daysRequested * 24 * 60 * 60 * 1000);
    const newTotalDays = prevDays + daysRequested;

    await admin
      .from('user_profiles')
      .update({ 
        subscription_end_date: newEnd.toISOString(),
        subscription_plan: 'affiliate_reward'
      })
      .eq('id', profile.id);

    // 3. Record in affiliate_commissions with transparent breakdown description
    const description = prevDays > 0
      ? `Converted ${totalCost.toLocaleString()} UGX to +${daysRequested} Watch Days (${prevDays} existing + ${daysRequested} added = ${newTotalDays} total days)`
      : `Converted ${totalCost.toLocaleString()} UGX to ${daysRequested} VIP Watch Days`;

    await admin.from('affiliate_commissions').insert({
      affiliate_id: affiliate.id,
      amount: -totalCost,
      type: 'watch_days',
      description
    });

    return NextResponse.json({
      success: true,
      daysAdded: daysRequested,
      prevDays,
      newTotalDays,
      newExpiry: newEnd.toISOString(),
      message: `🎉 Successfully added +${daysRequested} Watch Days! ${prevDays > 0 ? `Added to your existing ${prevDays} days (${newTotalDays} total days remaining).` : `You have ${newTotalDays} days remaining.`}`
    });
  } catch (err) {
    console.error('[convert error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
