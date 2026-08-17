'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { processDirectCharge, checkTransactionStatus } from './actions';

export default function CheckoutClient({ plans, promoEnabled = true }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [captchaUrl, setCaptchaUrl] = useState(null);
  const [txRef, setTxRef] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const router = useRouter();

  const finalPrice = promoResult?.finalAmount ?? selectedPlan?.price ?? 0;

  // Automatic Polling
  useEffect(() => {
    let intervalId;
    if (paymentInitiated && txRef) {
      intervalId = setInterval(async () => {
        try {
          const res = await checkTransactionStatus(txRef);
          if (res.status === 'successful') {
            clearInterval(intervalId);
            router.push('/?payment=success');
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 4000); // Check every 4 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentInitiated, txRef, router]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setError(null);
    setVerificationMessage(null);
    setPromoResult(null);
    setPromoCode('');
  };

  async function applyPromo() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoResult(null);
    try {
      const res = await fetch('/api/v1/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoCode.trim(), planAmount: selectedPlan.price })
      });
      const data = await res.json();
      setPromoResult(data);
    } catch (e) {
      setPromoResult({ valid: false, error: 'Failed to validate code. Try again.' });
    }
    setPromoLoading(false);
  }

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError("Please enter a valid mobile money number (e.g., 077... or 075...)");
      return;
    }

    setLoading(true);
    setError(null);
    setCaptchaUrl(null);
    setTxRef(null);
    setVerificationMessage(null);

    const res = await processDirectCharge(selectedPlan.id, phoneNumber, network, promoResult?.valid ? promoResult : null);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    if (res?.success) {
      if (res.tx_ref) setTxRef(res.tx_ref);
      if (res.redirect_url) {
        setCaptchaUrl(res.redirect_url);
      }
      setPaymentInitiated(true);
    }
    setLoading(false);
  };

  const verifyPayment = async () => {
    if (!txRef) return;
    setCheckingPayment(true);
    setVerificationMessage(null);
    
    const res = await checkTransactionStatus(txRef);
    if (res.status === 'successful') {
      router.push('/?payment=success');
    } else {
      setVerificationMessage("Payment not yet confirmed by your network. If you just entered your PIN, please wait a few seconds and try again.");
    }
    setCheckingPayment(false);
  };

  if (!plans || plans.length === 0) {
    return (
      <div style={{ color: 'var(--text2)', textAlign: 'center' }}>
        No subscription plans are currently available. Please check back later.
      </div>
    );
  }

  // Payment Initiated View (Waiting for PIN or Captcha)
  if (paymentInitiated) {
    return (
      <div style={{ textAlign: 'center', background: 'var(--bg2)', padding: '15px 15px 80px 15px', borderRadius: '12px', border: '1px solid var(--acc)', maxWidth: '600px', margin: '-70px auto 0' }}>
        <h2 style={{ color: 'var(--acc)', marginBottom: '10px', fontSize: '18px' }}>
          {captchaUrl ? 'Security Verification Required' : 'Waiting for Payment...'}
        </h2>
        
        {captchaUrl ? (
          <>
            <p style={{ color: '#fff', marginBottom: '10px', fontSize: '13px' }}>
              Please complete the security check below for <strong>{phoneNumber}</strong>.
            </p>
            <div style={{ background: '#fff', padding: '0', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden', height: '75vh', minHeight: '600px', position: 'relative' }}>
              <iframe 
                src={captchaUrl} 
                style={{ width: '100%', height: 'calc(100% + 120px)', border: 'none', display: 'block', position: 'absolute', top: '-120px', left: 0 }}
                title="Security Check"
              />
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: '15px', fontSize: '12px' }}>
              Once you pass the security check and receive the PIN prompt on your phone, click the button below.
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '18px', color: '#fff', marginBottom: '15px' }}>
              Please check your phone (<strong>{phoneNumber}</strong>)
            </div>
            <p style={{ color: 'var(--text2)', marginBottom: '30px', lineHeight: '1.6' }}>
              We have sent a prompt to your phone. Please enter your Mobile Money PIN to approve the transaction of <strong>{Number(selectedPlan.price).toLocaleString()} UGX</strong>.
            </p>
            
            <div style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '14px', margin: 0, color: 'var(--text2)' }}>
                Didn&apos;t receive the prompt? Dial <strong>*165#</strong> or <strong>*185#</strong> and check your pending approvals, or try again.
              </p>
            </div>
          </>
        )}

        {verificationMessage && (
          <div style={{ color: '#e50914', background: 'rgba(229, 9, 20, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
            {verificationMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            onClick={verifyPayment}
            disabled={checkingPayment}
            className="gms-btn gms-btn--primary"
          >
            {checkingPayment ? 'Checking...' : 'I have entered my PIN'}
          </button>
          <button 
            onClick={() => { setPaymentInitiated(false); setCaptchaUrl(null); setVerificationMessage(null); }}
            className="gms-btn"
            style={{ background: 'transparent', border: '1px solid var(--text2)' }}
          >
            Cancel / Try Again
          </button>
        </div>
      </div>
    );
  }

  // Phone Number Entry View
  if (selectedPlan) {
    return (
      <div style={{ maxWidth: '500px', margin: '0 auto', background: 'var(--bg2)', padding: '30px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={() => setSelectedPlan(null)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          ← Back to plans
        </button>
        
        <h2 style={{ margin: '0 0 10px', color: '#fff' }}>Mobile Money Payment</h2>
        <p style={{ color: 'var(--text2)', marginBottom: '20px' }}>
          You are purchasing the <strong>{selectedPlan.name}</strong> for{' '}
          {promoResult?.valid && promoResult.finalAmount < selectedPlan.price ? (
            <>
              <span style={{ textDecoration: 'line-through', color: 'var(--text3)', marginRight: '6px' }}>{Number(selectedPlan.price).toLocaleString()} UGX</span>
              <strong style={{ color: '#4ade80' }}>{Number(promoResult.finalAmount).toLocaleString()} UGX</strong>
            </>
          ) : (
            <strong>{Number(selectedPlan.price).toLocaleString()} UGX</strong>
          )}.
        </p>

        {/* Promo / Gift Code Field */}
        {promoEnabled && (
          <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '16px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px' }}>Have a promo or gift code?</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE50"
                style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontFamily: 'monospace', letterSpacing: '2px', fontSize: '14px' }}
              />
              <button
                type="button"
                onClick={applyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="gms-btn gms-btn--ghost"
                style={{ padding: '10px 16px', flexShrink: 0 }}
              >
                {promoLoading ? '...' : 'Apply'}
              </button>
            </div>
            {promoResult && (
              <p style={{ margin: '8px 0 0', fontSize: '13px', color: promoResult.valid ? '#4ade80' : '#ff6b6b', fontWeight: '600' }}>
                {promoResult.valid ? promoResult.message : promoResult.error}
              </p>
            )}
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(229, 9, 20, 0.1)', color: '#e50914', padding: '15px', borderRadius: '6px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handlePaymentSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text2)', marginBottom: '8px' }}>
              Network Provider
            </label>
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

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text2)', marginBottom: '8px' }}>
              Mobile Money Number
            </label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 077XXXXXXX"
              required
              style={{ 
                width: '100%', 
                padding: '15px', 
                background: '#111', 
                border: '1px solid #333', 
                color: '#fff', 
                borderRadius: '8px',
                fontSize: '16px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="gms-btn gms-btn--primary"
            style={{ width: '100%', padding: '15px', fontSize: '16px', display: 'flex', justifyContent: 'center' }}
          >
            {loading ? 'Initiating...' : `Pay ${Number(promoResult?.valid ? promoResult.finalAmount : selectedPlan.price).toLocaleString()} UGX`}
          </button>
        </form>
      </div>
    );
  }

  // Plans List View
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.25)', borderRadius: '20px', padding: '5px 14px', marginBottom: '16px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--acc)', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--acc)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>Premium Membership</span>
        </div>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: '900', margin: '0 0 10px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          Choose Your Plan
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', maxWidth: '360px', margin: '0 auto', lineHeight: '1.6' }}>
          Unlock unlimited streaming. Cancel anytime.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 300px))', gap: '12px', maxWidth: '960px', margin: '0 auto', justifyContent: 'center' }}>
        {plans.map((plan, index) => {
          const isBest = index === 1 || (plans.length === 1);
          const features = plan.features?.split(',').slice(0, 3) || [];
          return (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '16px',
                background: isBest ? 'rgba(229, 9, 20, 0.06)' : 'var(--bg2)',
                border: isBest ? '2px solid var(--acc)' : '2px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                if (!isBest) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
              }}
              onMouseLeave={(e) => {
                if (!isBest) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {isBest && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: 'var(--acc)', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 12px', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                  Most Popular
                </div>
              )}

              {/* Top row: Name + Price */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: isBest ? '14px' : '0', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: '0 0 3px', fontSize: '16px', fontWeight: '800', color: '#fff' }}>
                    {plan.name}
                  </h3>
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--text3)', background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: '20px', display: 'inline-block' }}>
                    {plan.duration_days} day{plan.duration_days !== 1 ? 's' : ''}
                  </span>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: isBest ? 'var(--acc)' : '#fff', lineHeight: 1 }}>
                    {Number(plan.price).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>UGX</div>
                </div>
              </div>

              {/* Features */}
              {features.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                  {features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text3)', fontSize: '12px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature.trim()}
                    </div>
                  ))}
                </div>
              )}

              {/* CTA Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan); }}
                className={`gms-btn ${isBest ? 'gms-btn--primary' : 'gms-btn--ghost'}`}
                style={{ width: '100%', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginTop: 'auto' }}
              >
                Select {plan.name}
              </button>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{ textAlign: 'center', marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {['Secure Mobile Money payments', 'Cancel anytime', 'Instant activation'].map(text => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text3)', fontSize: '12px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            {text}
          </div>
        ))}
      </div>
    </>
  );
}

