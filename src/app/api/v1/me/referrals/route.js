import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

// GET /api/v1/me/referrals
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from('user_profiles')
      .select('id, ref_code, email')
      .eq('email', user.email)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ data: null, error: 'Profile not found' }, { status: 404 });
    }

    const { data: affiliate } = await admin
      .from('affiliates')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle();

    const refCode = affiliate?.referral_code || profile.ref_code || null;

    // Count direct signups attributed to this user
    const { count: totalSignups } = await admin
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', profile.id);

    let ledger = [];
    let paidConversionsCount = 0;

    if (affiliate) {
      const { data: comms } = await admin
        .from('affiliate_commissions')
        .select('*')
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(20);

      ledger = comms || [];
      paidConversionsCount = comms?.filter(c => (c.type === 'commission' || !c.type) && Number(c.amount) > 0).length || 0;
    }

    const totalEarned    = Number(affiliate?.total_earned || 0);
    const totalWithdrawn = Number(affiliate?.total_withdrawn || 0);
    const balance        = Number(affiliate?.balance || 0);

    const headersList = await headers();
    const host = headersList.get('host') || 'flixon.com';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const siteUrl = `${protocol}://${host}`;

    return NextResponse.json({
      data: {
        ref_code: refCode,
        referral_link: refCode ? `${siteUrl}/login?ref=${refCode}` : null,
        affiliate_status: affiliate?.status || 'none',
        stats: {
          total_referrals: totalSignups || 0,
          paid_referrals: paidConversionsCount,
          total_earned: totalEarned,
          total_withdrawn: totalWithdrawn,
          total_converted: totalWithdrawn, // for backward-compatibility
          available_balance: balance
        },
        payouts: ledger
      },
      error: null,
      meta: null
    });
  } catch (err) {
    return NextResponse.json({ data: null, error: err.message }, { status: 500 });
  }
}
