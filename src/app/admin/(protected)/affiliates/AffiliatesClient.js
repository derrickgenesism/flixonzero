'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSettings, adjustBalance, approveAffiliate, rejectAffiliate, approveAllPending } from './actions'

export default function AffiliatesClient({ data }) {
  const { config, affiliates, plans = [] } = data
  const router = useRouter()
  const [affiliatesList, setAffiliatesList] = useState(affiliates || [])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [message, setMessage] = useState(null)

  async function handleApproveAll() {
    if (!confirm(`Are you sure you want to approve all ${pendingCount} pending partner applications?`)) return
    setLoading(true)
    setMessage(null)
    const res = await approveAllPending()
    setLoading(false)
    if (res?.success) {
      setAffiliatesList(prev => prev.map(a => a.status === 'pending' ? { ...a, status: 'approved' } : a))
      setMessage(`✅ Successfully approved ${res.count || pendingCount} pending partner applications!`)
      router.refresh()
    } else {
      alert(res?.error || 'Failed to approve all pending applications')
    }
  }

  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [commType, setCommType] = useState(config.affiliate_commission_type || 'percentage')

  const [planModes, setPlanModes] = useState(() => {
    const initial = {}
    plans.forEach(p => {
      initial[p.id] = config[`affiliate_plan_${p.id}_mode`] || (config.affiliate_commission_type === 'fixed' ? 'fixed' : 'percentage')
    })
    return initial
  })

  const [planRewards, setPlanRewards] = useState(() => {
    const initial = {}
    plans.forEach(p => {
      const mode = config[`affiliate_plan_${p.id}_mode`] || 'percentage'
      const fallbackVal = mode === 'percentage' ? (config.affiliate_commission_percentage || 35) : Math.round(Number(p.price) * 0.35)
      initial[p.id] = config[`affiliate_plan_${p.id}_reward`] || fallbackVal
    })
    return initial
  })

  async function handleSaveSettings(formData) {
    setLoading(true)
    setMessage(null)
    const res = await updateSettings(formData)
    setLoading(false)
    if (res?.success) {
      setMessage('✅ Affiliate & CPA settings saved successfully!')
    } else {
      setMessage(res?.error || 'Failed to save settings')
    }
  }

  async function handleAdjustSubmit(e) {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)
    const res = await adjustBalance(selectedUser.id, adjustAmount, adjustReason)
    setLoading(false)
    if (res?.success) {
      const delta = Number(adjustAmount)
      setAffiliatesList(prev => prev.map(a => {
        if (a.id === selectedUser.id) {
          const newBal = Number(a.balance || 0) + delta
          const newEarned = delta > 0 ? Number(a.total_earned || 0) + delta : Number(a.total_earned || 0)
          return { ...a, balance: newBal, total_earned: newEarned }
        }
        return a
      }))
      setShowModal(false)
      setAdjustAmount('')
      setAdjustReason('')
      setMessage(`✅ Balance updated for @${selectedUser.user_profiles?.username || selectedUser.referral_code}`)
      router.refresh()
    } else {
      alert(res?.error || 'Failed to adjust balance')
    }
  }

  async function handleApprove(aff) {
    setActionLoadingId(aff.id)
    setMessage(null)
    const res = await approveAffiliate(aff.id)
    setActionLoadingId(null)
    if (res?.success) {
      setAffiliatesList(prev => prev.map(a => a.id === aff.id ? { ...a, status: 'approved' } : a))
      setMessage(`✅ Approved affiliate @${aff.user_profiles?.username || aff.referral_code}! Welcome notification sent.`)
      router.refresh()
    } else {
      alert(res?.error || 'Failed to approve affiliate')
    }
  }

  async function handleReject(aff) {
    if (!confirm(`Are you sure you want to reject/suspend @${aff.user_profiles?.username || aff.referral_code}?`)) return
    setActionLoadingId(aff.id)
    setMessage(null)
    const res = await rejectAffiliate(aff.id)
    setActionLoadingId(null)
    if (res?.success) {
      setAffiliatesList(prev => prev.map(a => a.id === aff.id ? { ...a, status: 'rejected' } : a))
      setMessage(`Affiliate @${aff.user_profiles?.username || aff.referral_code} marked as rejected.`)
      router.refresh()
    } else {
      alert(res?.error || 'Failed to reject affiliate')
    }
  }

  const pendingCount = affiliatesList.filter(a => a.status === 'pending').length
  const approvedCount = affiliatesList.filter(a => a.status === 'approved' || (!a.status)).length
  const rejectedCount = affiliatesList.filter(a => a.status === 'rejected').length

  const filteredAffiliates = affiliatesList.filter(a => {
    if (activeFilter === 'pending') return a.status === 'pending'
    if (activeFilter === 'approved') return a.status === 'approved' || (!a.status)
    if (activeFilter === 'rejected') return a.status === 'rejected'
    return true
  })

  return (
    <div>
      <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '20px' }}>Affiliate & Referral Settings</h1>

      {message && (
        <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {/* Promotional Offers & Boosts Manager */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔥</span>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Promotional Offers & Boosts</h2>
          </div>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
            Activate temporary commission multiplier boosts (e.g. 2X Weekend Boost) to motivate affiliates to share heavily.
          </p>
          <form action={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input type="hidden" name="_section_boost" value="1" />
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" name="affiliate_boost_enabled" value="true" defaultChecked={config.affiliate_boost_enabled === 'true'} />
                <strong style={{ color: '#fbbf24' }}>Enable Multiplier Boost Campaign</strong>
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                Multiplier (e.g. 2.0 = Double Commission, 1.5 = 50% extra)
              </label>
              <input 
                type="number" 
                step="0.1"
                min="1.0"
                max="5.0"
                name="affiliate_boost_multiplier" 
                defaultValue={config.affiliate_boost_multiplier || '2.0'}
                className="flx-form-input" 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                Campaign Name / Headline
              </label>
              <input 
                type="text" 
                name="affiliate_boost_name" 
                defaultValue={config.affiliate_boost_name || 'Weekend 2X Cash Blitz'}
                placeholder="e.g. Weekend 2X Cash Blitz"
                className="flx-form-input" 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                Offer Expiration (Leave blank for indefinite)
              </label>
              <input 
                type="datetime-local" 
                name="affiliate_boost_ends_at" 
                defaultValue={config.affiliate_boost_ends_at ? config.affiliate_boost_ends_at.slice(0, 16) : ''}
                className="flx-form-input" 
              />
            </div>
            <button type="submit" className="gms-btn gms-btn--primary" disabled={loading} style={{ background: '#d97706', borderColor: '#d97706' }}>
              {loading ? 'Saving...' : 'Save Boost Campaign'}
            </button>
          </form>
        </div>

        {/* PPC Settings */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Pay-Per-Click (PPC) Settings</h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
            Rewards partners for sending unique human visitors to FlixOn through their link.
          </p>
          <form action={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="hidden" name="_section_ppc" value="1" />
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" name="affiliate_ppc_enabled" value="true" defaultChecked={config.affiliate_ppc_enabled === 'true'} />
                <strong style={{ color: '#fff' }}>Enable Pay-Per-Click Tracking</strong>
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
                CPM Rate (UGX per 1,000 unique human clicks)
              </label>
              <input 
                type="number" 
                name="affiliate_cpm_rate" 
                defaultValue={config.affiliate_cpm_rate || 5000}
                className="flx-form-input" 
              />
              <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Affiliates earn {(Number(config.affiliate_cpm_rate || 5000) / 1000).toFixed(2)} UGX per unique verified visit.
              </p>
            </div>
            <button type="submit" className="gms-btn gms-btn--primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save PPC Settings'}
            </button>
          </form>
        </div>

        {/* CPA Settings */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>💎</span>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Subscription (CPA) Commission Engine</h2>
          </div>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '16px', lineHeight: '1.5' }}>
            Configure how much affiliates earn when their referrals buy passes. Set global defaults or customize each plan individually with percentage (%) or fixed UGX amounts.
          </p>

          <form action={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <input type="hidden" name="_section_cpa" value="1" />
            
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" name="affiliate_cpa_enabled" value="true" defaultChecked={config.affiliate_cpa_enabled !== 'false'} />
                <strong style={{ color: '#fff' }}>Enable Subscription Commissions</strong>
              </label>
            </div>

            {/* Reward Scope: First-Order Bounty vs Every Purchase */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', fontWeight: '700' }}>
                Commission Payout Scope
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="affiliate_reward_scope"
                    value="first_purchase_only"
                    defaultChecked={config.affiliate_reward_scope !== 'all_purchases'}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <strong style={{ color: '#4ade80', fontSize: '13px' }}>First-Order Acquisition Bounty (Recommended — High 35%–40% Cut)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text3)' }}>
                      Affiliates earn once on the customer&apos;s initial purchase. Repeat renewals are 100% platform profit.
                    </p>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="affiliate_reward_scope"
                    value="all_purchases"
                    defaultChecked={config.affiliate_reward_scope === 'all_purchases'}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>Lifetime Recurring (Every Renewal & Re-subscription)</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text3)' }}>
                      Affiliates earn commission every time the user renews.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Per-Plan Customization Grid */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>
                  Active Subscription Plans & Payout Rates
                </label>
                <span style={{ fontSize: '11px', color: 'var(--text3)' }}>Toggle % or Fixed per plan</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {plans.length > 0 ? (
                  plans.map(p => {
                    const modeKey = `affiliate_plan_${p.id}_mode`
                    const rewardKey = `affiliate_plan_${p.id}_reward`
                    const currentMode = planModes[p.id] || 'percentage'
                    const rawVal = planRewards[p.id]
                    const currentNum = Number(rawVal) || (currentMode === 'percentage' ? 35 : Math.round(Number(p.price) * 0.35))
                    const payoutAmount = currentMode === 'percentage' ? Math.round(Number(p.price) * (currentNum / 100)) : currentNum
                    const platformKeeps = Math.max(0, Number(p.price) - payoutAmount)

                    return (
                      <div key={p.id} style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>
                            {p.name} ({Number(p.price).toLocaleString()} UGX)
                          </span>
                          <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: '600' }}>
                            Payout: +{payoutAmount.toLocaleString()} UGX (You keep: {platformKeeps.toLocaleString()} UGX)
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px' }}>
                          <select
                            name={modeKey}
                            value={currentMode}
                            onChange={(e) => setPlanModes(prev => ({ ...prev, [p.id]: e.target.value }))}
                            style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', fontSize: '12px' }}
                          >
                            <option value="percentage" style={{ color: '#000' }}>Percentage (%)</option>
                            <option value="fixed" style={{ color: '#000' }}>Fixed (UGX)</option>
                          </select>

                          <input
                            type="number"
                            name={rewardKey}
                            value={planRewards[p.id] !== undefined ? planRewards[p.id] : currentNum}
                            onChange={(e) => setPlanRewards(prev => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder={currentMode === 'percentage' ? 'e.g. 35' : 'e.g. 2800'}
                            className="flx-form-input"
                            style={{ padding: '8px 12px', fontSize: '13px' }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                      Default Commission Percentage (%)
                    </label>
                    <input type="number" name="affiliate_commission_percentage" defaultValue={config.affiliate_commission_percentage || 35} className="flx-form-input" />
                  </div>
                )}
              </div>
            </div>

            {/* Financial Controls: Threshold & Telecom Fee */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                  Minimum Cashout (UGX)
                </label>
                <input 
                  type="number" 
                  name="affiliate_min_payout" 
                  defaultValue={config.affiliate_min_payout || 5000} 
                  min="1000"
                  step="500"
                  className="flx-form-input" 
                />
                <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                  Min balance needed to withdraw (default 5,000).
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                  Telecom Transfer Fee (UGX)
                </label>
                <input 
                  type="number" 
                  name="affiliate_withdrawal_fee" 
                  defaultValue={config.affiliate_withdrawal_fee !== undefined ? config.affiliate_withdrawal_fee : 500} 
                  min="0"
                  step="100"
                  className="flx-form-input" 
                />
                <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                  Deducted on MoMo cashouts (e.g. 500 UGX).
                </p>
              </div>
            </div>

            <button type="submit" className="gms-btn gms-btn--primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save CPA Settings'}
            </button>
          </form>
        </div>
      </div>

      {/* Affiliates List */}
      <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', border: '1px solid var(--border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>Partner Accounts Management</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)' }}>Review applications, approve partners, and adjust balances</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {pendingCount > 0 && (
              <button
                onClick={handleApproveAll}
                disabled={loading}
                className="gms-btn gms-btn--primary"
                style={{ background: '#16a34a', borderColor: '#16a34a', padding: '6px 14px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                ✓ Approve All Pending ({pendingCount})
              </button>
            )}

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px' }}>
              <button
                onClick={() => setActiveFilter('all')}
                style={{
                  background: activeFilter === 'all' ? 'var(--acc)' : 'transparent',
                  color: activeFilter === 'all' ? '#000' : 'var(--text2)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                All ({affiliatesList.length})
              </button>
              <button
                onClick={() => setActiveFilter('pending')}
                style={{
                  background: activeFilter === 'pending' ? '#fbbf24' : 'transparent',
                  color: activeFilter === 'pending' ? '#000' : (pendingCount > 0 ? '#fbbf24' : 'var(--text2)'),
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setActiveFilter('approved')}
                style={{
                  background: activeFilter === 'approved' ? '#4ade80' : 'transparent',
                  color: activeFilter === 'approved' ? '#000' : 'var(--text2)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Approved ({approvedCount})
              </button>
              <button
                onClick={() => setActiveFilter('rejected')}
                style={{
                  background: activeFilter === 'rejected' ? '#f87171' : 'transparent',
                  color: activeFilter === 'rejected' ? '#000' : 'var(--text2)',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text3)' }}>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Partner User</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Date Submitted</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Tracking Code</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Balance</th>
              <th style={{ padding: '16px 20px', fontWeight: '500' }}>Total Earned</th>
              <th style={{ padding: '16px 20px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAffiliates.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text3)' }}>
                  No partners found for filter: <strong style={{ color: 'var(--text1)' }}>{activeFilter}</strong>
                </td>
              </tr>
            ) : filteredAffiliates.map(aff => {
              const isBusy = actionLoadingId === aff.id
              const isApproved = aff.status === 'approved' || !aff.status
              const isPending = aff.status === 'pending'
              const isRejected = aff.status === 'rejected'

              return (
                <tr key={aff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>@{aff.user_profiles?.username || 'User #' + aff.user_id}</div>
                    <div style={{ color: 'var(--text3)', fontSize: '12px' }}>{aff.user_profiles?.email || 'No email'}</div>
                  </td>
                  <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: '600', color: '#fff', fontSize: '13px' }}>
                      {aff.created_at ? new Date(aff.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                    <div style={{ color: 'var(--text3)', fontSize: '12px' }}>
                      {aff.created_at ? new Date(aff.created_at).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Kampala' }) + ' EAT' : ''}
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    {isApproved && (
                      <span style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Approved
                      </span>
                    )}
                    {isPending && (
                      <span style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Pending Approval
                      </span>
                    )}
                    {isRejected && (
                      <span style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        Rejected
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--acc)', fontWeight: '600' }}>
                    {aff.referral_code}
                  </td>
                  <td style={{ padding: '16px 24px', fontWeight: 'bold', color: '#4ade80' }}>
                    {Number(aff.balance || 0).toLocaleString()} UGX
                  </td>
                  <td style={{ padding: '16px 24px', color: 'var(--text2)' }}>
                    {Number(aff.total_earned || 0).toLocaleString()} UGX
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* Approve Button */}
                      {(isPending || isRejected) && (
                        <button 
                          onClick={() => handleApprove(aff)}
                          className="gms-btn" 
                          style={{ 
                            padding: '6px 14px', 
                            fontSize: '12px', 
                            background: '#22c55e', 
                            color: '#000', 
                            fontWeight: '700',
                            cursor: isBusy ? 'wait' : 'pointer'
                          }}
                          disabled={isBusy || loading}
                        >
                          {isBusy ? 'Processing...' : (isRejected ? 'Re-Approve' : 'Approve')}
                        </button>
                      )}

                      {/* Reject / Suspend Button */}
                      {(isPending || isApproved) && (
                        <button 
                          onClick={() => handleReject(aff)}
                          className="gms-btn" 
                          style={{ 
                            padding: '6px 12px', 
                            fontSize: '12px', 
                            background: isApproved ? 'rgba(248,113,113,0.15)' : 'rgba(248,113,113,0.2)', 
                            color: '#f87171',
                            cursor: isBusy ? 'wait' : 'pointer'
                          }}
                          disabled={isBusy || loading}
                        >
                          {isBusy ? '...' : (isApproved ? 'Suspend' : 'Reject')}
                        </button>
                      )}

                      {/* Adjust Balance Button */}
                      <button 
                        onClick={() => { setSelectedUser(aff); setShowModal(true); }}
                        className="gms-btn" 
                        style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.08)', color: 'var(--text2)' }}
                        disabled={isBusy || loading}
                      >
                        Adjust Balance
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Adjust Balance Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'var(--bg2)', width: '100%', maxWidth: '400px', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Adjust Balance for @{selectedUser?.user_profiles?.username || selectedUser?.referral_code}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text3)', margin: '0 0 16px' }}>
              Current balance: <strong style={{ color: '#4ade80' }}>{Number(selectedUser?.balance || 0).toLocaleString()} UGX</strong>
            </p>
            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
                  Amount Change (+ or - in UGX)
                </label>
                <input 
                  type="number" 
                  value={adjustAmount} 
                  onChange={e => setAdjustAmount(e.target.value)} 
                  placeholder="e.g. 1000 or -500" 
                  className="flx-form-input" 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
                  Reason (Admin Note)
                </label>
                <input 
                  type="text" 
                  value={adjustReason} 
                  onChange={e => setAdjustReason(e.target.value)} 
                  placeholder="e.g. Bonus for top referral performance" 
                  className="flx-form-input" 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" className="gms-btn gms-btn--primary" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'Saving...' : 'Apply Change'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="gms-btn" style={{ flex: 1, background: 'rgba(255,255,255,0.1)' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
