'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { requestPayout } from './referrals/actions';

export default function WithdrawCashModal({
  isOpen,
  onClose,
  availableBalance = 0,
  minPayout = 5000,
  withdrawalFee = 500
}) {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [accountName, setAccountName] = useState('');
  const [network, setNetwork] = useState('mtn'); // 'mtn' | 'airtel'
  const [step, setStep] = useState('input'); // 'input' | 'confirm' | 'success'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const numAmount = Number(amount) || 0;
  const netAmount = Math.max(0, numAmount - withdrawalFee);
  const canAfford = numAmount >= minPayout && numAmount <= availableBalance;

  // Auto-detect network from Uganda phone prefix
  function handlePhoneChange(val) {
    setPhone(val);
    const cleaned = val.replace(/\s+/g, '').replace(/^\+?256/, '0');
    if (cleaned.startsWith('077') || cleaned.startsWith('078') || cleaned.startsWith('076')) {
      setNetwork('mtn');
    } else if (cleaned.startsWith('070') || cleaned.startsWith('075') || cleaned.startsWith('074')) {
      setNetwork('airtel');
    }
  }

  function handleSetPreset(val) {
    const target = Math.min(val, availableBalance);
    setAmount(String(target));
    setError('');
  }

  function handleReview(e) {
    if (e && e.preventDefault) e.preventDefault();
    setError('');

    if (numAmount < minPayout) {
      setError(`Minimum withdrawal amount is ${minPayout.toLocaleString()} UGX.`);
      return;
    }
    if (numAmount > availableBalance) {
      setError(`Requested amount exceeds available balance (${availableBalance.toLocaleString()} UGX).`);
      return;
    }
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Please enter a valid Ugandan phone number (e.g. 077XXXXXXX or 075XXXXXXX).');
      return;
    }

    setStep('confirm');
  }

  async function handleConfirmSubmit() {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('amount', String(numAmount));
      formData.append('phone', phone);
      if (accountName) {
        formData.append('account_name', accountName);
      }
      formData.append('network', network);

      const res = await requestPayout(formData);
      if (res?.success) {
        setSuccessMsg(res.message || 'Withdrawal request submitted successfully!');
        setStep('success');
        router.refresh();
      } else {
        setError(res?.error || 'Failed to submit withdrawal request. Please try again.');
        setStep('input');
      }
    } catch {
      setError('Network communication error. Please check your connection.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setError('');
    setStep('input');
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: '#18181b',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '20px',
          padding: '24px',
          maxWidth: '460px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          color: '#fff',
          boxSizing: 'border-box',
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
            💵
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#fff' }}>
              Cash Out to Mobile Money
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text3)' }}>
              MTN MoMo & Airtel Money · Fast Payout
            </p>
          </div>
        </div>

        {/* Balance Status Banner */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '12px 16px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Available Balance</div>
            <div style={{ fontSize: '20px', fontWeight: '900', color: '#4ade80' }}>
              {availableBalance.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>UGX</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase' }}>Min Payout</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24' }}>
              {minPayout.toLocaleString()} UGX
            </div>
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', lineHeight: '1.4' }}>
            ⚠️ {error}
          </div>
        )}

        {step === 'success' ? (
          /* Step 3: Success Screen */
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '52px', marginBottom: '12px' }}>🎉</div>
            <h4 style={{ fontSize: '18px', fontWeight: '800', color: '#4ade80', margin: '0 0 8px' }}>
              Withdrawal Request Placed!
            </h4>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6', margin: '0 0 20px' }}>
              {successMsg}
            </p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '14px', marginBottom: '24px', textAlign: 'left', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text3)' }}>Gross Amount:</span>
                <span style={{ fontWeight: '700' }}>{numAmount.toLocaleString()} UGX</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: 'var(--text3)' }}>Telecom Transfer Fee:</span>
                <span style={{ color: '#f87171' }}>-{withdrawalFee.toLocaleString()} UGX</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                <span style={{ fontWeight: '700', color: '#4ade80' }}>Net Cash Sent:</span>
                <span style={{ fontWeight: '800', color: '#4ade80' }}>{netAmount.toLocaleString()} UGX</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <span style={{ color: 'var(--text3)' }}>Sent To Phone:</span>
                <span style={{ fontWeight: '700', color: '#fff' }}>{phone}</span>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="gms-btn gms-btn--primary"
              style={{ width: '100%', padding: '12px', fontWeight: '700' }}
            >
              Done & Return
            </button>
          </div>
        ) : step === 'confirm' ? (
          /* Step 2: Confirmation Screen */
          <div>
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '12px', padding: '16px', marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', marginBottom: '8px' }}>
                🔍 Please Confirm Your Details
              </div>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--text2)', lineHeight: '1.5' }}>
                Please ensure your mobile money phone number is registered and active. Funds sent to wrong numbers cannot be reversed.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Network:</span>
                  <span style={{ fontWeight: '700', color: network === 'mtn' ? '#facc15' : '#ef4444' }}>
                    {network === 'mtn' ? '🟡 MTN Mobile Money' : '🔴 Airtel Money'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Recipient Phone:</span>
                  <span style={{ fontWeight: '700', fontFamily: 'monospace', color: '#fff' }}>{phone}</span>
                </div>
                {accountName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text3)' }}>Recipient Name:</span>
                    <span style={{ fontWeight: '700', color: '#fff' }}>{accountName}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Gross Requested:</span>
                  <span style={{ fontWeight: '700' }}>{numAmount.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text3)' }}>Telecom Fee:</span>
                  <span style={{ color: '#f87171' }}>-{withdrawalFee.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', fontSize: '14px' }}>
                  <span style={{ fontWeight: '800', color: '#4ade80' }}>Net Cash Received:</span>
                  <span style={{ fontWeight: '900', color: '#4ade80' }}>{netAmount.toLocaleString()} UGX</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStep('input')}
                disabled={loading}
                className="gms-btn gms-btn--ghost"
                style={{ flex: 1, padding: '12px', fontSize: '14px' }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={loading}
                className="gms-btn gms-btn--primary"
                style={{ flex: 1.6, padding: '12px', fontSize: '14px', background: '#22c55e', borderColor: '#22c55e', fontWeight: '800' }}
              >
                {loading ? 'Submitting...' : 'Confirm Cashout →'}
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Input Form */
          <form onSubmit={handleReview} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Network Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Select Mobile Money Network
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setNetwork('mtn')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: network === 'mtn' ? '2px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                    background: network === 'mtn' ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🟡</span> MTN MoMo
                </button>
                <button
                  type="button"
                  onClick={() => setNetwork('airtel')}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: network === 'airtel' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                    background: network === 'airtel' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                    color: '#fff',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🔴</span> Airtel Money
                </button>
              </div>
            </div>

            {/* Amount Input with Presets */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Amount to Withdraw (UGX)
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  Min: {minPayout.toLocaleString()} UGX
                </span>
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`e.g. ${minPayout}`}
                min={minPayout}
                max={availableBalance}
                required
                className="flx-form-input"
                style={{ width: '100%', boxSizing: 'border-box', fontSize: '16px', fontWeight: '700' }}
              />

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleSetPreset(minPayout)}
                  style={{
                    background: numAmount === minPayout ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Min ({minPayout.toLocaleString()})
                </button>
                {availableBalance >= 10000 && (
                  <button
                    type="button"
                    onClick={() => handleSetPreset(10000)}
                    style={{
                      background: numAmount === 10000 ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    10,000 UGX
                  </button>
                )}
                {availableBalance >= 20000 && (
                  <button
                    type="button"
                    onClick={() => handleSetPreset(20000)}
                    style={{
                      background: numAmount === 20000 ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    20,000 UGX
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSetPreset(availableBalance)}
                  style={{
                    background: numAmount === availableBalance ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#4ade80',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  All Balance
                </button>
              </div>
            </div>

            {/* Phone Number Input */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Mobile Money Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder={network === 'mtn' ? '077... or 078...' : '070... or 075...'}
                required
                className="flx-form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Recipient Account Name (Optional for validation) */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Registered Name on Account (Optional)
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. John Mukasa"
                className="flx-form-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Live Fee & Net Breakdown */}
            {numAmount >= minPayout && (
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(74,222,128,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>
                  <span>Gross Withdrawal:</span>
                  <span style={{ fontWeight: '600', color: '#fff' }}>{numAmount.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f87171', marginBottom: '8px' }}>
                  <span>Telecom Transfer Fee:</span>
                  <span>-{withdrawalFee.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                  <span style={{ color: '#4ade80' }}>Net Cash Sent:</span>
                  <span style={{ color: '#4ade80' }}>{netAmount.toLocaleString()} UGX</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={availableBalance < minPayout}
              className="gms-btn gms-btn--primary"
              style={{
                background: availableBalance >= minPayout ? '#22c55e' : 'rgba(255,255,255,0.1)',
                borderColor: availableBalance >= minPayout ? '#22c55e' : 'transparent',
                width: '100%',
                padding: '14px',
                fontWeight: '800',
                fontSize: '15px',
                cursor: availableBalance >= minPayout ? 'pointer' : 'not-allowed',
                whiteSpace: 'normal',
                textAlign: 'center',
                boxSizing: 'border-box'
              }}
            >
              {availableBalance < minPayout
                ? `Minimum ${minPayout.toLocaleString()} UGX Required to Cash Out`
                : (netAmount > 0
                    ? `Review & Withdraw ${netAmount.toLocaleString()} UGX Net →`
                    : 'Review Withdrawal Details →')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
