'use client';

import { useState, useEffect, useMemo } from 'react';
import { manualApproveTransaction, diagnoseTransaction, rejectTransaction } from './actions';

export default function TransactionsClient({ initialTransactions }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loadingId, setLoadingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [diagnosingId, setDiagnosingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'manual_pending', 'successful', 'pending', 'failed'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Diagnostics Modal State
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  // Helper to extract manual payment details
  const getManualDetails = (tx) => {
    const isManual = tx.payment_method === 'manual' || 
      tx.tx_ref?.startsWith('MAN_') || 
      tx.flw_transaction_id?.startsWith('MANUAL:') || 
      tx.notes?.includes('Manual');

    let phone = tx.phone_number || '';
    let ref = tx.notes || '';

    if (tx.flw_transaction_id?.startsWith('MANUAL:')) {
      const parts = tx.flw_transaction_id.split(':');
      if (!phone && parts[1]) phone = parts[1];
      if (parts[2]) ref = parts.slice(2).join(':');
    }

    return { isManual, phone, ref };
  };

  const handleApprove = async (tx) => {
    const { isManual, phone } = getManualDetails(tx);
    const confirmMsg = isManual 
      ? `Approve manual payment of ${Number(tx.amount).toLocaleString()} ${tx.currency} from ${phone || tx.user_profiles?.email || 'user'}? This will immediately activate their subscription.`
      : `Approve payment for ${tx.user_profiles?.email || 'User'}?`;

    if (!confirm(confirmMsg)) return;

    setLoadingId(tx.id);
    setError(null);
    setSuccess(null);

    const res = await manualApproveTransaction(tx.id);
    
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess(`Transaction approved! Granted ${res.daysAdded} days access.`);
      setTransactions(transactions.map(t => t.id === tx.id ? { ...t, status: 'successful' } : t));
    }

    setLoadingId(null);
  };

  const handleReject = async (tx) => {
    if (!confirm(`Are you sure you want to REJECT this transaction for ${tx.user_profiles?.email || 'User'}?`)) {
      return;
    }

    setRejectingId(tx.id);
    setError(null);
    setSuccess(null);

    const res = await rejectTransaction(tx.id);
    if (res?.error) {
      setError(res.error);
    } else {
      setSuccess('Transaction marked as rejected / failed.');
      setTransactions(transactions.map(t => t.id === tx.id ? { ...t, status: 'failed' } : t));
    }
    setRejectingId(null);
  };

  const handleDiagnose = async (tx) => {
    setDiagnosingId(tx.id);
    setError(null);
    setSuccess(null);
    
    const res = await diagnoseTransaction(tx.id);
    
    if (res?.error) {
      setError(`Diagnostics failed: ${res.error}`);
    } else if (res?.diagnostics) {
      setDiagnosticData({ tx, ...res.diagnostics });
      setIsModalOpen(true);
    }
    
    setDiagnosingId(null);
  };

  // Counts
  const counts = useMemo(() => {
    let manualPending = 0;
    let successful = 0;
    let pending = 0;
    let failed = 0;

    for (const t of transactions) {
      const { isManual } = getManualDetails(t);
      if (t.status === 'successful') successful++;
      else if (t.status === 'failed') failed++;
      else if (t.status === 'pending') {
        pending++;
        if (isManual) manualPending++;
      }
    }

    return { all: transactions.length, manualPending, successful, pending, failed };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const { isManual, phone, ref } = getManualDetails(tx);

      // Filter by tab
      if (activeTab === 'manual_pending') {
        if (!isManual || tx.status !== 'pending') return false;
      } else if (activeTab === 'successful') {
        if (tx.status !== 'successful') return false;
      } else if (activeTab === 'pending') {
        if (tx.status !== 'pending') return false;
      } else if (activeTab === 'failed') {
        if (tx.status !== 'failed') return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const email = (tx.user_profiles?.email || '').toLowerCase();
        const txRef = (tx.tx_ref || '').toLowerCase();
        const flwId = (tx.flw_transaction_id || '').toLowerCase();
        const notes = (ref || '').toLowerCase();
        const phoneLower = (phone || '').toLowerCase();

        return email.includes(q) || txRef.includes(q) || flwId.includes(q) || notes.includes(q) || phoneLower.includes(q);
      }

      return true;
    });
  }, [transactions, activeTab, searchQuery]);

  return (
    <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '100%' }}>
      
      {/* Alerts */}
      {error && (
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {error}
        </div>
      )}
      
      {success && (
        <div style={{ background: 'rgba(70, 180, 80, 0.1)', color: '#46b450', padding: '14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {success}
        </div>
      )}

      {/* Filter Tabs & Search Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All', count: counts.all },
            { id: 'manual_pending', label: '📱 Manual Pending', count: counts.manualPending, highlight: counts.manualPending > 0 },
            { id: 'successful', label: '✅ Successful', count: counts.successful },
            { id: 'pending', label: '⏳ All Pending', count: counts.pending },
            { id: 'failed', label: '❌ Failed', count: counts.failed },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: activeTab === tab.id ? '1px solid var(--acc)' : '1px solid rgba(255,255,255,0.08)',
                background: activeTab === tab.id 
                  ? 'var(--acc)' 
                  : (tab.highlight ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255,255,255,0.04)'),
                color: tab.highlight && activeTab !== tab.id ? '#f59e0b' : '#fff',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                background: activeTab === tab.id ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.1)',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px'
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex: '1 1 240px', maxWidth: '320px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, phone, reference..."
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '13px'
            }}
          />
        </div>
      </div>

      {/* Diagnostics Modal */}
      {isModalOpen && diagnosticData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ background: 'var(--bg)', padding: '30px', borderRadius: '14px', maxWidth: '600px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Payment Diagnostics</span>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '22px', cursor: 'pointer' }}>×</button>
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <strong style={{ display: 'block', marginBottom: '5px', color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase' }}>Reason / Title</strong>
              <div style={{ fontSize: '18px', color: diagnosticData.title.includes('Success') ? '#46b450' : '#e50914', fontWeight: 'bold' }}>
                {diagnosticData.title}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong style={{ display: 'block', marginBottom: '5px', color: 'var(--text3)', fontSize: '11px', textTransform: 'uppercase' }}>Summary</strong>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#fff' }}>
                {diagnosticData.summary}
              </p>
            </div>
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setIsModalOpen(false)} className="gms-btn gms-btn--ghost" style={{ padding: '8px 18px', fontSize: '13px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {filteredTransactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text2)' }}>
          No transactions match your filter.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text3)' }}>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>Customer</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Plan</th>
                <th style={{ padding: '12px' }}>Method / Sender Details</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right', minWidth: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => {
                const { isManual, phone, ref } = getManualDetails(tx);

                return (
                  <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isManual && tx.status === 'pending' ? 'rgba(245, 158, 11, 0.04)' : 'transparent' }}>
                    
                    {/* Date */}
                    <td style={{ padding: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {mounted ? new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '12px', maxWidth: '200px', wordBreak: 'break-all' }}>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{tx.user_profiles?.email || 'N/A'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)', fontFamily: 'monospace' }}>{tx.user_id.slice(0, 8)}...</div>
                    </td>

                    {/* Amount */}
                    <td style={{ padding: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#fff', fontSize: '14px' }}>
                        {Number(tx.amount).toLocaleString()} {tx.currency}
                      </span>
                    </td>

                    {/* Plan */}
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <span style={{ background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        {tx.plan_type ? `Plan #${tx.plan_type}` : 'Subscription'}
                      </span>
                    </td>

                    {/* Method & Sender info */}
                    <td style={{ padding: '12px', fontSize: '12px', maxWidth: '240px' }}>
                      {isManual ? (
                        <div>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(2, 132, 199, 0.2)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                            📱 Direct MoMo / Transfer
                          </div>
                          {phone && (
                            <div style={{ color: '#4ade80', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '12px' }}>
                              Paid from: {phone}
                            </div>
                          )}
                          {ref && (
                            <div style={{ color: 'var(--text2)', fontSize: '11px', fontStyle: 'italic' }}>
                              {ref}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div style={{ color: '#fff', fontFamily: 'monospace', fontSize: '11px' }}>{tx.tx_ref}</div>
                          {tx.flw_transaction_id && (
                            <div style={{ fontSize: '11px', color: '#60a5fa', fontFamily: 'monospace' }}>
                              FLW ID: {tx.flw_transaction_id}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                      <span style={{ 
                        background: tx.status === 'successful' 
                          ? 'rgba(70, 180, 80, 0.15)' 
                          : (tx.status === 'pending' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(229, 9, 20, 0.15)'), 
                        color: tx.status === 'successful' 
                          ? '#4ade80' 
                          : (tx.status === 'pending' ? '#facc15' : '#f87171'),
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        fontSize: '11px', 
                        fontWeight: '700', 
                        textTransform: 'uppercase'
                      }}>
                        {tx.status === 'pending' && isManual ? 'Needs Approval' : tx.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {tx.status !== 'successful' ? (
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleApprove(tx)} 
                            disabled={loadingId === tx.id || rejectingId === tx.id}
                            style={{ 
                              background: '#16a34a', 
                              color: '#fff', 
                              border: 'none', 
                              padding: '6px 12px', 
                              borderRadius: '6px', 
                              cursor: loadingId === tx.id ? 'not-allowed' : 'pointer', 
                              fontSize: '12px', 
                              fontWeight: '700' 
                            }}
                          >
                            {loadingId === tx.id ? 'Approving...' : '✓ Approve'}
                          </button>
                          
                          <button 
                            onClick={() => handleReject(tx)} 
                            disabled={loadingId === tx.id || rejectingId === tx.id}
                            style={{ 
                              background: 'rgba(239, 68, 68, 0.15)', 
                              color: '#f87171', 
                              border: '1px solid rgba(239, 68, 68, 0.3)', 
                              padding: '6px 10px', 
                              borderRadius: '6px', 
                              cursor: rejectingId === tx.id ? 'not-allowed' : 'pointer', 
                              fontSize: '12px', 
                              fontWeight: '600' 
                            }}
                          >
                            {rejectingId === tx.id ? '...' : '✕ Reject'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#4ade80', fontSize: '12px', fontWeight: 'bold' }}>
                          Active Access ✓
                        </span>
                      )}

                      {!isManual && tx.status !== 'successful' && (
                        <button 
                          onClick={() => handleDiagnose(tx)} 
                          disabled={diagnosingId === tx.id}
                          style={{ 
                            background: 'transparent', 
                            color: '#60a5fa', 
                            border: '1px solid rgba(96, 165, 250, 0.4)', 
                            padding: '6px 10px', 
                            borderRadius: '6px', 
                            cursor: diagnosingId === tx.id ? 'not-allowed' : 'pointer', 
                            fontSize: '11px', 
                            marginLeft: '6px'
                          }}
                        >
                          {diagnosingId === tx.id ? '...' : 'Diagnose'}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
