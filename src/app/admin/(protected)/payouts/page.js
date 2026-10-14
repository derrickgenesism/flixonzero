import { createAdminClient } from '@/utils/supabase/admin';
import { approvePayout, rejectPayout } from './actions';

export const metadata = { title: 'Payout Requests — Flixon Admin' };

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
    .limit(100);

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Payout Requests</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>Manage cash withdrawal and Watch Days requests from affiliates.</p>

      <div style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Affiliate</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Amount</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Details / Note</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts?.length > 0 ? payouts.map(req => {
              const isPending = req.type === 'payout_pending';
              const isCompleted = req.type === 'payout_completed' || req.type === 'watch_days';
              const isRejected = req.type === 'payout_rejected';
              const userProfile = req.affiliates?.user_profiles;
              const amountAbs = Math.abs(Number(req.amount || 0));

              return (
                <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px 20px', color: 'var(--text3)' }}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>@{userProfile?.username || `User #${req.affiliates?.user_id}`}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{userProfile?.email || req.affiliates?.referral_code}</div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    {req.type === 'watch_days' ? (
                      <span style={{ color: '#60a5fa', fontWeight: '500' }}>Watch Days Conversion</span>
                    ) : (
                      <span style={{ color: '#4ade80', fontWeight: '500' }}>Cash Withdrawal</span>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: '700', color: '#fff' }}>
                    {amountAbs.toLocaleString()} UGX
                  </td>
                  <td style={{ padding: '16px 20px', color: 'var(--text2)', maxWidth: '280px', wordBreak: 'break-word' }}>
                    {req.description || '-'}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                      background: isCompleted ? 'rgba(74,222,128,0.1)' 
                                : isRejected ? 'rgba(239,68,68,0.1)'
                                : 'rgba(251,191,36,0.1)',
                      color: isCompleted ? '#4ade80'
                           : isRejected ? '#f87171'
                           : '#fbbf24'
                    }}>
                      {isPending ? 'Pending Transfer' : (isCompleted ? 'Completed' : 'Rejected')}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {isPending && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <form action={approvePayout}>
                          <input type="hidden" name="id" value={req.id} />
                          <button type="submit" className="gms-btn gms-btn--primary" style={{ padding: '6px 12px', fontSize: '12px', background: '#16a34a' }}>
                            Mark Sent
                          </button>
                        </form>
                        <form action={rejectPayout}>
                          <input type="hidden" name="id" value={req.id} />
                          <button type="submit" className="gms-btn gms-btn--ghost" style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}>
                            Reject & Refund
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)' }}>
                  No payout or withdrawal requests recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
