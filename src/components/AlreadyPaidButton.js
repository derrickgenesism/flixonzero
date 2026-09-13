'use client';

import { useState } from 'react';
import { checkTransactionStatus } from '@/app/checkout/actions';

export default function AlreadyPaidButton() {
  const [state, setState] = useState('idle'); // idle | loading | success | not_found | failed | pending
  const [message, setMessage] = useState('');

  async function handleClick() {
    setState('loading');
    setMessage('');

    try {
      // Fetch the user's most recent pending transaction via our API endpoint
      const res = await fetch('/api/payment/check-pending', { method: 'POST' });
      const data = await res.json();

      if (!data.tx_ref) {
        setState('not_found');
        setMessage('No pending payment found on your account. If you just paid, please wait 1-2 minutes and try again.');
        return;
      }

      // Re-verify the transaction with Flutterwave using the existing action
      const result = await checkTransactionStatus(data.tx_ref);

      if (result?.status === 'successful') {
        setState('success');
        setMessage('Payment confirmed! Your subscription is now active. Please reload the page.');
      } else if (result?.status === 'failed') {
        setState('failed');
        setMessage('Your payment was not successful. Please subscribe again or contact support.');
      } else {
        setState('pending');
        setMessage('Your payment is still processing. Please wait a few minutes and try again. If you were charged, contact support.');
      }
    } catch (err) {
      setState('failed');
      setMessage('Something went wrong. Please try again or contact support.');
    }
  }

  if (state === 'success') {
    return (
      <div style={{
        marginTop: '12px',
        padding: '12px 16px',
        background: 'rgba(22,101,52,0.3)',
        border: '1px solid rgba(74,222,128,0.4)',
        borderRadius: '10px',
        color: '#4ade80',
        fontSize: '14px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span>Payment verified!</span>
        <button onClick={() => window.location.reload()} style={{ background: 'none', border: 'none', color: '#4ade80', textDecoration: 'underline', cursor: 'pointer', fontWeight: '700', fontSize: '14px' }}>Reload now to watch</button>
      </div>
    );
  }

  if (state === 'not_found' || state === 'failed' || state === 'pending') {
    return (
      <div style={{ marginTop: '12px' }}>
        <div style={{
          padding: '12px 16px',
          background: state === 'pending' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
          border: '1px solid ' + (state === 'pending' ? 'rgba(234,179,8,0.4)' : 'rgba(239,68,68,0.4)'),
          borderRadius: '10px',
          color: state === 'pending' ? '#fbbf24' : '#f87171',
          fontSize: '13px',
          lineHeight: '1.6',
          marginBottom: '8px'
        }}>
          {message}
        </div>
        <button
          onClick={() => { setState('idle'); setMessage(''); }}
          style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '12px' }}>
      <button
        onClick={handleClick}
        disabled={state === 'loading'}
        style={{
          background: state === 'loading' ? 'rgba(234,179,8,0.3)' : 'rgba(234,179,8,0.15)',
          border: '1px solid rgba(234,179,8,0.5)',
          color: '#fbbf24',
          padding: '10px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: '600',
          cursor: state === 'loading' ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          opacity: state === 'loading' ? 0.7 : 1,
        }}
      >
        {state === 'loading' ? 'Checking your payment...' : 'I already paid - activate my account'}
      </button>
      <p style={{ fontSize: '11px', color: 'var(--text3)', margin: '6px 0 0', lineHeight: '1.5' }}>
        Already paid but still seeing this? Click to verify your payment with Flutterwave.
      </p>
    </div>
  );
}
