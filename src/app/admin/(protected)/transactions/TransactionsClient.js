'use client';

import { useState, useEffect } from 'react';
import { manualApproveTransaction, diagnoseTransaction } from './actions';

export default function TransactionsClient({ initialTransactions }) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [loadingId, setLoadingId] = useState(null);
  const [diagnosingId, setDiagnosingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Diagnostics Modal State
  const [diagnosticData, setDiagnosticData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  return (
    <div style={{ background: 'var(--bg2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', maxWidth: '100%', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
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

      {/* Diagnostics Modal */}
      {isModalOpen && diagnosticData && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', 
          alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{ background: 'var(--bg)', padding: '30px', borderRadius: '12px', maxWidth: '600px', width: '100%', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Payment Diagnostics</span>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <strong style={{ display: 'block', marginBottom: '5px', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase' }}>Reason / Title</strong>
              <div style={{ fontSize: '18px', color: diagnosticData.title.includes('Success') ? '#46b450' : '#e50914', fontWeight: 'bold' }}>
                {diagnosticData.title}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <strong style={{ display: 'block', marginBottom: '5px', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase' }}>AI Summary</strong>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5', color: '#fff' }}>
                {diagnosticData.summary}
              </p>
            </div>
            
            {diagnosticData.rawError && (
               <div style={{ marginBottom: '20px', background: 'rgba(229, 9, 20, 0.1)', padding: '10px', borderRadius: '6px' }}>
                 <strong style={{ display: 'block', marginBottom: '5px', color: '#e50914', fontSize: '12px', textTransform: 'uppercase' }}>API Error Message</strong>
                 <code style={{ fontSize: '12px', color: '#ffb4b8', wordBreak: 'break-word' }}>{diagnosticData.rawError}</code>
               </div>
            )}

            {diagnosticData.flwData && (
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                <strong style={{ display: 'block', marginBottom: '10px', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase' }}>Flutterwave Raw Data (Telecom Response)</strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'block' }}>Processor Response</span>
                    <span style={{ fontSize: '13px', color: '#fff', wordBreak: 'break-word' }}>{diagnosticData.flwData.processor_response || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'block' }}>Status</span>
                    <span style={{ fontSize: '13px', color: '#fff' }}>{diagnosticData.flwData.status || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'block' }}>Payment Type</span>
                    <span style={{ fontSize: '13px', color: '#fff' }}>{diagnosticData.flwData.payment_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'block' }}>Amount</span>
                    <span style={{ fontSize: '13px', color: '#fff' }}>{diagnosticData.flwData.amount} {diagnosticData.flwData.currency}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text3)', display: 'block' }}>Device IP</span>
                    <span style={{ fontSize: '13px', color: '#fff' }}>{diagnosticData.flwData.ip || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'var(--text3)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {transactions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text2)' }}>
          No transactions found.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'auto' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text3)' }}>
                <th style={{ padding: '12px' }}>Date</th>
                <th style={{ padding: '12px' }}>User</th>
                <th style={{ padding: '12px' }}>Amount</th>
                <th style={{ padding: '12px' }}>Plan / PPV</th>
                <th style={{ padding: '12px', maxWidth: '150px' }}>TX Ref</th>
                <th style={{ padding: '12px' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'right', minWidth: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {mounted ? new Date(tx.created_at).toLocaleString('en-US') : ''}
                  </td>
                  <td style={{ padding: '12px', wordBreak: 'break-all', maxWidth: '180px' }}>
                    {tx.user_profiles?.email || tx.user_id}
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {tx.amount?.toLocaleString('en-US')} {tx.currency}
                  </td>
                  <td style={{ padding: '12px', whiteSpace: 'nowrap' }}>
                    {tx.plan_id ? `Plan #${tx.plan_id}` : (tx.movie_id ? `Movie #${tx.movie_id}` : (tx.series_id ? `Series #${tx.series_id}` : 'Profile Slot'))}
                  </td>
                  <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text3)', wordBreak: 'break-all', maxWidth: '150px' }}>
                    {tx.tx_ref}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ 
                      background: tx.status === 'successful' ? 'rgba(70, 180, 80, 0.1)' : (tx.status === 'pending' ? 'rgba(230, 170, 30, 0.1)' : 'rgba(229, 9, 20, 0.1)'), 
                      color: tx.status === 'successful' ? '#46b450' : (tx.status === 'pending' ? '#e6aa1e' : '#e50914'),
                      padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', textTransform: 'capitalize',
                      whiteSpace: 'nowrap'
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button 
                      onClick={() => handleDiagnose(tx)} 
                      disabled={diagnosingId === tx.id}
                      style={{ 
                        background: 'rgba(59, 130, 246, 0.1)', 
                        color: '#3b82f6', 
                        border: '1px solid #3b82f6', 
                        padding: '6px 12px', 
                        borderRadius: '4px', 
                        cursor: diagnosingId === tx.id ? 'not-allowed' : 'pointer', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        marginRight: '8px'
                      }}
                    >
                      {diagnosingId === tx.id ? 'Scanning...' : 'Diagnose'}
                    </button>
                    {tx.status !== 'successful' && (
                      <button 
                        onClick={() => handleApprove(tx)} 
                        disabled={loadingId === tx.id}
                        style={{ 
                          background: 'var(--acc)', 
                          color: '#fff', 
                          border: 'none', 
                          padding: '6px 12px', 
                          borderRadius: '4px', 
                          cursor: loadingId === tx.id ? 'not-allowed' : 'pointer', 
                          fontSize: '12px', 
                          fontWeight: 'bold' 
                        }}
                      >
                        {loadingId === tx.id ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
