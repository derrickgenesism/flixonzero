'use client'

import { useState } from 'react'
import { convertToWatchDays, requestPayout } from './actions'

export default function ReferralsClient({ 
  affiliate, 
  referralLink, 
  totalSignups = 0, 
  totalClicks = 0, 
  commissions = [] 
}) {
  const [copied, setCopied] = useState(false)
  const [convertAmount, setConvertAmount] = useState('')
  const [payoutAmount, setPayoutAmount] = useState('')
  const [payoutPhone, setPayoutPhone] = useState('')
  const [loadingConvert, setLoadingConvert] = useState(false)
  const [loadingPayout, setLoadingPayout] = useState(false)
  const [convertMessage, setConvertMessage] = useState(null)
  const [payoutMessage, setPayoutMessage] = useState(null)
  const [confirmConvert, setConfirmConvert] = useState(false)

  const availableBalance = Number(affiliate?.balance || 0)
  const totalEarned = Number(affiliate?.total_earned || 0)

  // Tier Calculation
  let tierName = '🥉 Bronze Partner'
  let nextTierName = '🥈 Silver Ambassador'
  let tierProgress = Math.min(100, Math.round((totalSignups / 5) * 100))
  let targetSignups = 5

  if (totalSignups >= 20) {
    tierName = '🥇 Gold VIP Influencer'
    nextTierName = 'Top Tier Reached'
    tierProgress = 100
    targetSignups = 20
  } else if (totalSignups >= 5) {
    tierName = '🥈 Silver Ambassador'
    nextTierName = '🥇 Gold VIP Influencer'
    tierProgress = Math.min(100, Math.round(((totalSignups - 5) / 15) * 100))
    targetSignups = 20
  }

  // Guarantee official domain https://flixon.net is always used for referral sharing
  const effectiveLink = (referralLink || (affiliate?.referral_code ? `https://flixon.net/?ref=${affiliate.referral_code}` : 'https://flixon.net'))
    .replace(/^https?:\/\/[^/]*vercel\.app/i, 'https://flixon.net')
    .replace(/^https?:\/\/your-domain\.com/i, 'https://flixon.net')

  // Copy referral link handler
  function handleCopy() {
    if (!effectiveLink) return
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(effectiveLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Pre-formatted share messages
  const shareText = encodeURIComponent(`Watch the latest movies, Hollywood & Luganda translated on FlixOn! Sign up with my link to start streaming: ${effectiveLink}`)
  const whatsappUrl = `https://api.whatsapp.com/send?text=${shareText}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(effectiveLink)}&text=${encodeURIComponent('Watch the latest movies and series on FlixOn!')}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(effectiveLink)}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`

  // Convert submission
  async function handleConvertSubmit(e) {
    if (e && e.preventDefault) e.preventDefault()
    setLoadingConvert(true)
    setConvertMessage(null)
    const formData = new FormData()
    formData.append('amount', convertAmount)

    const res = await convertToWatchDays(formData)
    setLoadingConvert(false)
    setConfirmConvert(false)
    if (res?.success) {
      setConvertMessage({ type: 'success', text: res.message })
      setConvertAmount('')
    } else {
      setConvertMessage({ type: 'error', text: res?.error || 'Failed to convert' })
    }
  }

  // Payout submission
  async function handlePayoutSubmit(e) {
    e.preventDefault()
    setLoadingPayout(true)
    setPayoutMessage(null)
    const formData = new FormData()
    formData.append('amount', payoutAmount)
    formData.append('phone', payoutPhone)

    const res = await requestPayout(formData)
    setLoadingPayout(false)
    if (res?.success) {
      setPayoutMessage({ type: 'success', text: res.message })
      setPayoutAmount('')
    } else {
      setPayoutMessage({ type: 'error', text: res?.error || 'Failed to request payout' })
    }
  }

  // Live days calculation strictly following platform subscription plans (Daily = 1,000 UGX/day; 2-Weeks = 5,000 UGX = 14 days; Monthly = 9,000 UGX = 30 days)
  const amtNum = Number(convertAmount) || 0
  let daysPreview = 0
  if (amtNum >= 9000) {
    const months = Math.floor(amtNum / 9000)
    const rem = amtNum % 9000
    daysPreview = months * 30 + Math.floor(rem / 1000)
  } else if (amtNum >= 5000) {
    const fortnights = Math.floor(amtNum / 5000)
    const rem = amtNum % 5000
    daysPreview = fortnights * 14 + Math.floor(rem / 1000)
  } else {
    daysPreview = Math.floor(amtNum / 1000)
  }

  return (
    <div>
      {/* Top Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text2)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Available Balance
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#4ade80' }}>
            {availableBalance.toLocaleString()} <span style={{ fontSize: '16px', fontWeight: '600' }}>UGX</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            Lifetime Earned: {totalEarned.toLocaleString()} UGX
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text2)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Referred Signups
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#fff' }}>
            {totalSignups}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            Unique Link Visitors: {totalClicks}
          </div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          <div style={{ color: 'var(--text2)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
            Partner Level
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--acc)', margin: '4px 0 10px' }}>
            {tierName}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
            <div style={{ width: `${tierProgress}%`, background: 'var(--acc)', height: '100%', borderRadius: '10px', transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '6px' }}>
            {totalSignups >= 20 ? 'Maximum VIP status unlocked!' : `${totalSignups} of ${targetSignups} signups to ${nextTierName}`}
          </div>
        </div>
      </div>

      {/* Referral Link & Social Sharing */}
      <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '28px', marginBottom: '32px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px', color: '#fff' }}>Your Unique Partner Link</h2>
            <p style={{ color: 'var(--text3)', fontSize: '13px', margin: 0 }}>
              Earn instant money on every unique visitor click, plus massive commissions when friends purchase subscriptions!
            </p>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--acc)', background: 'rgba(229,9,20,0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' }}>
            Code: {affiliate?.referral_code}
          </span>
        </div>

        {/* Copy Box */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <input 
            type="text" 
            readOnly 
            value={effectiveLink} 
            style={{ 
              flex: 1, 
              minWidth: '240px',
              padding: '14px 16px', 
              background: 'rgba(0,0,0,0.4)', 
              border: '1px solid var(--border)', 
              color: '#fff', 
              borderRadius: '10px', 
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={handleCopy}
            className="gms-btn gms-btn--primary"
            style={{
              padding: '14px 24px',
              fontWeight: '700',
              fontSize: '14px',
              background: copied ? '#22c55e' : 'var(--acc)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            {copied ? '✅ Link Copied!' : '📋 Copy Link'}
          </button>
        </div>

        {/* Social Share Buttons */}
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
            Share Instantly:
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a 
              href={whatsappUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#25D366',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              💬 WhatsApp
            </a>
            <a 
              href={telegramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#0088cc',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              ✈️ Telegram
            </a>
            <a 
              href={facebookUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#1877F2',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              📘 Facebook
            </a>
            <a 
              href={twitterUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                background: '#000',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                textDecoration: 'none'
              }}
            >
              𝕏 Post
            </a>
          </div>
        </div>
      </div>

      {/* Conversion and Payout Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {/* Convert to Watch Days */}
        <div style={{ background: 'rgba(59,130,246,0.04)', borderRadius: '16px', padding: '28px', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#60a5fa', margin: 0 }}>Convert to Watch Days</h2>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
            Enjoy unlimited movie streaming! Convert your balance into VIP access days matching our official plan pricing (Daily Pass: 1,000 UGX = 1 day, 2-Weeks: 5,000 UGX = 14 days, Monthly: 9,000 UGX = 30 days).
          </p>

          {convertMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              background: convertMessage.type === 'success' ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)',
              color: convertMessage.type === 'success' ? '#4ade80' : '#f87171',
              border: `1px solid ${convertMessage.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}>
              {convertMessage.text}
            </div>
          )}

          {confirmConvert ? (
            /* Step 2: Confirmation Warning */
            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: '10px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#fbbf24', marginBottom: '8px' }}>
                ⚠️ Confirm Conversion
              </div>
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#fff', lineHeight: '1.5' }}>
                Are you sure you want to convert <strong>{amtNum.toLocaleString()} UGX</strong> to add <strong>+{daysPreview} VIP Watch Days</strong> to your account? This action cannot be reversed.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
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
                  style={{ flex: 1.3, padding: '10px', fontSize: '13px', background: '#d97706', borderColor: '#d97706', fontWeight: '800' }}
                >
                  {loadingConvert ? 'Converting...' : 'Yes, Confirm'}
                </button>
              </div>
            </div>
          ) : (
            /* Step 1: Input Form */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (amtNum < 1000) {
                  alert('Minimum conversion is 1,000 UGX (1 Day Pass)');
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
                  placeholder="e.g. 1000, 3000, 5000"
                  required
                  min={1000}
                  max={availableBalance}
                  className="flx-form-input"
                  style={{ width: '100%' }}
                />
                {daysPreview > 0 && (
                  <div style={{ fontSize: '12px', color: '#60a5fa', marginTop: '6px', fontWeight: '600' }}>
                    ✨ Equivalent: <strong>+{daysPreview} VIP Watch Days</strong>
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className="gms-btn gms-btn--primary" 
                style={{ background: '#3b82f6', width: '100%', padding: '12px' }}
                disabled={availableBalance < 1000}
              >
                Review & Convert {amtNum > 0 ? `${amtNum.toLocaleString()} UGX` : ''} →
              </button>
            </form>
          )}
        </div>

        {/* Request Cash Payout */}
        <div style={{ background: 'rgba(74,222,128,0.04)', borderRadius: '16px', padding: '28px', border: '1px solid rgba(74,222,128,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '24px' }}>💵</span>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#4ade80', margin: 0 }}>Mobile Money Payout</h2>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.6' }}>
            Withdraw your earnings directly to your MTN or Airtel Mobile Money. Minimum cash withdrawal is 5,000 UGX.
          </p>

          {/* Pending Payout Banner */}
          {commissions.find(c => c.type === 'payout_pending') && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              background: 'rgba(251,191,36,0.1)',
              color: '#fbbf24',
              border: '1px solid rgba(251,191,36,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>⏳</span>
              <div>
                <div style={{ fontWeight: '700' }}>
                  Payout Request Pending: {Math.abs(Number(commissions.find(c => c.type === 'payout_pending').amount)).toLocaleString()} UGX
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                  {commissions.find(c => c.type === 'payout_pending').description} · Once sent by admin, status will show <strong>GREEN (Sent)</strong> below.
                </div>
              </div>
            </div>
          )}

          {/* Latest Sent Payout Banner */}
          {!commissions.find(c => c.type === 'payout_pending') && commissions.find(c => c.type === 'payout_completed') && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '16px',
              background: 'rgba(74,222,128,0.08)',
              color: '#4ade80',
              border: '1px solid rgba(74,222,128,0.25)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '20px' }}>✅</span>
              <div>
                <div style={{ fontWeight: '700' }}>
                  Latest Payout Sent: {Math.abs(Number(commissions.find(c => c.type === 'payout_completed').amount)).toLocaleString()} UGX
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '2px' }}>
                  {commissions.find(c => c.type === 'payout_completed').description} · Sent on {new Date(commissions.find(c => c.type === 'payout_completed').created_at).toLocaleDateString()}
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
              border: `1px solid ${payoutMessage.type === 'success' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`
            }}>
              {payoutMessage.text}
            </div>
          )}

          <form onSubmit={handlePayoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Amount to withdraw (UGX)</label>
              <input 
                type="number" 
                value={payoutAmount}
                onChange={e => setPayoutAmount(e.target.value)}
                placeholder="e.g. 10000"
                required
                min={5000}
                max={availableBalance}
                className="flx-form-input"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text3)', marginBottom: '6px' }}>Mobile Money Number</label>
              <input 
                type="text" 
                value={payoutPhone}
                onChange={e => setPayoutPhone(e.target.value)}
                placeholder="077... or 075..."
                required
                className="flx-form-input"
                style={{ width: '100%' }}
              />
            </div>

            <button 
              type="submit" 
              className="gms-btn gms-btn--primary" 
              style={{ background: '#22c55e', width: '100%', padding: '12px' }}
              disabled={loadingPayout || availableBalance < 5000}
            >
              {loadingPayout ? 'Submitting...' : 'Request Cash Withdrawal'}
            </button>
          </form>
        </div>
      </div>

      {/* Earnings Activity / Commissions Ledger */}
      <div style={{ background: 'var(--bg2)', borderRadius: '16px', border: '1px solid var(--border)', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Recent Activity & Commissions</h2>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
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
              const amountNum = Number(comm.amount || 0)
              const isPositive = amountNum > 0

              let badgeColor = '#4ade80'
              let badgeBg = 'rgba(74,222,128,0.1)'
              let typeLabel = 'Commission'

              let statusLabel = 'Credited'
              let statusColor = '#4ade80'
              let statusBg = 'rgba(74,222,128,0.15)'
              let statusBorder = 'rgba(74,222,128,0.35)'

              if (comm.type === 'click') {
                typeLabel = 'Link Visit'
                badgeColor = '#38bdf8'
                badgeBg = 'rgba(56,189,248,0.1)'
                statusLabel = 'Verified'
                statusColor = '#38bdf8'
                statusBg = 'rgba(56,189,248,0.12)'
                statusBorder = 'rgba(56,189,248,0.3)'
              } else if (comm.type === 'subscription') {
                typeLabel = 'Subscription'
                badgeColor = '#4ade80'
                badgeBg = 'rgba(74,222,128,0.1)'
                statusLabel = 'Credited'
                statusColor = '#4ade80'
                statusBg = 'rgba(74,222,128,0.15)'
                statusBorder = 'rgba(74,222,128,0.35)'
              } else if (comm.type === 'watch_days') {
                typeLabel = 'VIP Convert'
                badgeColor = '#60a5fa'
                badgeBg = 'rgba(96,165,250,0.1)'
                statusLabel = 'Converted'
                statusColor = '#60a5fa'
                statusBg = 'rgba(96,165,250,0.15)'
                statusBorder = 'rgba(96,165,250,0.35)'
              } else if (comm.type === 'payout_pending') {
                // When NOT SENT: Shows Pending
                typeLabel = 'Cash Payout'
                badgeColor = '#fbbf24'
                badgeBg = 'rgba(251,191,36,0.1)'
                statusLabel = '⏳ Pending'
                statusColor = '#fbbf24'
                statusBg = 'rgba(251,191,36,0.12)'
                statusBorder = 'rgba(251,191,36,0.35)'
              } else if (comm.type === 'payout_completed') {
                // When SENT: Shows Green
                typeLabel = 'Cash Payout'
                badgeColor = '#4ade80'
                badgeBg = 'rgba(74,222,128,0.1)'
                statusLabel = '✅ Sent'
                statusColor = '#4ade80'
                statusBg = 'rgba(74,222,128,0.15)'
                statusBorder = 'rgba(74,222,128,0.4)'
              } else if (comm.type === 'payout_rejected') {
                typeLabel = 'Cash Payout'
                badgeColor = '#f87171'
                badgeBg = 'rgba(239,68,68,0.1)'
                statusLabel = '❌ Rejected'
                statusColor = '#f87171'
                statusBg = 'rgba(239,68,68,0.12)'
                statusBorder = 'rgba(239,68,68,0.35)'
              } else if (comm.type?.startsWith('payout')) {
                typeLabel = 'Cash Payout'
                badgeColor = '#fbbf24'
                badgeBg = 'rgba(251,191,36,0.1)'
                statusLabel = 'Pending'
                statusColor = '#fbbf24'
                statusBg = 'rgba(251,191,36,0.12)'
                statusBorder = 'rgba(251,191,36,0.35)'
              }

              return (
                <tr key={comm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 20px', color: 'var(--text3)' }}>
                    {new Date(comm.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', color: badgeColor, background: badgeBg }}>
                      {typeLabel}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', color: 'var(--text2)' }}>
                    {comm.description || 'Affiliate Activity'}
                  </td>
                  <td style={{ padding: '14px 20px' }}>
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
                  <td style={{ padding: '14px 20px', textAlign: 'right', fontWeight: '700', color: isPositive ? '#4ade80' : '#f87171' }}>
                    {isPositive ? `+${amountNum.toLocaleString()}` : amountNum.toLocaleString()} UGX
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
