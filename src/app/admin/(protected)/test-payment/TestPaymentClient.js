'use client';

import { useState, useEffect } from 'react';

export default function TestPaymentClient() {
  const [amount, setAmount] = useState('500');
  const [phoneNumber, setPhoneNumber] = useState('077');
  const [network, setNetwork] = useState('MTN');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [txRef, setTxRef] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); // idle, pending, successful, failed

  useEffect(() => {
    let interval;
    if (paymentStatus === 'pending' && txRef) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/test-payment/verify?tx_ref=${txRef}`);
          const data = await res.json();
          if (data.status === 'successful' || data.status === 'failed') {
            setPaymentStatus(data.status);
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000); // Check every 3 seconds
    }
    return () => clearInterval(interval);
  }, [paymentStatus, txRef]);

  const handleTestPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPaymentStatus('idle');
    setTxRef(null);

    try {
      const res = await fetch('/api/test-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, phoneNumber, network })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed to initiate.');
      }

      setTxRef(data.tx_ref);
      setPaymentStatus('pending');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg2)', padding: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', minHeight: '60vh' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>🧪 Seamless Mobile Money Testing</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px', lineHeight: '1.6' }}>
        This page uses a custom API integration that intentionally <strong>ignores</strong> Flutterwave's web-redirect instruction. 
        Instead of sending the user to a page that asks for an OTP, we just trap them here while Flutterwave triggers the USSD push to their phone in the background.
      </p>

      {paymentStatus === 'idle' && (
        <form onSubmit={handleTestPayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
          {error && (
            <div style={{ background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', padding: '15px', borderRadius: '6px' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text3)', fontSize: '12px', fontWeight: 'bold' }}>NETWORK</label>
            <select 
              value={network} 
              onChange={e => setNetwork(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: 'var(--bg3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', outline: 'none' }}
            >
              <option value="MTN">MTN Uganda</option>
              <option value="AIRTEL">Airtel Uganda</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text3)', fontSize: '12px', fontWeight: 'bold' }}>PHONE NUMBER (E.g. 077...)</label>
            <input 
              type="text" 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: 'var(--bg3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', outline: 'none' }}
              placeholder="077XXXXXXX"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text3)', fontSize: '12px', fontWeight: 'bold' }}>AMOUNT (UGX)</label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              style={{ width: '100%', padding: '12px', background: 'var(--bg3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', outline: 'none' }}
              min="500"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: 'var(--acc)', color: '#fff', padding: '15px', 
              borderRadius: '6px', border: 'none', fontWeight: 'bold', 
              fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '10px'
            }}
          >
            {loading ? 'Initiating Push...' : `Pay ${amount} UGX Now`}
          </button>
        </form>
      )}

      {paymentStatus === 'pending' && (
        <div style={{ textAlign: 'center', padding: '40px 0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ width: '50px', height: '50px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--acc)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }}></div>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { 100% { transform: rotate(360deg); } }` }} />
          
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#fff' }}>Please check your phone!</h2>
          <p style={{ color: 'var(--text2)', fontSize: '16px', maxWidth: '400px', margin: '0 auto' }}>
            A prompt has been sent to <strong>{phoneNumber}</strong>. Please enter your Mobile Money PIN on your device to approve the payment of <strong>{amount} UGX</strong>.
          </p>
          <div style={{ marginTop: '30px', fontSize: '12px', color: 'var(--text3)', background: 'rgba(255,255,255,0.05)', display: 'inline-block', padding: '8px 16px', borderRadius: '20px' }}>
            Auto-checking for approval... please wait.
          </div>
        </div>
      )}

      {paymentStatus === 'successful' && (
        <div style={{ textAlign: 'center', padding: '40px 0', border: '1px solid rgba(70, 180, 80, 0.2)', borderRadius: '12px', background: 'rgba(70, 180, 80, 0.05)' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>✅</div>
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#46b450' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text2)' }}>Your mobile money transaction was approved seamlessly without any web OTP.</p>
          <button 
            onClick={() => setPaymentStatus('idle')} 
            style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            Test Another Payment
          </button>
        </div>
      )}

      {paymentStatus === 'failed' && (
        <div style={{ textAlign: 'center', padding: '40px 0', border: '1px solid rgba(229, 9, 20, 0.2)', borderRadius: '12px', background: 'rgba(229, 9, 20, 0.05)' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>❌</div>
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#e50914' }}>Payment Failed</h2>
          <p style={{ color: 'var(--text2)' }}>You either cancelled the prompt, entered the wrong PIN, or it timed out.</p>
          <button 
            onClick={() => setPaymentStatus('idle')} 
            style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
