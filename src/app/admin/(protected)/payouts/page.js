import { createClient } from '@/utils/supabase/server';
import { approvePayout, rejectPayout } from './actions';

export const metadata = { title: 'Payout Requests — Flixon Admin' };

export default async function PayoutsPage() {
  const supabase = await createClient();

  const { data: payouts } = await supabase
    .from('payout_requests')
    .select(`
      *,
      user_profiles!inner(username, email)
    `)
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Payout Requests</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>Manage cash withdrawal requests from affiliates.</p>

      <div style={{ background: 'var(--bg2)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Date</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>User</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Type</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Amount</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Details (Phone)</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '16px 20px', color: 'var(--text2)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts?.length > 0 ? payouts.map(req => (
              <tr key={req.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '16px 20px' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: '600', color: '#fff' }}>{req.user_profiles?.username || 'User'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{req.user_profiles?.email}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  {req.type === 'watch_days_conversion' ? 'Days Conversion' : 'Cash Withdrawal'}
                </td>
                <td style={{ padding: '16px 20px', fontWeight: '600', color: '#fff' }}>
                  {Number(req.amount).toLocaleString()} UGX
                </td>
                <td style={{ padding: '16px 20px', color: 'var(--text3)' }}>
                  {req.payment_details || '-'}
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600',
                    background: req.status === 'completed' || req.status === 'approved' ? 'rgba(74,222,128,0.1)' 
                              : req.status === 'rejected' ? 'rgba(229,9,20,0.1)'
                              : 'rgba(251,191,36,0.1)',
                    color: req.status === 'completed' || req.status === 'approved' ? '#4ade80'
                         : req.status === 'rejected' ? '#ff6b6b'
                         : '#fbbf24'
                  }}>
                    {req.status}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                  {req.status === 'pending' && req.type === 'cash_withdrawal' && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <form action={approvePayout}>
                        <input type="hidden" name="id" value={req.id} />
                        <button type="submit" className="gms-btn gms-btn--primary" style={{ padding: '6px 12px', fontSize: '12px', background: '#16a34a' }}>Approve</button>
                      </form>
                      <form action={rejectPayout}>
                        <input type="hidden" name="id" value={req.id} />
                        <button type="submit" className="gms-btn gms-btn--ghost" style={{ padding: '6px 12px', fontSize: '12px', borderColor: '#ef4444', color: '#ef4444' }}>Reject</button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text3)' }}>
                  No payout requests found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
