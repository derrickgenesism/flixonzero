import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET /api/v1/me/referrals
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('ref_code')
      .eq('email', user.email)
      .single();

    const { data: earnings } = await supabase
      .from('referral_earnings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const { count: totalReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id);

    const { count: paidReferrals } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('referrer_id', user.id)
      .eq('status', 'converted');

    const { data: payouts } = await supabase
      .from('payout_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const totalEarned     = Number(earnings?.amount_earned || 0);
    const totalWithdrawn  = Number(earnings?.amount_withdrawn || 0);
    const totalConverted  = Number(earnings?.amount_converted || 0);
    const available       = totalEarned - totalWithdrawn - totalConverted;

    return NextResponse.json({
      data: {
        ref_code: profile?.ref_code,
        referral_link: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://flixon.com'}/login?ref=${profile?.ref_code}`,
        stats: {
          total_referrals: totalReferrals || 0,
          paid_referrals: paidReferrals || 0,
          total_earned: totalEarned,
          total_withdrawn: totalWithdrawn,
          total_converted: totalConverted,
          available_balance: available
        },
        payouts: payouts || []
      },
      error: null, meta: null
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
