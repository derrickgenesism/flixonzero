'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { instantActivateAffiliate } from './referrals/actions';
import ConvertEarningsModal from './ConvertEarningsModal';

export default function AffiliateEarnCard({
  affiliateCode = null,
  affiliateStatus = null,
  availableBalance = 0,
  subscriptionEndDate = null,
  plans = [],
  boostData = null,
  siteUrl = 'https://flixon.net'
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [activating, setActivating] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [simFriends, setSimFriends] = useState(5);

  const isApproved = affiliateCode && (affiliateStatus === 'approved' || !affiliateStatus);
  // Guarantee official domain https://flixon.net is always used (never leaking vercel.app deployment URLs)
  const cleanBaseUrl = (!siteUrl || siteUrl.includes('vercel.app') || siteUrl.includes('your-domain'))
    ? 'https://flixon.net'
    : siteUrl.replace(/\/+$/, '');
  const referralLink = affiliateCode ? `${cleanBaseUrl}/?ref=${affiliateCode}` : '';

  // Commission calculation for simulator (e.g. 3,000 UGX per monthly pass or 25%)
  const monthlyCommission = boostData?.multiplier ? Math.round(3000 * Number(boostData.multiplier)) : 3000;
  const simulatedEarnings = simFriends * monthlyCommission;

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
          background: 'linear-gradient(145deg, rgba(251,191,36,0.08) 0%, rgba(20,20,20,0.95) 100%)',
          borderRadius: '16px',
          padding: '28px',
          marginBottom: '24px',
          border: '1px solid rgba(251,191,36,0.25)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          position: 'relative',
          overflow: 'hidden'
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
              letterSpacing: '0.5px'
            }}
          >
            <span>🔥</span>
            <span>{boostData.multiplier}X COMMISSION BOOST ACTIVE: All rewards doubled right now!</span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
              <span>💰</span> FlixOn Affiliate & Earning Program
            </div>
            <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#fff', margin: '0 0 6px' }}>
              Turn Your Movie Love Into Real Cash
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text2)', maxWidth: '600px', lineHeight: '1.5' }}>
              Share FlixOn movies with friends or on social media. Earn instant cash on every visitor click and high commissions whenever someone subscribes!
            </p>
          </div>

          {isApproved && (
            <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', color: '#fbbf24' }}>
              Partner Code: <strong style={{ color: '#fff' }}>{affiliateCode}</strong>
            </div>
          )}
        </div>

        {!isApproved ? (
          /* Step 1: User Has Not Activated Yet -> Instant 1-Click Activation */
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>⚡</span>
                <div>
                  <strong style={{ color: '#fff', fontSize: '13px' }}>Instant 1-Click Link</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>No waiting for manual approval</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>📱</span>
                <div>
                  <strong style={{ color: '#fff', fontSize: '13px' }}>WhatsApp & Social Sharing</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Pre-made Luganda & English templates</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '22px' }}>💵</span>
                <div>
                  <strong style={{ color: '#fff', fontSize: '13px' }}>MTN / Airtel Cash Out</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Withdraw or convert to free VIP days</div>
                </div>
              </div>
            </div>

            <button
              onClick={handleActivate}
              disabled={activating}
              className="gms-btn gms-btn--primary"
              style={{ padding: '14px 28px', fontSize: '15px', fontWeight: '800', background: '#d97706', borderColor: '#d97706' }}
            >
              {activating ? 'Generating Your Link...' : '⚡ Start Earning Money — Get My Link'}
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
                    flex: 1,
                    minWidth: '240px',
                    padding: '12px 14px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'monospace'
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
                    cursor: 'pointer'
                  }}
                >
                  {copied ? '✓ Link Copied!' : '📋 Copy Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="gms-btn gms-btn--ghost"
                  style={{ padding: '12px 16px', fontSize: '13px', cursor: 'pointer' }}
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

            {/* Interactive Earnings Simulator */}
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                  📊 Potential Earnings Calculator:
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text2)' }}>
                  If <strong>{simFriends} friends</strong> buy Monthly Pass:
                </span>
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
                  Earn up to {monthlyCommission.toLocaleString()} UGX per monthly subscription
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
                <div style={{ fontSize: '24px', fontWeight: '900', color: '#fbbf24' }}>
                  {Number(availableBalance).toLocaleString()} UGX
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {availableBalance >= 1000 && (
                  <button
                    type="button"
                    onClick={() => setShowConvertModal(true)}
                    className="gms-btn gms-btn--ghost"
                    style={{ padding: '10px 18px', fontSize: '14px', borderColor: 'rgba(251,191,36,0.3)', color: '#fbbf24' }}
                  >
                    ⚡ Convert to VIP Pass...
                  </button>
                )}

                <Link
                  href="/account/referrals"
                  className="gms-btn gms-btn--primary"
                  style={{ padding: '10px 18px', fontSize: '14px', background: '#d97706', borderColor: '#d97706' }}
                >
                  Partner Dashboard & Cash Out →
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
    </>
  );
}
