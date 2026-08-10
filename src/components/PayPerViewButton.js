'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PayPerViewButton({ movieId, movieTitle, price, variant = 'default' }) {
  const [showModal, setShowModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [txRef, setTxRef] = useState(null);
  const [error, setError] = useState(null);
  const [captchaUrl, setCaptchaUrl] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const router = useRouter();

  // Polling for PPV payment status
  useEffect(() => {
    let intervalId;
    if (paymentInitiated && txRef) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/ppv/verify?tx_ref=${txRef}`);
          const data = await res.json();
          if (data.status === 'success') {
            clearInterval(intervalId);
            window.location.reload(); // Reload to grant access
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 4000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentInitiated, txRef]);

  const verifyPayment = async () => {
    if (!txRef) return;
    setCheckingPayment(true);
    setVerificationMessage(null);
    try {
      const res = await fetch(`/api/ppv/verify?tx_ref=${txRef}`);
      const data = await res.json();
      if (data.status === 'success') {
        window.location.reload();
      } else {
        setVerificationMessage("Payment not yet confirmed by your network. Please wait a few seconds and try again.");
      }
    } catch (e) {
      setVerificationMessage("Network error while verifying. Please try again.");
    }
    setCheckingPayment(false);
  };

  async function handleInitiate(e) {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid mobile number");
      return;
    }
    setLoading(true);
    setError(null);
    setCaptchaUrl(null);
    setVerificationMessage(null);
    try {
      const res = await fetch('/api/ppv/direct-charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, movieTitle, price, phoneNumber, network })
      });
      const data = await res.json();
      if (data.success) {
        setTxRef(data.tx_ref);
        if (data.redirect_url) {
          setCaptchaUrl(data.redirect_url);
        }
        setPaymentInitiated(true);
      } else {
        setError(data.error || 'Failed to initiate payment');
      }
    } catch (e) {
      setError('Payment initiation failed. Please try again.');
    }
    setLoading(false);
  }

  const rentText = `Rent only this movie (${Number(price).toLocaleString('en-US')} UGX)`;

  return (
    <>
      {variant === 'small' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 20 }}>
          <button
            onClick={() => setShowModal(true)}
            className="gms-btn"
            style={{
              background: 'rgba(0,0,0,0.5)', border: '1px solid var(--acc)',
              color: '#fff', fontSize: '10px', padding: '6px 10px', borderRadius: '4px',
              cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.5px',
              backdropFilter: 'blur(4px)'
            }}
          >
            {rentText}
          </button>
          <div title="You will only be able to watch this specific movie you have rented for 48 hours." style={{ cursor: 'help', color: 'var(--text2)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path>
            </svg>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="gms-btn gms-btn--ghost"
          style={{ padding: '14px 28px', fontSize: '15px', borderColor: 'var(--acc)', color: 'var(--acc)' }}
        >
          {rentText}
        </button>
      )}

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px'
        }}>
          <div style={{ background: 'var(--bg2)', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: captchaUrl ? '500px' : '400px', border: '1px solid var(--border)', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button 
              onClick={() => { setShowModal(false); setPaymentInitiated(false); setError(null); setCaptchaUrl(null); setVerificationMessage(null); }}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', zIndex: 10 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 style={{ margin: '0 0 8px', fontSize: '20px', color: '#fff' }}>
              {captchaUrl ? 'Security Verification Required' : 'Rent Movie'}
            </h3>
            
            {!captchaUrl && (
              <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 20px', lineHeight: '1.5' }}>
                You are renting <strong>{movieTitle}</strong> for 48 hours. The cost is <strong>{Number(price).toLocaleString('en-US')} UGX</strong>.
              </p>
            )}

            {paymentInitiated ? (
              captchaUrl ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ color: 'var(--text2)', marginBottom: '15px', fontSize: '13px' }}>
                    Please complete the security check below to receive the payment prompt on your phone (<strong>{phoneNumber}</strong>).
                  </p>
                  
                  <button onClick={verifyPayment} disabled={checkingPayment} className="gms-btn gms-btn--primary" style={{ width: '100%', padding: '12px', marginBottom: '12px' }}>
                    {checkingPayment ? 'Checking...' : 'Click here to verify after adding PIN'}
                  </button>
                  {verificationMessage && <div style={{ marginBottom: '16px', fontSize: '13px', color: 'var(--acc)' }}>{verificationMessage}</div>}

                  <div style={{ background: '#fff', padding: '10px', borderRadius: '8px', marginBottom: '0' }}>
                    <iframe 
                      src={captchaUrl} 
                      style={{ width: '100%', height: '400px', border: 'none', borderRadius: '4px' }}
                      title="Security Check"
                    />
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ margin: '0 auto 16px', width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--acc)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <h4 style={{ color: 'var(--acc)', margin: '0 0 8px' }}>Waiting for PIN...</h4>
                  <p style={{ color: 'var(--text2)', fontSize: '13px', margin: '0 0 16px' }}>Please check your phone and enter your Mobile Money PIN to approve the payment.</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  
                  <button onClick={verifyPayment} disabled={checkingPayment} className="gms-btn gms-btn--primary" style={{ width: '100%', padding: '12px' }}>
                    {checkingPayment ? 'Checking...' : 'Click here to verify after adding PIN'}
                  </button>
                  {verificationMessage && <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--acc)' }}>{verificationMessage}</div>}
                </div>
              )
            ) : (
              <form onSubmit={handleInitiate}>
                {error && <div style={{ background: 'rgba(229,9,20,0.1)', color: 'var(--acc)', padding: '10px', borderRadius: '6px', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Mobile Money Number</label>
                  <input 
                    type="tel" 
                    value={phoneNumber} 
                    onChange={e => setPhoneNumber(e.target.value)} 
                    placeholder="e.g. 077..."
                    style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontSize: '15px' }}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Network</label>
                  <select 
                    value={network} 
                    onChange={e => setNetwork(e.target.value)}
                    style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontSize: '15px' }}
                    required
                  >
                    <option value="" disabled>Select Network</option>
                    <option value="MTN">MTN</option>
                    <option value="AIRTEL">Airtel</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="gms-btn gms-btn--primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                >
                  {loading ? 'Processing...' : `Pay ${Number(price).toLocaleString('en-US')} UGX`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
