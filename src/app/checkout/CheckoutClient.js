'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { processDirectCharge, checkTransactionStatus, submitManualPayment } from './actions';
import OfferCountdown from '@/components/OfferCountdown';

export default function CheckoutClient({
  plans,
  promoEnabled = true,
  offer = null,
  vpnDetected = false,
  clientIp = '',
  hasAutomatedPayment = false,
  manualPaymentSettings = {
    enabled: true,
    title: 'Direct Mobile Money / Bank Transfer',
    instructions: 'Send money to one of our official numbers below. Enter the phone number you paid with and click submit.',
    numbers: 'MTN Mobile Money: 0770000000\nAirtel Money: 0750000000'
  },
  currency = 'UGX',
  platformName = 'FlixOn'
}) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  
  // Payment mode: 'automated' (instant telecom prompt) or 'manual' (send to number & submit)
  const isManualOnly = !hasAutomatedPayment;
  const [paymentMode, setPaymentMode] = useState(isManualOnly ? 'manual' : 'automated');

  // Automated Payment states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [captchaUrl, setCaptchaUrl] = useState(null);
  const [txRef, setTxRef] = useState(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState(null);

  // Manual Payment states
  const [manualPhone, setManualPhone] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualSuccess, setManualSuccess] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Promo code states
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const router = useRouter();

  const finalPrice = promoResult?.finalAmount ?? selectedPlan?.price ?? 0;

  // Format currency helper
  const fmt = (amt) => `${Number(amt || 0).toLocaleString()} ${currency}`;

  // Automatic Polling (both automated charges and manual approval monitoring)
  useEffect(() => {
    let intervalId;
    const activeRef = txRef || manualSuccess?.tx_ref;

    if (activeRef) {
      intervalId = setInterval(async () => {
        try {
          const res = await checkTransactionStatus(activeRef);
          if (res.status === 'successful') {
            clearInterval(intervalId);
            window.location.assign('/?payment=success');
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 5000); // Check every 5 seconds
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentInitiated, txRef, manualSuccess]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setError(null);
    setVerificationMessage(null);
    setPromoResult(null);
    setPromoCode('');
    setManualSuccess(null);
    setPaymentMode(hasAutomatedPayment ? 'automated' : 'manual');
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

  // Handle Automated Telecom Charge Submit
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 9) {
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

  // Handle Manual Direct Payment Submit
  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!manualPhone || manualPhone.trim().length < 5) {
      setError("Please enter the phone number or sender account you used to send the payment.");
      return;
    }

    setManualSubmitting(true);
    setError(null);

    try {
      const res = await submitManualPayment(
        selectedPlan.id,
        manualPhone,
        manualRef,
        promoResult?.valid ? promoResult : null
      );

      if (res?.error) {
        setError(res.error);
      } else if (res?.success) {
        setManualSuccess(res);
      }
    } catch (err) {
      setError('An unexpected error occurred while submitting payment. Please try again.');
    } finally {
      setManualSubmitting(false);
    }
  };

  const copyToClipboard = (text, idx) => {
    // Extract just numbers or full line
    const match = text.match(/[\d\+\s]{7,}/);
    const toCopy = match ? match[0].replace(/\s+/g, '') : text;
    navigator.clipboard.writeText(toCopy);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  const verifyPayment = async () => {
    if (!txRef) return;
    setCheckingPayment(true);
    setVerificationMessage(null);
    
    const res = await checkTransactionStatus(txRef);
    if (res.status === 'successful') {
      window.location.assign('/?payment=success');
    } else {
      setVerificationMessage("Payment not yet confirmed by your network. If you just entered your PIN, please wait a few seconds and try again.");
    }
    setCheckingPayment(false);
  };

  if (!plans || plans.length === 0) {
    return (
      <div style={{ color: 'var(--text2)', textAlign: 'center', padding: '60px 0' }}>
        No subscription plans are currently available. Please check back later.
      </div>
    );
  }

  // ── VIEW 1: Manual Payment Submission Success ──
  if (manualSuccess) {
    return (
      <div style={{ maxWidth: '540px', margin: '0 auto', background: 'var(--bg2)', padding: '36px 28px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.4)', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>
          📱
        </div>

        <h2 style={{ color: '#fff', fontSize: '22px', margin: '0 0 10px', fontWeight: '800' }}>
          Payment Submitted!
        </h2>

        <p style={{ color: 'var(--text2)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
          We received your payment notification for <strong>{manualSuccess.planName}</strong>. 
          Your account will be activated as soon as an administrator verifies the transfer.
        </p>

        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', border: '1px solid var(--border)', textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text3)' }}>Plan:</span>
            <strong style={{ color: '#fff' }}>{manualSuccess.planName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text3)' }}>Amount:</span>
            <strong style={{ color: '#4ade80' }}>{fmt(manualSuccess.amount)}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
            <span style={{ color: 'var(--text3)' }}>Paid From:</span>
            <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{manualSuccess.phoneNumber}</strong>
          </div>
          {manualSuccess.transactionRef && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
              <span style={{ color: 'var(--text3)' }}>Reference:</span>
              <span style={{ color: '#fff', fontFamily: 'monospace' }}>{manualSuccess.transactionRef}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
            <span style={{ color: 'var(--text3)' }}>Status:</span>
            <span style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
              ⏳ Pending Admin Approval
            </span>
          </div>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '0 0 24px' }}>
          💡 If you leave this page open, you will automatically be redirected the moment the admin approves your transaction.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push('/account')}
            className="gms-btn gms-btn--primary"
            style={{ padding: '12px 24px', fontSize: '14px' }}
          >
            Go to My Account
          </button>
          <button
            onClick={() => router.push('/')}
            className="gms-btn"
            style={{ padding: '12px 24px', fontSize: '14px', background: 'transparent', border: '1px solid var(--border)' }}
          >
            Browse Movies
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW 2: Automated Payment In Progress (Waiting for PIN or Captcha) ──
  if (paymentInitiated) {
    return (
      <div style={{ textAlign: 'center', background: 'var(--bg2)', padding: '24px 20px 60px', borderRadius: '14px', border: '1px solid var(--acc)', maxWidth: '580px', margin: '0 auto' }}>
        <h2 style={{ color: 'var(--acc)', marginBottom: '10px', fontSize: '18px' }}>
          {captchaUrl ? 'Security Verification Required' : 'Waiting for Telecom Payment...'}
        </h2>
        
        {captchaUrl ? (
          <>
            <p style={{ color: '#fff', marginBottom: '10px', fontSize: '13px' }}>
              Please complete the security check below for <strong>{phoneNumber}</strong>.
            </p>
            <div style={{ background: '#fff', padding: '0', borderRadius: '8px', marginBottom: '15px', overflow: 'hidden', height: '70vh', minHeight: '500px', position: 'relative' }}>
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
            <p style={{ color: 'var(--text2)', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>
              We sent a prompt to your phone. Enter your Mobile Money PIN to approve <strong>{fmt(finalPrice)}</strong>.
            </p>
            
            <div style={{ padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ fontSize: '13px', margin: 0, color: 'var(--text2)' }}>
                Didn&apos;t receive the prompt? Dial <strong>*165#</strong> (MTN) or <strong>*185#</strong> (Airtel) and check your pending approvals.
              </p>
            </div>
          </>
        )}

        {verificationMessage && (
          <div style={{ color: '#e50914', background: 'rgba(229, 9, 20, 0.1)', padding: '10px', borderRadius: '6px', marginBottom: '20px', fontSize: '13px' }}>
            {verificationMessage}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            onClick={verifyPayment}
            disabled={checkingPayment}
            className="gms-btn gms-btn--primary"
            style={{ padding: '12px 24px', fontSize: '14px' }}
          >
            {checkingPayment ? 'Checking...' : 'I have entered my PIN'}
          </button>
          <button 
            onClick={() => { setPaymentInitiated(false); setCaptchaUrl(null); setVerificationMessage(null); }}
            className="gms-btn"
            style={{ background: 'transparent', border: '1px solid var(--text2)', padding: '12px 20px', fontSize: '14px' }}
          >
            Cancel / Back
          </button>
        </div>
      </div>
    );
  }

  // ── VIEW 3: Payment Form (Plan Selected) ──
  if (selectedPlan) {
    const showTabs = hasAutomatedPayment && manualPaymentSettings?.enabled;

    return (
      <div style={{ maxWidth: '520px', margin: '0 auto', background: 'var(--bg2)', padding: '28px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={() => setSelectedPlan(null)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text2)', cursor: 'pointer', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
        >
          ← Choose a different plan
        </button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', color: '#fff', fontSize: '20px' }}>{selectedPlan.name}</h2>
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
              {selectedPlan.duration_days} Days Unlimited Access
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            {promoResult?.valid && promoResult.finalAmount < selectedPlan.price ? (
              <>
                <div style={{ textDecoration: 'line-through', color: 'var(--text3)', fontSize: '12px' }}>
                  {fmt(selectedPlan.price)}
                </div>
                <div style={{ color: '#4ade80', fontSize: '20px', fontWeight: '900' }}>
                  {fmt(promoResult.finalAmount)}
                </div>
              </>
            ) : (
              <div style={{ color: 'var(--acc)', fontSize: '20px', fontWeight: '900' }}>
                {fmt(selectedPlan.price)}
              </div>
            )}
          </div>
        </div>

        {/* Promo / Gift Code Field */}
        {promoEnabled && (
          <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', border: '1px solid var(--border)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text2)', marginBottom: '6px' }}>
              Have a promo or gift code?
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={promoCode}
                onChange={e => setPromoCode(e.target.value.toUpperCase())}
                placeholder="e.g. SAVE50"
                style={{ flex: 1, padding: '9px 12px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontFamily: 'monospace', letterSpacing: '1px', fontSize: '13px' }}
              />
              <button
                type="button"
                onClick={applyPromo}
                disabled={promoLoading || !promoCode.trim()}
                className="gms-btn gms-btn--ghost"
                style={{ padding: '9px 14px', flexShrink: 0, fontSize: '12px' }}
              >
                {promoLoading ? '...' : 'Apply'}
              </button>
            </div>
            {promoResult && (
              <p style={{ margin: '6px 0 0', fontSize: '12px', color: promoResult.valid ? '#4ade80' : '#ff6b6b', fontWeight: '600' }}>
                {promoResult.valid ? promoResult.message : promoResult.error}
              </p>
            )}
          </div>
        )}

        {/* Payment Method Switcher Tabs (if both automated and manual are available) */}
        {showTabs && (
          <div style={{ display: 'flex', gap: '6px', marginBottom: '20px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
            <button
              type="button"
              onClick={() => { setPaymentMode('automated'); setError(null); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: paymentMode === 'automated' ? 'var(--acc)' : 'transparent',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              ⚡ Instant Telecom Prompt
            </button>
            <button
              type="button"
              onClick={() => { setPaymentMode('manual'); setError(null); }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: paymentMode === 'manual' ? '#0284c7' : 'transparent',
                color: '#fff',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              📱 Direct Transfer / MoMo
            </button>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ff6b6b', padding: '12px 14px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* ── OPTION A: MANUAL / DIRECT TRANSFER FORM ── */}
        {paymentMode === 'manual' && (
          <div>
            <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#38bdf8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>📋 Official Payment Numbers</span>
              </div>
              
              {/* Parse receiving numbers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {manualPaymentSettings.numbers.split('\n').filter(Boolean).map((line, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '8px 12px', borderRadius: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#fff', fontFamily: 'monospace' }}>{line}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(line, idx)}
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                    >
                      {copiedIndex === idx ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                ))}
              </div>

              {manualPaymentSettings.instructions && (
                <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text2)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {manualPaymentSettings.instructions}
                </div>
              )}
            </div>

            <form onSubmit={handleManualPaymentSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#fff', fontWeight: '600', marginBottom: '6px' }}>
                  Phone Number or Account You Sent Money From <span style={{ color: 'var(--acc)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  placeholder="e.g. 0772123456 or Sender Name"
                  required
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '15px' }}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>
                  Transaction ID / Reference / Receipt No. (Optional)
                </label>
                <input 
                  type="text" 
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="e.g. MP261015.1234 or SMS reference"
                  style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '14px' }}
                />
              </div>

              <button
                type="submit"
                disabled={manualSubmitting}
                className="gms-btn"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 'bold', background: '#0284c7', color: '#fff', borderRadius: '8px' }}
              >
                {manualSubmitting ? 'Submitting Details...' : `I Have Sent ${fmt(finalPrice)} (Submit)`}
              </button>
            </form>
          </div>
        )}

        {/* ── OPTION B: AUTOMATED TELECOM PROMPT FORM ── */}
        {paymentMode === 'automated' && (
          <form onSubmit={handlePaymentSubmit}>
            {vpnDetected && (
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#ff6b6b', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '12px' }}>
                ⚠️ Please disconnect your VPN before requesting automated mobile money prompt.
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>
                Network Provider
              </label>
              <select 
                value={network}
                onChange={e => setNetwork(e.target.value)}
                style={{ width: '100%', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border)', color: '#fff', borderRadius: '6px', fontSize: '14px' }}
                required
              >
                <option value="" disabled>Select Network</option>
                <option value="MTN">MTN</option>
                <option value="AIRTEL">Airtel</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: 'var(--text2)', marginBottom: '6px' }}>
                Mobile Money Number
              </label>
              <input 
                type="tel" 
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 077XXXXXXX"
                required
                style={{ width: '100%', padding: '14px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px', fontSize: '15px' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="gms-btn gms-btn--primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', display: 'flex', justifyContent: 'center' }}
            >
              {loading ? 'Initiating...' : `Pay ${fmt(finalPrice)} (Instant Prompt)`}
            </button>
          </form>
        )}
      </div>
    );
  }

  // ── VIEW 4: Plans List (Default) ──
  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.25)', borderRadius: '20px', padding: '5px 14px', marginBottom: '16px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--acc)', display: 'inline-block' }} />
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--acc)', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            {platformName} Premium
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: '900', margin: '0 0 10px', letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          Choose Your Plan
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px', maxWidth: '360px', margin: '0 auto', lineHeight: '1.6' }}>
          Unlock unlimited HD streaming and downloads.
        </p>
      </div>

      {offer?.enabled && (
        <div style={{ maxWidth: '960px', margin: '0 auto 20px' }}>
          <OfferCountdown durationMinutes={offer.durationMinutes} discountPercent={offer.discountPercent} variant="banner" />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 300px))', gap: '14px', maxWidth: '960px', margin: '0 auto', justifyContent: 'center' }}>
        {plans.map((plan, index) => {
          const isBest = index === 1 || (plans.length === 1);
          const features = plan.features?.split(',').slice(0, 4) || [];
          return (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                padding: '20px',
                background: isBest ? 'rgba(229, 9, 20, 0.06)' : 'var(--bg2)',
                border: isBest ? '2px solid var(--acc)' : '2px solid rgba(255,255,255,0.08)',
                borderRadius: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {isBest && (
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: 'var(--acc)', color: '#fff', fontSize: '10px', fontWeight: '800', padding: '3px 12px', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px', textTransform: 'uppercase', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                  Best Value
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: isBest ? '12px' : '0', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800', color: '#fff' }}>
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
                  <div style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600' }}>{currency}</div>
                </div>
              </div>

              {features.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px' }}>
                  {features.map((feature, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text3)', fontSize: '13px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {feature.trim()}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={(e) => { e.stopPropagation(); handleSelectPlan(plan); }}
                className={`gms-btn ${isBest ? 'gms-btn--primary' : 'gms-btn--ghost'}`}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginTop: 'auto' }}
              >
                Get Started
              </button>
            </div>
          );
        })}
      </div>

      <div style={{ textAlign: 'center', marginTop: '36px', display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
        {['Direct Mobile Money & Bank Transfer', 'Instant account activation', 'Cancel anytime'].map(text => (
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
