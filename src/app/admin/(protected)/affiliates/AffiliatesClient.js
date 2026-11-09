'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { updateSettings, adjustBalance, approveAffiliate, rejectAffiliate, approveAllPending } from './actions'

export default function AffiliatesClient({ data }) {
  const { config, affiliates, plans = [], overview = {} } = data
  const router = useRouter()
  const [affiliatesList, setAffiliatesList] = useState(affiliates || [])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [message, setMessage] = useState(null)

  // Modals state
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

  // Inspect partner modal
  const [inspectPartner, setInspectPartner] = useState(null)
  const [inspectTab, setInspectTab] = useState('referrals')
  const [copiedLink, setCopiedLink] = useState(false)

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

  function copyReferralLink(code) {
    const link = `https://flixon.net/?ref=${code}`
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(link)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: '0 0 6px' }}>Affiliate &amp; Partner Program</h1>
        <p style={{ color: 'var(--text3)', margin: 0, fontSize: '14px' }}>
          Real-time tracking of partner clicks, referred user signups, subscription conversions, and commissions.
        </p>
      </div>

      {message && (
        <div style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.2)', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', fontWeight: '500' }}>
          {message}
        </div>
      )}

      {/* Platform-Wide Affiliate Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--bg2)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px' }}>Total Partners</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#fff' }}>{overview.totalPartners || affiliatesList.length}</div>
          <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '4px' }}>{approvedCount} active</div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '700' }}>Unique Link Clicks</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#60a5fa' }}>{Number(overview.totalClicks || 0).toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Verified visitor visits</div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '700' }}>Referred Signups</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#fbbf24' }}>{Number(overview.totalSignups || 0).toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Registered accounts</div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '700' }}>Paid Subscribers</div>
          <div style={{ fontSize: '26px', fontWeight: '900', color: '#4ade80' }}>{Number(overview.totalPaidSubs || 0).toLocaleString()}</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Converted to active plan</div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '700' }}>Total Earned</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#a78bfa' }}>{Number(overview.totalEarnedAll || 0).toLocaleString()} UGX</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>All-time partner rewards</div>
        </div>

        <div style={{ background: 'var(--bg2)', padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '6px', fontWeight: '700' }}>Unpaid Balances</div>
          <div style={{ fontSize: '22px', fontWeight: '900', color: '#f87171' }}>{Number(overview.totalBalanceUnpaid || 0).toLocaleString()} UGX</div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>Pending cashout balance</div>
        </div>
      </div>

      {/* Partners List Table */}
      <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflowX: 'auto', border: '1px solid var(--border)', marginBottom: '40px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>Partner Accounts Management</h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)' }}>Inspect performance, view referred customers, adjust balances, and approve applications</p>
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
                  border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                All ({affiliatesList.length})
              </button>
              <button
                onClick={() => setActiveFilter('pending')}
                style={{
                  background: activeFilter === 'pending' ? '#fbbf24' : 'transparent',
                  color: activeFilter === 'pending' ? '#000' : (pendingCount > 0 ? '#fbbf24' : 'var(--text2)'),
                  border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Pending ({pendingCount})
              </button>
              <button
                onClick={() => setActiveFilter('approved')}
                style={{
                  background: activeFilter === 'approved' ? '#4ade80' : 'transparent',
                  color: activeFilter === 'approved' ? '#000' : 'var(--text2)',
                  border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Approved ({approvedCount})
              </button>
              <button
                onClick={() => setActiveFilter('rejected')}
                style={{
                  background: activeFilter === 'rejected' ? '#f87171' : 'transparent',
                  color: activeFilter === 'rejected' ? '#000' : 'var(--text2)',
                  border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Rejected ({rejectedCount})
              </button>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '850px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ padding: '14px 18px', fontWeight: '600' }}>Partner User</th>
              <th style={{ padding: '14px 18px', fontWeight: '600' }}>Status</th>
              <th style={{ padding: '14px 18px', fontWeight: '600' }}>Tracking Code</th>
              <th style={{ padding: '14px 18px', fontWeight: '600' }}>Clicks</th>
              <th style={{ padding: '14px 18px', fontWeight: '600' }}>Referrals</th>
              <th style={{ padding: '14px 18px', fontWeight: '600' }}>Balance</th>
              <th style={{ padding: '14px 18px', fontWeight: '600' }}>Total Earned</th>
              <th style={{ padding: '14px 18px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAffiliates.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--text3)' }}>
                  No partners found for filter: <strong style={{ color: 'var(--text1)' }}>{activeFilter}</strong>
                </td>
              </tr>
            ) : filteredAffiliates.map(aff => {
              const isBusy = actionLoadingId === aff.id
              const isApproved = aff.status === 'approved' || !aff.status
              const isPending = aff.status === 'pending'
              const isRejected = aff.status === 'rejected'

              return (
                <tr key={aff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>@{aff.user_profiles?.username || 'User #' + aff.user_id}</div>
                    <div style={{ color: 'var(--text3)', fontSize: '11px' }}>{aff.user_profiles?.email || 'No email'}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {isApproved && (
                      <span style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                        Approved
                      </span>
                    )}
                    {isPending && (
                      <span style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                        Pending
                      </span>
                    )}
                    {isRejected && (
                      <span style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                        Rejected
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <button
                      onClick={() => copyReferralLink(aff.referral_code)}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--acc)',
                        fontFamily: 'monospace',
                        fontWeight: '700',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                      title="Click to copy full referral link"
                    >
                      {aff.referral_code} 📋
                    </button>
                  </td>
                  <td style={{ padding: '14px 18px', color: '#60a5fa', fontWeight: '700' }}>
                    {Number(aff.clicksCount || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div>
                      <strong style={{ color: '#fff' }}>{aff.signupsCount || 0} signups</strong>
                      {(aff.activeSubsCount || 0) > 0 && (
                        <div style={{ fontSize: '11px', color: '#4ade80', fontWeight: '600' }}>
                          ⭐ {aff.activeSubsCount} subscribers
                        </div>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 'bold', color: '#4ade80' }}>
                    {Number(aff.balance || 0).toLocaleString()} UGX
                  </td>
                  <td style={{ padding: '14px 18px', color: 'var(--text2)' }}>
                    {Number(aff.total_earned || 0).toLocaleString()} UGX
                  </td>
                  <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* Inspect Referrals Modal Button */}
                      <button
                        onClick={() => { setInspectPartner(aff); setInspectTab('referrals'); }}
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          background: 'rgba(59,130,246,0.15)',
                          color: '#60a5fa',
                          border: '1px solid rgba(59,130,246,0.3)',
                          borderRadius: '5px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        🔍 Inspect
                      </button>

                      {/* Approve Button */}
                      {(isPending || isRejected) && (
                        <button 
                          onClick={() => handleApprove(aff)}
                          className="gms-btn" 
                          style={{ 
                            padding: '5px 10px', 
                            fontSize: '11px', 
                            background: '#22c55e', 
                            color: '#000', 
                            fontWeight: '700',
                            cursor: isBusy ? 'wait' : 'pointer'
                          }}
                          disabled={isBusy || loading}
                        >
                          {isBusy ? '...' : (isRejected ? 'Re-Approve' : 'Approve')}
                        </button>
                      )}

                      {/* Reject / Suspend Button */}
                      {(isPending || isApproved) && (
                        <button 
                          onClick={() => handleReject(aff)}
                          className="gms-btn" 
                          style={{ 
                            padding: '5px 8px', 
                            fontSize: '11px', 
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
                        style={{ padding: '5px 10px', fontSize: '11px', background: 'rgba(255,255,255,0.08)', color: 'var(--text2)' }}
                        disabled={isBusy || loading}
                      >
                        Balance
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        {/* Promotional Offers & Boosts Manager */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>🔥</span>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Promotional Offers &amp; Boosts</h2>
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

            {/* Reward Scope */}
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
                    <strong style={{ color: '#fff', fontSize: '13px' }}>Lifetime Recurring (Every Renewal &amp; Re-subscription)</strong>
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
                  Active Subscription Plans &amp; Payout Rates
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

            {/* Financial Controls */}
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
              </div>
            </div>

            <button type="submit" className="gms-btn gms-btn--primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save CPA Settings'}
            </button>
          </form>
        </div>
      </div>

      {/* Partner Inspection Modal */}
      {inspectPartner && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
        }}>
          <div style={{ background: 'var(--bg2)', width: '100%', maxWidth: '650px', maxHeight: '85vh', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px' }}>
                  Partner: @{inspectPartner.user_profiles?.username || inspectPartner.referral_code}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{inspectPartner.user_profiles?.email}</div>
              </div>
              <button onClick={() => setInspectPartner(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text3)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Quick Metrics Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: 'rgba(255,255,255,0.06)' }}>
              <div style={{ background: 'var(--bg2)', padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>Clicks</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#60a5fa' }}>{inspectPartner.clicksCount || 0}</div>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>Signups</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>{inspectPartner.signupsCount || 0}</div>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>Subscribers</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#4ade80' }}>{inspectPartner.activeSubsCount || 0}</div>
              </div>
              <div style={{ background: 'var(--bg2)', padding: '12px 16px' }}>
                <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase' }}>Balance</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#4ade80' }}>{Number(inspectPartner.balance || 0).toLocaleString()} UGX</div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', padding: '12px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={() => setInspectTab('referrals')}
                style={{
                  background: inspectTab === 'referrals' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: inspectTab === 'referrals' ? '#fff' : 'var(--text3)',
                  border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Referred Users ({inspectPartner.referredList?.length || 0})
              </button>
              <button
                onClick={() => setInspectTab('commissions')}
                style={{
                  background: inspectTab === 'commissions' ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: inspectTab === 'commissions' ? '#fff' : 'var(--text3)',
                  border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
                }}
              >
                Commissions Log ({inspectPartner.commissions?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '16px 24px', overflowY: 'auto', flex: 1 }}>
              {inspectTab === 'referrals' && (
                <div>
                  {(!inspectPartner.referredList || inspectPartner.referredList.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: '13px' }}>
                      No referred signups recorded for this partner yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {inspectPartner.referredList.map((refUser, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#fff', fontSize: '13px' }}>{refUser.email}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Joined: {new Date(refUser.joinedAt).toLocaleDateString()}</div>
                          </div>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: refUser.hasActiveSub ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.05)',
                            color: refUser.hasActiveSub ? '#4ade80' : 'var(--text3)'
                          }}>
                            {refUser.hasActiveSub ? '⭐ Active Plan' : 'Free / Expired'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'commissions' && (
                <div>
                  {(!inspectPartner.commissions || inspectPartner.commissions.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text3)', fontSize: '13px' }}>
                      No commission events logged yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {inspectPartner.commissions.map((comm, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <div>
                            <div style={{ fontWeight: '600', color: '#fff', fontSize: '13px' }}>{comm.description || comm.type}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{new Date(comm.created_at).toLocaleString()}</div>
                          </div>
                          <span style={{ fontWeight: '700', color: '#4ade80', fontSize: '13px' }}>
                            +{Number(comm.amount || 0).toLocaleString()} UGX
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => copyReferralLink(inspectPartner.referral_code)}
                style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
              >
                {copiedLink ? '✓ Copied Referral Link!' : '📋 Copy Referral Link'}
              </button>
              <button
                onClick={() => setInspectPartner(null)}
                style={{ background: 'transparent', color: 'var(--text3)', border: 'none', fontSize: '13px', cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
