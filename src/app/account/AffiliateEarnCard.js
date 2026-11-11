'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { instantActivateAffiliate } from './referrals/actions';
import ConvertEarningsModal from './ConvertEarningsModal';
import WithdrawCashModal from './WithdrawCashModal';
import { calculateAllPlanRewards } from '@/lib/affiliateCalculations';

export default function AffiliateEarnCard({
  affiliateCode = null,
  affiliateStatus = null,
  availableBalance = 0,
  subscriptionEndDate = null,
  plans = [],
  boostData = null,
  affiliateConfig = {},
  siteUrl = 'https://flixon.net'
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [simFriends, setSimFriends] = useState(5);
  const [selectedSimPlanId, setSelectedSimPlanId] = useState(() => plans[plans.length - 1]?.id || 3);

  const isApproved = affiliateCode && (affiliateStatus === 'approved' || !affiliateStatus);
  const cleanBaseUrl = (!siteUrl || siteUrl.includes('vercel.app') || siteUrl.includes('your-domain'))
    ? 'https://flixon.net'
    : siteUrl.replace(/\/+$/, '');
  const referralLink = affiliateCode ? `${cleanBaseUrl}/?ref=${affiliateCode}` : '';

  // Calculate dynamic commissions for every active subscription package
  const planRewards = calculateAllPlanRewards(plans, affiliateConfig);

  // Dynamic Simulator calculation
  const simPlanReward = planRewards.find(r => r.planId === Number(selectedSimPlanId)) || planRewards[planRewards.length - 1] || { reward: 2800, planName: 'Monthly Pass', percent: 35 };
  const simulatedEarnings = simFriends * Number(simPlanReward.reward || 0);

  // Global settings for payout
  const minPayout = Number(affiliateConfig?.minPayout || 5000);
  const withdrawalFee = Number(affiliateConfig?.withdrawalFee || 500);
  const globalPct = Number(affiliateConfig?.commissionPercentage || 35);

  // Social share URLs
  const shareText = encodeURIComponent(
    `Eeh banange! 🎬 Check out FlixOn for HD Ugandan translated movies (VJ Junior, VJ Emmy, VJ Jingo) & blockbusters! Watch free or get VIP access with my link: ${referralLink}`
  );
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Watch HD movies and series on FlixOn!')}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(referralLink)}`;

  function handleCopy() {
    if (!referralLink) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleActivate() {
    setActivating(true);
    try {
      const res = await instantActivateAffiliate();
      if (res?.success) {
        router.refresh();
      } else {
        alert(res?.error || 'Failed to activate partner code. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    } finally {
      setActivating(false);
    }
  }

  return (
    <>
      <div
        style={{
          background: 'linear-gradient(145deg, rgba(251,191,36,0.08) 0%, rgba(20,20,20,0.98) 100%)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '24px',
          border: '1px solid rgba(251,191,36,0.25)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden',
          boxSizing: 'border-box',
          width: '100%',
          maxWidth: '100%'
        }}
      >
        {/* Promotional Boost Banner */}
        {boostData && (
          <div
            style={{
              background: 'linear-gradient(90deg, #e50914 0%, #d97706 100%)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '16px',
              letterSpacing: '0.5px',
              flexWrap: 'wrap'
            }}
          >
            <span>🔥</span>
            <span>{boostData.multiplier}X COMMISSION BOOST ACTIVE: All partner rewards multiplied right now!</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
              <span>💰</span> FlixOn Partner & Earning Program
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#fff', margin: '0 0 8px', lineHeight: '1.25', wordBreak: 'break-word' }}>
              Turn Movie Sharing Into Daily Mobile Money
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text2)', lineHeight: '1.6', maxWidth: '680px' }}>
              Invite friends, family, and movie lovers to watch translated blockbusters and series on FlixOn. 
              Earn guaranteed cash on every subscription and withdraw straight to your MTN or Airtel Mobile Money!
            </p>
          </div>

          {isApproved && (
            <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', padding: '8px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: '700', color: '#fbbf24', flexShrink: 0 }}>
              Partner Code: <strong style={{ color: '#fff', fontFamily: 'monospace', fontSize: '13px' }}>{affiliateCode}</strong>
            </div>
          )}
        </div>

        {/* 3 Step Visual Guide */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(251,191,36,0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>
              1
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '2px' }}>Share Your Link</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.4' }}>Send on WhatsApp, TikTok bio, Facebook or group chats.</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(74,222,128,0.15)', color: '#4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>
              2
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '2px' }}>Friends Subscribe</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.4' }}>When they buy any VIP pass, you earn up to {globalPct}% cash instantly.</div>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '14px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', flexShrink: 0 }}>
              3
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: '700', fontSize: '13px', color: '#fff', marginBottom: '2px' }}>Instant Cashout</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)', lineHeight: '1.4' }}>Withdraw directly to MTN or Airtel Mobile Money anytime.</div>
            </div>
          </div>
        </div>

        {/* PACKAGE EARNINGS BREAKDOWN: Exactly what you earn per package */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              🎯 What You Earn on Every Subscription Package:
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
              Commissions credited instantly to your partner balance
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
            {planRewards.map(rewardInfo => (
              <div
                key={rewardInfo.planId}
                style={{
                  background: 'rgba(0,0,0,0.35)',
                  border: rewardInfo.isBoosted ? '1px solid #d97706' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>{rewardInfo.planName}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{rewardInfo.price.toLocaleString()} UGX</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '4px 0 2px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '900', color: '#4ade80' }}>
                    +{rewardInfo.reward.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: '600' }}>UGX</span>
                  </span>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#fbbf24' }}>
                    ({rewardInfo.percent}%)
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  Per referral signup
                  {rewardInfo.isBoosted && <span style={{ color: '#f59e0b', fontWeight: '700', marginLeft: '4px' }}>🔥 {rewardInfo.multiplier}x Active</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isApproved ? (
          /* Step 1: User Has Not Activated Yet -> Instant 1-Click Activation */
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '14px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#fff', margin: '0 0 8px' }}>
              Ready to Start Earning Real Mobile Money?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text3)', maxWidth: '520px', margin: '0 auto 20px', lineHeight: '1.5' }}>
              Activate your official partner link in 1-click. Share on your status or social media and get paid on every friend who checks out FlixOn!
            </p>
            <button
              onClick={handleActivate}
              disabled={activating}
              className="gms-btn gms-btn--primary"
              style={{
                padding: '14px 32px',
                fontSize: '15px',
                fontWeight: '800',
                background: '#d97706',
                borderColor: '#d97706',
                cursor: 'pointer'
              }}
            >
              {activating ? 'Generating Your Link...' : '⚡ Get My Partner Link & Start Earning'}
            </button>
          </div>
        ) : (
          /* Step 2: User Is Approved Partner -> Full Sharing Hub & Calculator */
          <div>
            {/* Referral Link Box */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Your Personal Referral Link:
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  style={{
                    flex: '1 1 240px',
                    minWidth: '200px',
                    padding: '12px 14px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="gms-btn gms-btn--primary"
                  style={{
                    padding: '12px 20px',
                    fontWeight: '700',
                    fontSize: '13px',
                    background: copied ? '#22c55e' : '#d97706',
                    borderColor: copied ? '#22c55e' : '#d97706',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {copied ? '✓ Link Copied!' : '📋 Copy Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="gms-btn gms-btn--ghost"
                  style={{ padding: '12px 16px', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  title="Display QR code on screen for friends to scan"
                >
                  📱 Show QR Code
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div style={{ marginBottom: '22px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                Share Instantly to Social Networks:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#25D366', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
                >
                  💬 WhatsApp
                </a>
                <a
                  href={telegramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#0088cc', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
                >
                  ✈️ Telegram
                </a>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#1877F2', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
                >
                  📘 Facebook
                </a>
                <a
                  href={twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
                >
                  𝕏 Post
                </a>
              </div>
            </div>

            {/* Interactive Dynamic Earnings Simulator */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                  📊 Potential Earnings Calculator:
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>Plan:</span>
                  <select
                    value={selectedSimPlanId}
                    onChange={(e) => setSelectedSimPlanId(Number(e.target.value))}
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    {planRewards.map(p => (
                      <option key={p.planId} value={p.planId}>
                        {p.planName} ({p.price.toLocaleString()} UGX)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text2)' }}>
                If <strong>{simFriends} friends</strong> buy <strong>{simPlanReward.planName}</strong>:
              </div>

              <input
                type="range"
                min="1"
                max="25"
                value={simFriends}
                onChange={(e) => setSimFriends(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#fbbf24', cursor: 'pointer', marginBottom: '10px' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
                  Earn {simPlanReward.reward.toLocaleString()} UGX per subscription ({simPlanReward.percent}%)
                </span>
                <div style={{ fontSize: '18px', fontWeight: '900', color: '#fbbf24' }}>
                  You Earn: {simulatedEarnings.toLocaleString()} UGX
                </div>
              </div>
            </div>

            {/* Balance & Action Buttons Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase' }}>Available Referral Balance:</div>
                <div style={{ fontSize: '26px', fontWeight: '900', color: '#4ade80' }}>
                  {Number(availableBalance).toLocaleString()} <span style={{ fontSize: '14px', fontWeight: '600' }}>UGX</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                  Min cashout: {minPayout.toLocaleString()} UGX
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {/* Dedicated Cash Out / Withdraw Button */}
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(true)}
                  className="gms-btn gms-btn--primary"
                  style={{
                    padding: '11px 20px',
                    fontSize: '14px',
                    fontWeight: '800',
                    background: availableBalance >= minPayout ? '#22c55e' : 'rgba(255,255,255,0.1)',
                    borderColor: availableBalance >= minPayout ? '#22c55e' : 'transparent',
                    cursor: availableBalance >= minPayout ? 'pointer' : 'default',
                    whiteSpace: 'nowrap'
                  }}
                  title={availableBalance >= minPayout ? 'Withdraw directly to MTN or Airtel Mobile Money' : `Requires at least ${minPayout.toLocaleString()} UGX`}
                >
                  💵 Cash Out (Withdraw)
                </button>

                {availableBalance >= 1000 && (
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(true)}
                    className="gms-btn gms-btn--ghost"
                    style={{ padding: '11px 18px', fontSize: '14px', borderColor: 'rgba(96,165,250,0.3)', color: '#60a5fa', whiteSpace: 'nowrap' }}
                  >
                    ⚡ Convert to VIP Pass
                  </button>
                )}

                <Link
                  href="/account/referrals"
                  className="gms-btn gms-btn--ghost"
                  style={{ padding: '11px 18px', fontSize: '14px', borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24', whiteSpace: 'nowrap' }}
                >
                  Partner Dashboard →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal for In-Person Scanning */}
      {showQrModal && (
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
            padding: '20px'
          }}
          onClick={() => setShowQrModal(false)}
        >
          <div
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '16px',
              padding: '28px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowQrModal(false)}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#fff',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
            <h3 style={{ margin: '0 0 6px', color: '#fff', fontSize: '18px', fontWeight: '800' }}>Scan to Watch</h3>
            <p style={{ margin: '0 0 18px', fontSize: '12px', color: 'var(--text3)' }}>
              Ask a friend to scan this QR code with their phone camera to open FlixOn with your VIP referral link!
            </p>
            <div style={{ background: '#fff', padding: '14px', borderRadius: '12px', display: 'inline-block', marginBottom: '14px' }}>
              <img src={qrCodeUrl} alt="Referral QR Code" style={{ width: '200px', height: '200px', display: 'block' }} />
            </div>
            <div style={{ fontSize: '12px', color: '#fbbf24', fontWeight: '700' }}>Code: {affiliateCode}</div>
          </div>
        </div>
      )}

      {/* Safe 2-Step Convert Earnings Modal */}
      <ConvertEarningsModal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        availableBalance={availableBalance}
        subscriptionEndDate={subscriptionEndDate}
        plans={plans}
      />

      {/* Modern Mobile Money Withdraw Modal */}
      <WithdrawCashModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={availableBalance}
        minPayout={minPayout}
        withdrawalFee={withdrawalFee}
      />
    </>
  );
}
