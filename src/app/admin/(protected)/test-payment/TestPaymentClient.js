'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

export default function TestPaymentClient({ publicKey, userEmail, userName }) {
  const [amount, setAmount] = useState('500');
  const [phoneNumber, setPhoneNumber] = useState('0770000000');
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');

  const handleInlinePayment = (e) => {
    e.preventDefault();
    
    if (!publicKey) {
      alert("Flutterwave Public Key is missing! Please configure it in Settings.");
      return;
    }

    setLoading(true);

    const txRef = `TEST-INLINE-${Date.now()}`;

    // Launch the Flutterwave Inline Modal
    window.FlutterwaveCheckout({
      public_key: publicKey,
      tx_ref: txRef,
      amount: Number(amount),
      currency: "UGX",
      payment_options: "mobilemoneyuganda", // Force it directly to Mobile Money Uganda
      customer: {
        email: userEmail,
        phone_number: phoneNumber,
        name: userName,
      },
      customizations: {
        title: "FlixOn Test Gateway",
        description: "Seamless USSD Push Test",
        logo: "https://flixon.app/logo.png",
      },
      callback: function (data) {
        console.log("Payment completed inside inline:", data);
        if (data.status === "successful") {
          setPaymentStatus('successful');
        } else {
          setPaymentStatus('failed');
        }
        setLoading(false);
      },
      onclose: function() {
        console.log("Modal closed by user");
        setLoading(false);
      }
    });
  };

  return (
    <div style={{ background: 'var(--bg2)', padding: '40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', minHeight: '60vh' }}>
      {/* We load the official Flutterwave Inline JS securely */}
      <Script src="https://checkout.flutterwave.com/v3.js" strategy="lazyOnload" />

      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>⚡ Inline JS Gateway Test</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px', lineHeight: '1.6' }}>
        According to the Flutterwave architecture docs, using the backend API directly from a datacenter IP triggers a math captcha puzzle. 
        This page uses the <strong>Official Inline JavaScript SDK</strong> instead. Because it runs directly inside your local browser, it generates 
        a valid <code>device_fingerprint</code> and skips the captcha, pushing the USSD prompt directly to your phone!
      </p>

      {paymentStatus === 'idle' && (
        <form onSubmit={handleInlinePayment} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text3)', fontSize: '12px', fontWeight: 'bold' }}>PHONE NUMBER</label>
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
            {loading ? 'Opening Secure Gateway...' : `Pay ${amount} UGX Now`}
          </button>
        </form>
      )}

      {paymentStatus === 'successful' && (
        <div style={{ textAlign: 'center', padding: '40px 0', border: '1px solid rgba(70, 180, 80, 0.2)', borderRadius: '12px', background: 'rgba(70, 180, 80, 0.05)' }}>
          <div style={{ fontSize: '60px', marginBottom: '10px' }}>✅</div>
          <h2 style={{ fontSize: '24px', marginBottom: '10px', color: '#46b450' }}>Payment Successful!</h2>
          <p style={{ color: 'var(--text2)' }}>The inline SDK generated the correct device fingerprint and processed the payment!</p>
          <button 
            onClick={() => { setPaymentStatus('idle'); setLoading(false); }} 
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
          <p style={{ color: 'var(--text2)' }}>The transaction was cancelled or failed.</p>
          <button 
            onClick={() => { setPaymentStatus('idle'); setLoading(false); }} 
            style={{ marginTop: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer' }}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
