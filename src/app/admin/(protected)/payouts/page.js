import { createAdminClient } from '@/utils/supabase/admin';
import PayoutsClient from './PayoutsClient';

export const metadata = { title: 'Payout Requests — FlixOn Admin' };

export default async function PayoutsPage() {
  const admin = createAdminClient();

  const { data: payouts } = await admin
    .from('affiliate_commissions')
    .select(`
      *,
      affiliates(id, user_id, referral_code, user_profiles!affiliates_user_id_fkey(username, email))
    `)
    .in('type', ['payout_pending', 'payout_completed', 'payout_rejected', 'watch_days'])
    .order('created_at', { ascending: false })
    .limit(250);

  return <PayoutsClient initialPayouts={payouts || []} />;
}
