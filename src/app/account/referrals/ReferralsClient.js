'use client';

import { useState } from 'react';
import { convertToWatchDays, requestPayout } from './actions';
import { calculateBonusWatchDays } from '@/lib/watchTimeBonus';
import { calculateAllPlanRewards } from '@/lib/affiliateCalculations';
import WithdrawCashModal from '../WithdrawCashModal';

export default function ReferralsClient({ 
  affiliate, 
  referralLink, 
  totalSignups = 0, 
  totalClicks = 0, 
  commissions = [],
  withdrawalFee = 500,
  minPayout = 5000,
  activePlans = [],
  affiliateConfig = {}
}) {
  const [copied, setCopied] = useState(false);
  const [copiedBio, setCopiedBio] = useState(false);
  const [convertAmount, setConvertAmount] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutPhone, setPayoutPhone] = useState('');
  const [payoutName, setPayoutName] = useState('');
  const [payoutNetwork, setPayoutNetwork] = useState('mtn');
  const [loadingConvert, setLoadingConvert] = useState(false);
  const [loadingPayout, setLoadingPayout] = useState(false);
  const [convertMessage, setConvertMessage] = useState(null);
  const [payoutMessage, setPayoutMessage] = useState(null);
  const [confirmConvert, setConfirmConvert] = useState(false);
  const [confirmPayout, setConfirmPayout] = useState(false);
  const [shareLanguage, setShareLanguage] = useState('luganda'); // 'luganda' or 'english'
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const availableBalance = Number(affiliate?.balance || 0);
  const totalEarned = Number(affiliate?.total_earned || 0);

  // Dynamic plan commissions
  const planRewards = calculateAllPlanRewards(activePlans, affiliateConfig);
  const maxReward = planRewards.length > 0 
    ? planRewards.reduce((prev, curr) => curr.reward > prev.reward ? curr : prev, planRewards[0])
    : { reward: 2800, percent: 35 };

  // 4-Tier Gamified Ladder
  let tierName = '🥉 Bronze Partner';
  let nextTierName = '🥈 Silver Ambassador';
  let tierPerk = `${maxReward.percent}% Subscription Bounty`;
  let tierProgress = Math.min(100, Math.round((totalSignups / 5) * 100));
  let targetSignups = 5;

  if (totalSignups >= 50) {
    tierName = '💎 Diamond Legend';
    nextTierName = 'Top Tier Reached';
    tierPerk = 'Max Perks + Priority Instant Payouts';
    tierProgress = 100;
    targetSignups = 50;
  } else if (totalSignups >= 20) {
    tierName = '🥇 Gold VIP Influencer';
    nextTierName = '💎 Diamond Legend';
    tierPerk = '+ Dedicated VIP Support & High Priority';
    tierProgress = Math.min(100, Math.round(((totalSignups - 20) / 30) * 100));
    targetSignups = 50;
  } else if (totalSignups >= 5) {
    tierName = '🥈 Silver Ambassador';
    nextTierName = '🥇 Gold VIP Influencer';
    tierPerk = '+ Priority Payout Queue';
    tierProgress = Math.min(100, Math.round(((totalSignups - 5) / 15) * 100));
    targetSignups = 20;
  }

  // Dynamic domain for referral link
  const effectiveLink = referralLink || (typeof window !== 'undefined' ? `${window.location.origin}/?ref=${affiliate?.referral_code || ''}` : `/?ref=${affiliate?.referral_code || ''}`);

  // Auto-detect network from Uganda phone prefix
  function handlePhoneChange(val) {
    setPayoutPhone(val);
    const cleaned = val.replace(/\s+/g, '').replace(/^\+?256/, '0');
    if (cleaned.startsWith('077') || cleaned.startsWith('078') || cleaned.startsWith('076')) {
      setPayoutNetwork('mtn');
    } else if (cleaned.startsWith('070') || cleaned.startsWith('075') || cleaned.startsWith('074')) {
      setPayoutNetwork('airtel');
    }
  }

  // Copy referral link handler
  function handleCopy() {
    if (!effectiveLink) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(effectiveLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  // Copy TikTok / Reel Bio caption
  const bioCaption = `🎬 Watch the latest Hollywood, Nigerian & Luganda translated movies on FlixOn! 🔥🍿 Tap here to stream: ${effectiveLink}`;
  function handleCopyBio() {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(bioCaption);
      setCopiedBio(true);
      setTimeout(() => setCopiedBio(false), 2500);
    }
  }

  // Promotional Share Messages
  const lugandaShare = `🔥 Laba firimu empya zonna eza translated (VJ Junior, Jingo, Ice P) ne series ez'omulembe ku FlixOn! Nyiga wano otandikirewo: ${effectiveLink}`;
  const englishShare = `🔥 Watch all the latest movies, blockbuster series & Hollywood hits in Luganda translated on FlixOn! Click my link to start streaming: ${effectiveLink}`;
  const activeShareText = shareLanguage === 'luganda' ? lugandaShare : englishShare;

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(activeShareText)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(effectiveLink)}&text=${encodeURIComponent(shareLanguage === 'luganda' ? 'Laba firimu ez\'omulembe ku FlixOn!' : 'Watch the latest movies and series on FlixOn!')}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(effectiveLink)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(activeShareText)}`;

  // Live Watch Days preview using algorithmic bonus engine
  const amtNum = Number(convertAmount) || 0;
  const daysPreview = amtNum >= 1000 ? calculateBonusWatchDays(amtNum, activePlans) : 0;

  // Live Payout breakdown preview
  const payoutNum = Number(payoutAmount) || 0;
  const netPayoutAmount = payoutNum > 0 ? Math.max(0, payoutNum - withdrawalFee) : 0;

  // Convert submission
  async function handleConvertSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setLoadingConvert(true);
    setConvertMessage(null);
    const formData = new FormData();
    formData.append('amount', convertAmount);

    const res = await convertToWatchDays(formData);
    setLoadingConvert(false);
    setConfirmConvert(false);
    if (res?.success) {
      setConvertMessage({ type: 'success', text: res.message });
      setConvertAmount('');
    } else {
      setConvertMessage({ type: 'error', text: res?.error || 'Failed to convert' });
    }
  }

  // Payout submission
  async function handlePayoutSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    setLoadingPayout(true);
    setPayoutMessage(null);
    const formData = new FormData();
    formData.append('amount', payoutAmount);
    formData.append('phone', payoutPhone);
    if (payoutName) {
      formData.append('account_name', payoutName);
    }
    formData.append('network', payoutNetwork);

    const res = await requestPayout(formData);
    setLoadingPayout(false);
    setConfirmPayout(false);
    if (res?.success) {
      setPayoutMessage({ type: 'success', text: res.message });
      setPayoutAmount('');
      setPayoutPhone('');
      setPayoutName('');
    } else {
      setPayoutMessage({ type: 'error', text: res?.error || 'Failed to request payout' });
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* Top Stats & Quick Action Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        
        {/* Available Balance Card with Direct Cashout Trigger */}
        <div style={{ background: 'var(--bg2)', padding: '22px 24px', borderRadius: '16px', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Available Balance
              </span>
              <span style={{ fontSize: '11px', color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: '700' }}>
                Ready to Cash Out
              </span>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#4ade80', lineHeight: '1.2' }}>
              {availableBalance.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: '600' }}>UGX</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
              Lifetime Earned: <strong style={{ color: '#fff' }}>{totalEarned.toLocaleString()} UGX</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              className="gms-btn gms-btn--primary"
              style={{
                flex: 1,
                padding: '10px 14px',
                fontSize: '13px',
                fontWeight: '800',
                background: availableBalance >= minPayout ? '#22c55e' : 'rgba(255,255,255,0.1)',
                borderColor: availableBalance >= minPayout ? '#22c55e' : 'transparent',
                cursor: availableBalance >= minPayout ? 'pointer' : 'default',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
              title={availableBalance >= minPayout ? 'Cash out to MTN or Airtel Mobile Money' : `Requires at least ${minPayout.toLocaleString()} UGX`}
            >
              💵 Cash Out (Withdraw)
            </button>
            {availableBalance >= 1000 && (
              <a
                href="#watch-days-card"
                className="gms-btn gms-btn--ghost"
                style={{ padding: '10px 14px', fontSize: '13px', borderColor: 'rgba(96,165,250,0.3)', color: '#60a5fa', whiteSpace: 'nowrap' }}
              >
                ⚡ Convert VIP
              </a>
            )}
          </div>
        </div>

        {/* Referred Signups Card */}
        <div style={{ background: 'var(--bg2)', padding: '22px 24px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Referred Signups
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', lineHeight: '1.2' }}>
              {totalSignups}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>
              Total Link Visitors: <strong style={{ color: '#38bdf8' }}>{totalClicks}</strong>
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '14px', background: 'rgba(255,255,255,0.02)', padding: '6px 10px', borderRadius: '8px' }}>
            💡 Tip: Share in movie WhatsApp groups to get instant signups!
          </div>
        </div>

        {/* Partner Level & Progress Card */}
        <div style={{ background: 'var(--bg2)', padding: '22px 24px', borderRadius: '16px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
          <div>
            <div style={{ color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              Partner Level
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24', margin: '2px 0 4px' }}>
              {tierName}
            </div>
            <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: '600', marginBottom: '10px' }}>
              ✨ Perk: {tierPerk}
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
              <div style={{ width: `${tierProgress}%`, background: '#fbbf24', height: '100%', borderRadius: '10px', transition: 'width 0.3s' }} />
            </div>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px' }}>
            {totalSignups >= 50 ? 'Maximum VIP status reached!' : `${totalSignups} of ${targetSignups} signups to ${nextTierName}`}
          </div>
        </div>
      </div>

      {/* PACKAGE EARNINGS BREAKDOWN: Clear table explaining exact money made on every plan */}
      <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid rgba(251,191,36,0.2)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px', color: '#fff' }}>
              💰 Package Earnings Breakdown
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)' }}>
              Here is exactly how much real cash you earn whenever someone you invite purchases a pass:
            </p>
          </div>
          <span style={{ fontSize: '11px', color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: '700' }}>
            Instant Automatic Credit
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {planRewards.map(rewardInfo => (
            <div
              key={rewardInfo.planId}
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: rewardInfo.isBoosted ? '1px solid #d97706' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxSizing: 'border-box'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{rewardInfo.planName}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{rewardInfo.price.toLocaleString()} UGX</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: '900', color: '#4ade80', margin: '6px 0 2px' }}>
                  +{rewardInfo.reward.toLocaleString()} <span style={{ fontSize: '13px', fontWeight: '600' }}>UGX</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24' }}>
                  {rewardInfo.percent}% Cash Commission
                </div>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '6px' }}>
                Friend gets {rewardInfo.durationDays} VIP day{rewardInfo.durationDays !== 1 ? 's' : ''}
                {rewardInfo.isBoosted && <span style={{ color: '#f59e0b', fontWeight: '700', display: 'block', marginTop: '2px' }}>🔥 {rewardInfo.multiplier}x Boost Active</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral Link & Social Sharing Kit */}
      <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '24px', marginBottom: '28px', border: '1px solid var(--border)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px', color: '#fff' }}>Your Unique Partner Link</h2>
            <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0 }}>
              Earn up to <strong>{maxReward.reward.toLocaleString()} UGX ({maxReward.percent}%)</strong> on every friend&apos;s VIP pass purchase, plus bonus cash on unique visitor clicks!
            </p>
          </div>
          <span style={{ fontSize: '12px', color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>
            Code: {affiliate?.referral_code}
          </span>
        </div>

        {/* Copy Box */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', width: '100%' }}>
          <input 
            type="text" 
            readOnly 
            value={effectiveLink} 
            style={{ 
              flex: '1 1 240px', 
              minWidth: '200px',
              padding: '12px 14px', 
              background: 'rgba(0,0,0,0.5)', 
              border: '1px solid var(--border)', 
              color: '#fff', 
              borderRadius: '10px', 
              fontSize: '14px',
              fontFamily: 'monospace',
              boxSizing: 'border-box'
            }}
          />
          <button
            onClick={handleCopy}
            className="gms-btn gms-btn--primary"
            style={{
              padding: '12px 24px',
              fontWeight: '700',
              fontSize: '14px',
              background: copied ? '#22c55e' : '#d97706',
              borderColor: copied ? '#22c55e' : '#d97706',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {copied ? '✅ Link Copied!' : '📋 Copy Link'}
          </button>
        </div>

        {/* Social Share Buttons with Language Switcher */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Instant Social Share:
            </span>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px' }}>
              <button
                type="button"
                onClick={() => setShareLanguage('luganda')}
                style={{
                  background: shareLanguage === 'luganda' ? '#d97706' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🇺🇬 Luganda Hook
              </button>
              <button
                type="button"
                onClick={() => setShareLanguage('english')}
                style={{
                  background: shareLanguage === 'english' ? '#d97706' : 'transparent',
                  color: '#fff',
                  border: 'none',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🇬🇧 English Hook
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#25D366', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
            >
              💬 WhatsApp
            </a>
            <a 
              href={telegramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#0088cc', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
            >
              ✈️ Telegram
            </a>
            <a 
              href={facebookUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#1877F2', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
            >
              📘 Facebook
            </a>
            <a 
              href={twitterUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', fontSize: '13px', fontWeight: '700', textDecoration: 'none' }}
            >
              𝕏 Post
            </a>
          </div>

          {/* TikTok & WhatsApp Status Caption Kit */}
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '14px', border: '1px dashed rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', boxSizing: 'border-box' }}>
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#fbbf24', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>
                🎵 TikTok Bio / Instagram / WhatsApp Status Copy:
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text2)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                &ldquo;{bioCaption}&rdquo;
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyBio}
              style={{
                background: copiedBio ? '#22c55e' : 'rgba(255,255,255,0.1)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {copiedBio ? '✅ Caption Copied!' : '📋 Copy Caption'}
            </button>
          </div>
        </div>
      </div>

      {/* Conversion and Payout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '36px' }}>
        
        {/* Mobile Money Cash Withdrawal Card (Overhauled with zero overflow and clear UX) */}
        <div style={{ background: 'rgba(74,222,128,0.04)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(74,222,128,0.25)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>💵</span>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#4ade80', margin: 0 }}>Mobile Money Payout</h2>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(74,222,128,0.15)', color: '#4ade80', padding: '2px 8px', borderRadius: '12px' }}>
              MTN / AIRTEL
            </span>
          </div>

          <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
            Withdraw cash straight to your phone. Minimum payout: <strong>{minPayout.toLocaleString()} UGX</strong>. Flat telecom transfer fee: <strong>{withdrawalFee.toLocaleString()} UGX</strong>.
          </p>

          {/* Pending Payout Banner */}
          {commissions.find(c => c.type === 'payout_pending') && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              background: 'rgba(251,191,36,0.1)',
              color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxSizing: 'border-box'
            }}>
              <span style={{ fontSize: '20px', flexShrink: 0 }}>⏳</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: '700' }}>
                  Pending Transfer: {Math.abs(Number(commissions.find(c => c.type === 'payout_pending').amount)).toLocaleString()} UGX
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px', wordBreak: 'break-word' }}>
                  {commissions.find(c => c.type === 'payout_pending').description}
                </div>
              </div>
            </div>
          )}

          {payoutMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              background: payoutMessage.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
              color: payoutMessage.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${payoutMessage.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
              boxSizing: 'border-box'
            }}>
              {payoutMessage.text}
            </div>
          )}

          {confirmPayout ? (
            /* Confirmation step */
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '16px', marginBottom: '14px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#fbbf24', marginBottom: '8px' }}>
                ⚠️ Confirm Cashout Request
              </div>
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#fff', lineHeight: '1.4' }}>
                Send <strong>{netPayoutAmount.toLocaleString()} UGX Net</strong> to <strong>{payoutPhone}</strong> ({payoutNetwork.toUpperCase()})?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setConfirmPayout(false)}
                  disabled={loadingPayout}
                  className="gms-btn gms-btn--ghost"
                  style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePayoutSubmit}
                  disabled={loadingPayout}
                  className="gms-btn gms-btn--primary"
                  style={{ flex: 1.4, padding: '10px', fontSize: '13px', background: '#22c55e', borderColor: '#22c55e', fontWeight: '800' }}
                >
                  {loadingPayout ? 'Submitting...' : 'Yes, Send Cash'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (payoutNum < minPayout) {
                alert(`Minimum withdrawal is ${minPayout.toLocaleString()} UGX`);
                return;
              }
              if (payoutNum > availableBalance) {
                alert(`Insufficient balance. You have ${availableBalance.toLocaleString()} UGX.`);
                return;
              }
              setConfirmPayout(true);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Network Toggle */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Telecom Network</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setPayoutNetwork('mtn')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: payoutNetwork === 'mtn' ? '2px solid #eab308' : '1px solid rgba(255,255,255,0.1)',
                      background: payoutNetwork === 'mtn' ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🟡 MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutNetwork('airtel')}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: payoutNetwork === 'airtel' ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
                      background: payoutNetwork === 'airtel' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)',
                      color: '#fff',
                      fontWeight: '700',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    🔴 Airtel Money
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text3)' }}>Amount to withdraw (UGX)</label>
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(String(availableBalance))}
                    style={{ background: 'none', border: 'none', color: '#4ade80', fontSize: '11px', fontWeight: '700', cursor: 'pointer', padding: 0 }}
                  >
                    Max ({availableBalance.toLocaleString()})
                  </button>
                </div>
                <input 
                  type="number" 
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder={`Min ${minPayout.toLocaleString()} UGX`}
                  required
                  min={minPayout}
                  max={availableBalance}
                  className="flx-form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Live Fee Breakdown */}
              {payoutNum >= minPayout && (
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '12px 14px', border: '1px solid rgba(74,222,128,0.2)', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text2)', marginBottom: '4px' }}>
                    <span>Gross Withdrawal:</span>
                    <span style={{ fontWeight: '600', color: '#fff' }}>{payoutNum.toLocaleString()} UGX</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#f87171', marginBottom: '6px' }}>
                    <span>Telecom Transfer Fee:</span>
                    <span>-{withdrawalFee.toLocaleString()} UGX</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '800', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
                    <span style={{ color: '#4ade80' }}>Net Cash Sent:</span>
                    <span style={{ color: '#4ade80' }}>{netPayoutAmount.toLocaleString()} UGX</span>
                  </div>
                </div>
              )}

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Mobile Money Phone Number</label>
                <input 
                  type="tel" 
                  value={payoutPhone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  placeholder={payoutNetwork === 'mtn' ? 'e.g. 077... or 078...' : 'e.g. 070... or 075...'}
                  required
                  className="flx-form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Optional Recipient Name */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Account Name (Optional)</label>
                <input 
                  type="text" 
                  value={payoutName}
                  onChange={e => setPayoutName(e.target.value)}
                  placeholder="e.g. John Mukasa"
                  className="flx-form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Upgraded Button: Zero spillage, clean wrap */}
              <button 
                type="submit" 
                className="gms-btn gms-btn--primary" 
                style={{
                  background: availableBalance >= minPayout ? '#22c55e' : 'rgba(255,255,255,0.1)',
                  borderColor: availableBalance >= minPayout ? '#22c55e' : 'transparent',
                  width: '100%',
                  padding: '13px',
                  fontWeight: '800',
                  fontSize: '14px',
                  whiteSpace: 'normal',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
                disabled={loadingPayout || availableBalance < minPayout}
              >
                {loadingPayout
                  ? 'Submitting Request...'
                  : (availableBalance < minPayout
                      ? `Min ${minPayout.toLocaleString()} UGX Needed`
                      : (netPayoutAmount > 0
                          ? `Request ${netPayoutAmount.toLocaleString()} UGX Net Cashout →`
                          : 'Review Cashout Details →'))}
              </button>
            </form>
          )}
        </div>

        {/* Supercharged Watch Time Conversion Card */}
        <div id="watch-days-card" style={{ background: 'rgba(59,130,246,0.04)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(59,130,246,0.25)', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>⚡</span>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa', margin: 0 }}>Convert to Watch Days</h2>
            </div>
            <span style={{ fontSize: '11px', fontWeight: '800', background: 'rgba(96,165,250,0.2)', color: '#60a5fa', padding: '2px 8px', borderRadius: '12px' }}>
              SUPERCHARGED BONUS
            </span>
          </div>

          <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
            Convert referral cash directly into unlimited movie streaming with huge multiplier bonuses:
          </p>

          {/* 3 High-Value Benchmark Deal Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '18px' }}>
            <button
              type="button"
              onClick={() => { setConvertAmount('1000'); setConfirmConvert(false); }}
              style={{
                background: convertAmount === '1000' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)',
                border: convertAmount === '1000' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '10px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>1,000 UGX</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#60a5fa', margin: '2px 0' }}>3 Days</div>
              <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: '700' }}>3× Value!</div>
            </button>

            <button
              type="button"
              onClick={() => { setConvertAmount('3000'); setConfirmConvert(false); }}
              style={{
                background: convertAmount === '3000' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)',
                border: convertAmount === '3000' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '10px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>3,000 UGX</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#60a5fa', margin: '2px 0' }}>21 Days</div>
              <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: '700' }}>+50% Bonus</div>
            </button>

            <button
              type="button"
              onClick={() => { setConvertAmount('8000'); setConfirmConvert(false); }}
              style={{
                background: convertAmount === '8000' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.04)',
                border: convertAmount === '8000' ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '10px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                boxSizing: 'border-box'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>8,000 UGX</div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#60a5fa', margin: '2px 0' }}>40 Days</div>
              <div style={{ fontSize: '10px', color: '#4ade80', fontWeight: '700' }}>+33% Bonus</div>
            </button>
          </div>

          {convertMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              background: convertMessage.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
              color: convertMessage.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${convertMessage.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`,
              boxSizing: 'border-box'
            }}>
              {convertMessage.text}
            </div>
          )}

          {confirmConvert ? (
            /* Confirmation */
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '16px', marginBottom: '14px', boxSizing: 'border-box' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#fbbf24', marginBottom: '8px' }}>
                ⚠️ Confirm Conversion
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#fff', lineHeight: '1.5' }}>
                Convert <strong>{amtNum.toLocaleString()} UGX</strong> to add <strong>+{daysPreview} VIP Watch Days</strong> to your account?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setConfirmConvert(false)}
                  disabled={loadingConvert}
                  className="gms-btn gms-btn--ghost"
                  style={{ flex: 1, padding: '10px', fontSize: '13px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConvertSubmit}
                  disabled={loadingConvert}
                  className="gms-btn gms-btn--primary"
                  style={{ flex: 1.3, padding: '10px', fontSize: '13px', background: '#2563eb', borderColor: '#2563eb', fontWeight: '800' }}
                >
                  {loadingConvert ? 'Converting...' : 'Yes, Confirm'}
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (amtNum < 1000) {
                  alert('Minimum conversion is 1,000 UGX (3 Days Pass)');
                  return;
                }
                if (amtNum > availableBalance) {
                  alert(`Insufficient balance. You have ${availableBalance.toLocaleString()} UGX.`);
                  return;
                }
                setConfirmConvert(true);
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Amount to convert (UGX)</label>
                <input 
                  type="number" 
                  value={convertAmount}
                  onChange={e => {
                    setConvertAmount(e.target.value);
                    setConfirmConvert(false);
                  }}
                  placeholder="e.g. 1000, 3000, 8000"
                  required
                  min={1000}
                  max={availableBalance}
                  className="flx-form-input"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
                {daysPreview > 0 && (
                  <div style={{ fontSize: '13px', color: '#60a5fa', marginTop: '8px', fontWeight: '700', background: 'rgba(96,165,250,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                    ✨ Super-Deal: <strong>+{daysPreview} VIP Watch Days</strong> granted instantly!
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="gms-btn gms-btn--primary" 
                style={{ background: '#3b82f6', width: '100%', padding: '13px', fontWeight: '700', boxSizing: 'border-box' }}
                disabled={availableBalance < 1000}
              >
                Review & Convert {amtNum > 0 ? `${amtNum.toLocaleString()} UGX` : ''} →
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Earnings Activity / Commissions Ledger */}
      <div style={{ background: 'var(--bg2)', borderRadius: '16px', border: '1px solid var(--border)', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Recent Activity & Commissions</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '540px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text3)' }}>
              <th style={{ padding: '14px 20px', fontWeight: '500' }}>Date</th>
              <th style={{ padding: '14px 20px', fontWeight: '500' }}>Type</th>
              <th style={{ padding: '14px 20px', fontWeight: '500' }}>Description</th>
              <th style={{ padding: '14px 20px', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '14px 20px', fontWeight: '500', textAlign: 'right' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {commissions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--text3)' }}>
                  No earnings or transactions recorded yet. Share your partner link to start earning!
                </td>
              </tr>
            ) : commissions.map(comm => {
              const amountNum = Number(comm.amount || 0);
              const isPositive = amountNum > 0;

              let badgeColor = '#4ade80';
              let badgeBg = 'rgba(74,222,128,0.1)';
              let typeLabel = 'Commission';

              let statusLabel = 'Credited';
              let statusColor = '#4ade80';
              let statusBg = 'rgba(74,222,128,0.15)';
              let statusBorder = 'rgba(74,222,128,0.35)';

              if (comm.type === 'click') {
                typeLabel = 'Link Visit';
                badgeColor = '#38bdf8';
                badgeBg = 'rgba(56,189,248,0.1)';
                statusLabel = 'Verified';
                statusColor = '#38bdf8';
                statusBg = 'rgba(56,189,248,0.12)';
                statusBorder = 'rgba(56,189,248,0.3)';
              } else if (comm.type === 'subscription') {
                typeLabel = 'Subscription';
                badgeColor = '#4ade80';
                badgeBg = 'rgba(74,222,128,0.1)';
                statusLabel = 'Credited';
                statusColor = '#4ade80';
                statusBg = 'rgba(74,222,128,0.15)';
                statusBorder = 'rgba(74,222,128,0.35)';
              } else if (comm.type === 'watch_days') {
                typeLabel = 'VIP Convert';
                badgeColor = '#60a5fa';
                badgeBg = 'rgba(96,165,250,0.1)';
                statusLabel = 'Converted';
                statusColor = '#60a5fa';
                statusBg = 'rgba(96,165,250,0.15)';
                statusBorder = 'rgba(96,165,250,0.35)';
              } else if (comm.type === 'payout_pending') {
                typeLabel = 'Cash Payout';
                badgeColor = '#fbbf24';
                badgeBg = 'rgba(251,191,36,0.1)';
                statusLabel = '⏳ Pending';
                statusColor = '#fbbf24';
                statusBg = 'rgba(251,191,36,0.12)';
                statusBorder = 'rgba(251,191,36,0.35)';
              } else if (comm.type === 'payout_completed') {
                typeLabel = 'Cash Payout';
                badgeColor = '#4ade80';
                badgeBg = 'rgba(74,222,128,0.1)';
                statusLabel = '✅ Sent';
                statusColor = '#4ade80';
                statusBg = 'rgba(74,222,128,0.15)';
                statusBorder = 'rgba(74,222,128,0.4)';
              } else if (comm.type === 'payout_rejected') {
                typeLabel = 'Cash Payout';
                badgeColor = '#f87171';
                badgeBg = 'rgba(239,68,68,0.1)';
                statusLabel = '❌ Rejected';
                statusColor = '#f87171';
                statusBg = 'rgba(239,68,68,0.12)';
                statusBorder = 'rgba(239,68,68,0.35)';
              }

              return (
                <tr key={comm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 20px', color: 'var(--text3)', whiteSpace: 'nowrap' }}>
                    {new Date(comm.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', color: badgeColor, background: badgeBg }}>
                      {typeLabel}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text2)', wordBreak: 'break-word' }}>
                    {comm.description || 'Affiliate Activity'}
                  </td>
                  <td style={{ padding: '14px 20px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: '700',
                      color: statusColor,
                      background: statusBg,
                      border: `1px solid ${statusBorder}`,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {statusLabel}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: isPositive ? '#4ade80' : '#f87171', whiteSpace: 'nowrap' }}>
                    {isPositive ? `+${amountNum.toLocaleString()}` : amountNum.toLocaleString()} UGX
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Floating Modal for Cashout */}
      <WithdrawCashModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        availableBalance={availableBalance}
        minPayout={minPayout}
        withdrawalFee={withdrawalFee}
      />
    </div>
  );
}
