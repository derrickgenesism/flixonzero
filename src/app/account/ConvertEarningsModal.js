'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConvertEarningsModal({
  isOpen,
  onClose,
  availableBalance = 0,
  subscriptionEndDate = null,
  plans = []
}) {
  const router = useRouter();
  const [selectedPlanId, setSelectedPlanId] = useState('daily');
  const [customDays, setCustomDays] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Daily plan price from database plans or default 1000 UGX
  const dailyPlan = plans.find(p => p.duration_days === 1) || { price: 1000, duration_days: 1 };
  const twoWeeksPlan = plans.find(p => p.duration_days === 14) || { price: 5000, duration_days: 14 };
  const monthlyPlan = plans.find(p => p.duration_days === 30) || { price: 9000, duration_days: 30 };

  const dailyRate = Math.round(Number(dailyPlan.price) / Number(dailyPlan.duration_days));

  // Determine current subscription days remaining
  const now = new Date();
  const currentExpiry = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
  const isSubActive = currentExpiry && currentExpiry > now;
  const currentDaysLeft = isSubActive
    ? Math.max(0, Math.ceil((currentExpiry - now) / (1000 * 60 * 60 * 24)))
    : 0;

  // Compute selected days and cost based on selected option
  let daysToAdd = 1;
  let costUgx = dailyRate;

  if (selectedPlanId === 'daily') {
    daysToAdd = Math.max(1, Number(customDays) || 1);
    costUgx = daysToAdd * dailyRate;
  } else if (selectedPlanId === '2weeks') {
    daysToAdd = Number(twoWeeksPlan.duration_days);
    costUgx = Number(twoWeeksPlan.price);
  } else if (selectedPlanId === 'monthly') {
    daysToAdd = Number(monthlyPlan.duration_days);
    costUgx = Number(monthlyPlan.price);
  }

  const newTotalDays = currentDaysLeft + daysToAdd;
  const baseDate = isSubActive ? currentExpiry : now;
  const projectedExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  const canAfford = availableBalance >= costUgx;

  async function handleConvert() {
    if (!canAfford) {
      setError(`Insufficient balance. You need ${costUgx.toLocaleString()} UGX but have ${availableBalance.toLocaleString()} UGX.`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/referrals/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          days: daysToAdd,
          cost: costUgx,
          planId: selectedPlanId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
        router.refresh();
      } else {
        setError(data.error || 'Conversion failed. Please try again.');
        setConfirming(false);
      }
    } catch {
      setError('Network connection error. Please try again.');
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg2, #141414)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px',
          position: 'relative',
          boxShadow: '0 25px 60px rgba(0,0,0,0.85)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>

        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 8px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>
              ✓
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '10px' }}>VIP Days Added!</h2>
            
            <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '12px', padding: '16px', marginBottom: '20px', textAlign: 'left' }}>
              <div style={{ fontSize: '13px', color: '#4ade80', fontWeight: '700', marginBottom: '6px' }}>Conversion Breakdown:</div>
              <div style={{ color: '#fff', fontSize: '14px', lineHeight: '1.6' }}>
                • Added: <strong>+{result.daysAdded} VIP Watch Days</strong><br />
                {result.prevDays > 0 && (
                  <>• Previous remaining: <strong>{result.prevDays} days</strong><br /></>
                )}
                • New Total: <strong style={{ color: '#4ade80' }}>{result.newTotalDays} days remaining</strong><br />
                • Active until: <strong>{new Date(result.newExpiry).toLocaleDateString('en-UG', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setResult(null);
                setConfirming(false);
                onClose();
              }}
              className="gms-btn gms-btn--primary"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              Done
            </button>
          </div>
        ) : confirming ? (
          /* Step 2: Explicit Confirmation */
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>⚠️</div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#fff', margin: '0 0 6px' }}>
                Confirm Conversion
              </h2>
              <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0 }}>
                Please review your conversion details carefully. This transaction cannot be undone.
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                <span style={{ color: 'var(--text3)' }}>Balance Deducted:</span>
                <strong style={{ color: '#fbbf24' }}>-{costUgx.toLocaleString()} UGX</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                <span style={{ color: 'var(--text3)' }}>Watch Days Added:</span>
                <strong style={{ color: '#4ade80' }}>+{daysToAdd} Days</strong>
              </div>
              {currentDaysLeft > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text3)' }}>Existing Days:</span>
                  <span style={{ color: '#fff' }}>{currentDaysLeft} Days</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '14px' }}>
                <span style={{ color: 'var(--text3)' }}>New Total Days:</span>
                <strong style={{ color: '#4ade80' }}>{newTotalDays} Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                <span style={{ color: 'var(--text3)' }}>New Expiry Date:</span>
                <strong style={{ color: '#fff' }}>
                  {projectedExpiry.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </strong>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={loading}
                className="gms-btn gms-btn--ghost"
                style={{ flex: 1, padding: '12px', fontSize: '14px' }}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConvert}
                disabled={loading}
                className="gms-btn gms-btn--primary"
                style={{ flex: 1.4, padding: '12px', fontSize: '14px', background: '#d97706', borderColor: '#d97706', fontWeight: '800' }}
              >
                {loading ? 'Converting...' : `Yes, Convert ${costUgx.toLocaleString()} UGX`}
              </button>
            </div>
          </div>
        ) : (
          /* Step 1: Selection Form */
          <div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#fbbf24', textTransform: 'uppercase' }}>
                FlixOn Rewards
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '4px 0 6px' }}>
                Convert Earnings to VIP Days
              </h2>
              <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0 }}>
                Redeem your partner earnings into VIP streaming access. Pricing strictly matches FlixOn subscription plans.
              </p>
            </div>

            {/* Current Status Box */}
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '14px 16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Your Referral Balance:</span>
                <strong style={{ fontSize: '16px', color: '#fbbf24' }}>{availableBalance.toLocaleString()} UGX</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Current Subscription:</span>
                <span style={{ fontSize: '13px', color: isSubActive ? '#4ade80' : 'var(--text3)', fontWeight: '600' }}>
                  {isSubActive ? `Active (${currentDaysLeft} days remaining)` : 'No Active Plan'}
                </span>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', padding: '10px 14px', color: '#ff6b6b', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {/* Plan Equivalent Options */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '10px', color: '#fff' }}>
                Choose Package Equivalent:
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Option 1: Daily Equivalent */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${selectedPlanId === 'daily' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedPlanId === 'daily' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="planOption"
                      checked={selectedPlanId === 'daily'}
                      onChange={() => setSelectedPlanId('daily')}
                    />
                    <div>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>
                        Daily Pass Rate ({dailyRate.toLocaleString()} UGX / day)
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                        Select exact number of days
                      </div>
                    </div>
                  </div>
                  <strong style={{ color: '#fbbf24', fontSize: '14px' }}>
                    {(customDays * dailyRate).toLocaleString()} UGX
                  </strong>
                </label>

                {/* Custom days counter if daily selected */}
                {selectedPlanId === 'daily' && (
                  <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Number of Days:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setCustomDays(Math.max(1, customDays - 1))}
                        className="gms-btn gms-btn--ghost"
                        style={{ padding: '4px 12px', fontSize: '14px' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff', minWidth: '24px', textAlign: 'center' }}>
                        {customDays}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const nextDays = customDays + 1;
                          if (nextDays * dailyRate <= availableBalance) {
                            setCustomDays(nextDays);
                          }
                        }}
                        disabled={(customDays + 1) * dailyRate > availableBalance}
                        className="gms-btn gms-btn--ghost"
                        style={{ padding: '4px 12px', fontSize: '14px' }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {/* Option 2: 2 Weeks Pass (14 Days) */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${selectedPlanId === '2weeks' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedPlanId === '2weeks' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="planOption"
                      checked={selectedPlanId === '2weeks'}
                      onChange={() => setSelectedPlanId('2weeks')}
                    />
                    <div>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>
                        2 Weeks Pass (+14 Days)
                      </div>
                      <div style={{ fontSize: '12px', color: '#4ade80' }}>
                        Best value 2-week plan
                      </div>
                    </div>
                  </div>
                  <strong style={{ color: '#fbbf24', fontSize: '14px' }}>
                    {Number(twoWeeksPlan.price).toLocaleString()} UGX
                  </strong>
                </label>

                {/* Option 3: Monthly Pass (30 Days) */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: `1px solid ${selectedPlanId === 'monthly' ? '#fbbf24' : 'rgba(255,255,255,0.1)'}`,
                    background: selectedPlanId === 'monthly' ? 'rgba(251,191,36,0.08)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="planOption"
                      checked={selectedPlanId === 'monthly'}
                      onChange={() => setSelectedPlanId('monthly')}
                    />
                    <div>
                      <div style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>
                        Monthly Pass (+30 Days)
                      </div>
                      <div style={{ fontSize: '12px', color: '#4ade80' }}>
                        Full 30 days unlimited access
                      </div>
                    </div>
                  </div>
                  <strong style={{ color: '#fbbf24', fontSize: '14px' }}>
                    {Number(monthlyPlan.price).toLocaleString()} UGX
                  </strong>
                </label>
              </div>
            </div>

            {/* Live Calculation Preview */}
            <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '13px', lineHeight: '1.6' }}>
              <div style={{ color: '#60a5fa', fontWeight: '700', marginBottom: '2px' }}>
                ✨ Live Calculation Preview:
              </div>
              <div style={{ color: '#fff' }}>
                • Converting: <strong>{costUgx.toLocaleString()} UGX</strong><br />
                • Adding: <strong>+{daysToAdd} Watch Days</strong> to your current {currentDaysLeft} days<br />
                • New Expiry: <strong>{newTotalDays} days total</strong> (active until {projectedExpiry.toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })})
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!canAfford) {
                  setError(`Insufficient balance. You need ${costUgx.toLocaleString()} UGX.`);
                  return;
                }
                setConfirming(true);
              }}
              disabled={!canAfford}
              className="gms-btn gms-btn--primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '800',
                background: canAfford ? '#d97706' : 'rgba(255,255,255,0.1)',
                borderColor: canAfford ? '#d97706' : 'transparent',
                cursor: canAfford ? 'pointer' : 'not-allowed'
              }}
            >
              {canAfford ? `Review & Convert ${costUgx.toLocaleString()} UGX →` : `Insufficient Balance (Need ${costUgx.toLocaleString()} UGX)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
