'use client';

import { useState, useEffect } from 'react';
import { manualApproveTransaction } from './actions';

export default function TransactionsClient({ initialTransactions }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loadingId, setLoadingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  const handleApprove = async (tx) => {
    if (!confirm(`Are you sure you want to manually approve the transaction for ${tx.user_profiles?.email || 'Unknown User'}?`)) {
      return;
    }

    setLoadingId(tx.id);
    setError(null);
    setSuccess(null);

    const res = await manualApproveTransaction(tx.id);
    
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(`Transaction approved! Granted ${res.daysAdded} days.`);
      // Update local state
      setTransactions(transactions.map(t => t.id === tx.id ? { ...t, status: 'successful' } : t));
    }

    setLoadingId(null);
  };

  return (
    <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
      {error && (
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: 'rgba(70, 180, 80, 0.1)', color: '#46b450', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
          {success}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <th style={{ padding: '12px 10px', color: 'var(--text2)' }}>Date</th>
            <th style={{ padding: '12px 10px', color: 'var(--text2)' }}>User</th>
            <th style={{ padding: '12px 10px', color: 'var(--text2)' }}>Amount</th>
            <th style={{ padding: '12px 10px', color: 'var(--text2)' }}>Plan</th>
            <th style={{ padding: '12px 10px', color: 'var(--text2)' }}>Status</th>
            <th style={{ padding: '12px 10px', color: 'var(--text2)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px 10px' }}>
                {mounted ? new Date(tx.created_at).toLocaleString() : tx.created_at.split('T')[0]}
              </td>
              <td style={{ padding: '12px 10px' }}>
                {tx.user_profiles?.email || 'Unknown User'}
              </td>
              <td style={{ padding: '12px 10px' }}>
                {Number(tx.amount).toLocaleString()} {tx.currency}
              </td>
              <td style={{ padding: '12px 10px' }}>
                {tx.plan_type} ({tx.duration_days} days)
              </td>
              <td style={{ padding: '12px 10px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: tx.status === 'successful' ? 'rgba(70, 180, 80, 0.2)' : tx.status === 'failed' ? 'rgba(229, 9, 20, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                  color: tx.status === 'successful' ? '#46b450' : tx.status === 'failed' ? '#e50914' : '#ffa500'
                }}>
                  {tx.status.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '12px 10px' }}>
                {tx.status !== 'successful' && (
                  <button 
                    onClick={() => handleApprove(tx)}
                    disabled={loadingId === tx.id}
                    className="gms-btn gms-btn--primary"
                    style={{ padding: '6px 12px', fontSize: '12px', width: 'auto' }}
                  >
                    {loadingId === tx.id ? '...' : 'Approve'}
                  </button>
                )}
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: 'var(--text2)' }}>
                No transactions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
