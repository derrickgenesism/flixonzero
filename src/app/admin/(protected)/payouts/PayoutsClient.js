'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { approvePayout, rejectPayout } from './actions';

export default function PayoutsClient({ initialPayouts = [] }) {
  const router = useRouter();
  const [payouts, setPayouts] = useState(initialPayouts);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [rejectingItem, setRejectingItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Counters & Aggregates
  const pendingPayouts = payouts.filter(p => p.type === 'payout_pending');
  const sentPayouts = payouts.filter(p => p.type === 'payout_completed');
  const watchDaysPayouts = payouts.filter(p => p.type === 'watch_days');
  const rejectedPayouts = payouts.filter(p => p.type === 'payout_rejected');

  const pendingTotal = pendingPayouts.reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);
  const sentTotal = sentPayouts.reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);
  const watchDaysTotal = watchDaysPayouts.reduce((sum, p) => sum + Math.abs(Number(p.amount || 0)), 0);

  // Filter & Search logic
  const filtered = payouts.filter(item => {
    if (filter === 'pending' && item.type !== 'payout_pending') return false;
    if (filter === 'sent' && item.type !== 'payout_completed') return false;
    if (filter === 'watch_days' && item.type !== 'watch_days') return false;
    if (filter === 'rejected' && item.type !== 'payout_rejected') return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const userProfile = item.affiliates?.user_profiles;
    const username = (userProfile?.username || '').toLowerCase();
    const email = (userProfile?.email || '').toLowerCase();
    const refCode = (item.affiliates?.referral_code || '').toLowerCase();
    const desc = (item.description || '').toLowerCase();

    return username.includes(q) || email.includes(q) || refCode.includes(q) || desc.includes(q);
  });

  // Mark as Sent handler
  async function handleMarkSent(id, amount, username) {
    if (!confirm(`Confirm Mobile Money transfer of ${amount.toLocaleString()} UGX to @${username || 'user'} has been completed? Status will change to GREEN (Sent).`)) {
      return;
    }

    setActionLoadingId(id);
    setMessage(null);

    const res = await approvePayout(id);
    setActionLoadingId(null);

    if (res?.success) {
      setPayouts(prev =>
        prev.map(p =>
          p.id === id
            ? {
                ...p,
                type: 'payout_completed',
                description: (p.description || '').replace(/\s*\(Pending Admin Transfer\)/gi, '') + ' (Paid & Sent)'
              }
            : p
        )
      );
      setMessage({
        type: 'success',
        text: `✅ Payout of ${amount.toLocaleString()} UGX marked as Sent! Status is now GREEN (Sent) and user was notified.`
      });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to mark payout as sent.' });
    }
  }

  // Reject handler
  async function confirmReject() {
    if (!rejectingItem) return;
    const id = rejectingItem.id;
    const reason = rejectReason.trim() || 'Invalid mobile money number or transfer issue';

    setActionLoadingId(id);
    setMessage(null);

    const res = await rejectPayout(id, reason);
    setActionLoadingId(null);
    setRejectingItem(null);
    setRejectReason('');

    if (res?.success) {
      setPayouts(prev =>
        prev.map(p =>
          p.id === id
            ? {
                ...p,
                type: 'payout_rejected',
                description: (p.description || '').replace(/\s*\(Pending Admin Transfer\)/gi, '') + ` (Rejected: ${reason})`
              }
            : p
        )
      );
      setMessage({
        type: 'success',
        text: `⚠️ Payout request rejected and balance refunded back to affiliate.`
      });
      router.refresh();
    } else {
      setMessage({ type: 'error', text: res?.error || 'Failed to reject payout.' });
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '8px', color: '#fff' }}>Payout Requests</h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', margin: 0 }}>
          Manage affiliate cash withdrawals. When not sent, payouts are marked <strong>Pending</strong>. When sent, they turn <strong>GREEN (Sent)</strong>.
        </p>
      </div>

      {/* Global Alert Notification */}
      {message && (
        <div
          style={{
            padding: '14px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '24px',
            background: message.type === 'success' ? 'rgba(74,222,128,0.12)' : 'rgba(239,68,68,0.12)',
            color: message.type === 'success' ? '#4ade80' : '#f87171',
            border: `1px solid ${message.type === 'success' ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}`
          }}
        >
          {message.text}
        </div>
      )}

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '20px',
          marginBottom: '32px'
        }}
      >
        {/* Card 1: Pending (Not Sent) */}
        <div
          style={{
            background: 'rgba(251,191,36,0.06)',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid rgba(251,191,36,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#fbbf24' }}>
              Pending Transfers
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                background: 'rgba(251,191,36,0.2)',
                color: '#fbbf24',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              Not Sent ({pendingPayouts.length})
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#fbbf24' }}>
            {pendingTotal.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: '600' }}>UGX</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            Awaiting Mobile Money transfer by admin
          </div>
        </div>

        {/* Card 2: Sent (Green) */}
        <div
          style={{
            background: 'rgba(74,222,128,0.06)',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid rgba(74,222,128,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#4ade80' }}>
              Sent Payouts
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                background: 'rgba(74,222,128,0.2)',
                color: '#4ade80',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              Sent ({sentPayouts.length})
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#4ade80' }}>
            {sentTotal.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: '600' }}>UGX</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            Transferred directly to Mobile Money accounts
          </div>
        </div>

        {/* Card 3: Watch Days Converted */}
        <div
          style={{
            background: 'rgba(96,165,250,0.06)',
            borderRadius: '14px',
            padding: '24px',
            border: '1px solid rgba(96,165,250,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#60a5fa' }}>
              Watch Days Converted
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '800',
                background: 'rgba(96,165,250,0.2)',
                color: '#60a5fa',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              Converted ({watchDaysPayouts.length})
            </span>
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#60a5fa' }}>
            {watchDaysTotal.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: '600' }}>UGX</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            Instantly redeemed for VIP movie streaming days
          </div>
        </div>
      </div>

      {/* Controls Bar: Search & Filter Tabs */}
      <div
        style={{
          background: 'var(--bg2)',
          borderRadius: '12px',
          padding: '16px 20px',
          border: '1px solid var(--border)',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `All (${payouts.length})`, activeBg: 'var(--acc)', activeColor: '#fff' },
            { key: 'pending', label: `⏳ Pending (${pendingPayouts.length})`, activeBg: '#fbbf24', activeColor: '#000' },
            { key: 'sent', label: `✅ Sent (${sentPayouts.length})`, activeBg: '#22c55e', activeColor: '#fff' },
            { key: 'watch_days', label: `⚡ Watch Days (${watchDaysPayouts.length})`, activeBg: '#3b82f6', activeColor: '#fff' },
            { key: 'rejected', label: `❌ Rejected (${rejectedPayouts.length})`, activeBg: '#ef4444', activeColor: '#fff' }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                background: filter === t.key ? t.activeBg : 'rgba(255,255,255,0.05)',
                color: filter === t.key ? t.activeColor : 'var(--text2)',
                border: filter === t.key ? 'none' : '1px solid rgba(255,255,255,0.08)',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Live Search */}
        <div style={{ minWidth: '240px', flex: '0 1 300px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search affiliate, phone, note..."
            className="flx-form-input"
            style={{ width: '100%', padding: '8px 14px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* Table Container */}
      <div
        style={{
          background: 'var(--bg2)',
          borderRadius: '14px',
          border: '1px solid var(--border)',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch'
        }}
      >
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
            {filtered.length > 0 ? (
              filtered.map(req => {
                const isPending = req.type === 'payout_pending';
                const isSent = req.type === 'payout_completed';
                const isWatchDays = req.type === 'watch_days';
                const isRejected = req.type === 'payout_rejected';

                const userProfile = req.affiliates?.user_profiles;
                const amountAbs = Math.abs(Number(req.amount || 0));
                const isLoading = actionLoadingId === req.id;

                return (
                  <tr
                    key={req.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      background: isPending ? 'rgba(251,191,36,0.02)' : 'transparent'
                    }}
                  >
                    {/* Date */}
                    <td style={{ padding: '16px 20px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                      {new Date(req.created_at).toLocaleDateString('en-UG', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>

                    {/* Affiliate */}
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: '700', color: '#fff' }}>
                        @{userProfile?.username || `User #${req.affiliates?.user_id}`}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'monospace' }}>
                        {userProfile?.email || req.affiliates?.referral_code}
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {isWatchDays ? (
                        <span style={{ color: '#60a5fa', fontWeight: '600' }}>VIP Watch Days</span>
                      ) : (
                        <span style={{ color: '#4ade80', fontWeight: '600' }}>Mobile Money Payout</span>
                      )}
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '16px 20px', fontWeight: '800', color: '#fff', whiteSpace: 'nowrap' }}>
                      {amountAbs.toLocaleString()} UGX
                    </td>

                    {/* Details / Note */}
                    <td style={{ padding: '16px 20px', color: 'var(--text2)', maxWidth: '280px', wordBreak: 'break-word' }}>
                      {req.description || '-'}
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                      {isPending && (
                        <span
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: 'rgba(251,191,36,0.12)',
                            border: '1px solid rgba(251,191,36,0.35)',
                            color: '#fbbf24',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          ⏳ Pending
                        </span>
                      )}

                      {isSent && (
                        <span
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '800',
                            background: 'rgba(74,222,128,0.15)',
                            border: '1px solid rgba(74,222,128,0.4)',
                            color: '#4ade80',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 0 10px rgba(74,222,128,0.15)'
                          }}
                        >
                          ✅ Sent
                        </span>
                      )}

                      {isWatchDays && (
                        <span
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: 'rgba(96,165,250,0.15)',
                            border: '1px solid rgba(96,165,250,0.35)',
                            color: '#60a5fa',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          ⚡ Converted
                        </span>
                      )}

                      {isRejected && (
                        <span
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '700',
                            background: 'rgba(239,68,68,0.12)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#f87171',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          ❌ Rejected
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {isPending && (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleMarkSent(req.id, amountAbs, userProfile?.username)}
                            disabled={isLoading}
                            className="gms-btn gms-btn--primary"
                            style={{
                              padding: '8px 14px',
                              fontSize: '12px',
                              fontWeight: '800',
                              background: '#16a34a',
                              borderColor: '#16a34a',
                              color: '#fff',
                              cursor: 'pointer'
                            }}
                          >
                            {isLoading ? 'Updating...' : '✓ Mark Sent'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setRejectingItem(req)}
                            disabled={isLoading}
                            className="gms-btn gms-btn--ghost"
                            style={{
                              padding: '8px 14px',
                              fontSize: '12px',
                              borderColor: '#ef4444',
                              color: '#ef4444',
                              cursor: 'pointer'
                            }}
                          >
                            Reject & Refund
                          </button>
                        </div>
                      )}

                      {isSent && (
                        <span style={{ color: '#4ade80', fontSize: '13px', fontWeight: '700' }}>
                          ✓ Transferred
                        </span>
                      )}

                      {isWatchDays && (
                        <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: '600' }}>
                          ✓ Added to VIP Days
                        </span>
                      )}

                      {isRejected && (
                        <span style={{ color: '#f87171', fontSize: '13px', fontWeight: '600' }}>
                          Refunded to Balance
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text3)' }}>
                  No requests match the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: 'var(--bg2)',
              borderRadius: '16px',
              border: '1px solid rgba(239,68,68,0.4)',
              padding: '28px',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#f87171', margin: '0 0 12px' }}>
              Reject Payout & Refund
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.5', margin: '0 0 16px' }}>
              Are you sure you want to reject the payout request of{' '}
              <strong style={{ color: '#fff' }}>
                {Math.abs(Number(rejectingItem.amount || 0)).toLocaleString()} UGX
              </strong>{' '}
              for @{rejectingItem.affiliates?.user_profiles?.username || 'user'}? The funds will be refunded back to their affiliate balance immediately.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>
                Reason for Rejection:
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Invalid phone number or network failure"
                className="flx-form-input"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                disabled={actionLoadingId === rejectingItem.id}
                className="gms-btn gms-btn--ghost"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReject}
                disabled={actionLoadingId === rejectingItem.id}
                className="gms-btn gms-btn--primary"
                style={{ padding: '8px 16px', fontSize: '13px', background: '#ef4444', borderColor: '#ef4444' }}
              >
                {actionLoadingId === rejectingItem.id ? 'Refunding...' : 'Confirm Reject & Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
