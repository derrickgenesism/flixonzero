'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateSettings, adjustBalance, approveAffiliate, rejectAffiliate } from './actions'

export default function AffiliatesClient({ data }) {
  const { config, affiliates, plans = [] } = data
  const router = useRouter()
  const [affiliatesList, setAffiliatesList] = useState(affiliates || [])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(false)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [message, setMessage] = useState(null)

  // Adjust Balance Modal State
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjustReason, setAdjustReason] = useState('')

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
        {/* PPC Settings */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Pay-Per-Click (PPC) Settings</h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
            Rewards partners for sending unique human visitors to FlixOn through their link.
          </p>
          <form action={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                Affiliates will earn {(Number(config.affiliate_cpm_rate || 5000) / 1000).toFixed(2)} UGX per unique verified visit.
              </p>
            </div>
            <button type="submit" className="gms-btn gms-btn--primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save PPC Settings'}
            </button>
          </form>
        </div>

        {/* CPA Settings */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Subscription (CPA) Settings</h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}>
            Fixed commissions paid to partners when referred users purchase specific VIP passes.
          </p>
          <form action={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" name="affiliate_cpa_enabled" value="true" defaultChecked={config.affiliate_cpa_enabled === 'true'} />
                <strong style={{ color: '#fff' }}>Enable Subscription Commissions</strong>
              </label>
            </div>

            {plans.length > 0 ? (
              plans.map(p => {
                const planKey = `affiliate_plan_${p.id}_reward`
                const defaultVal = config[planKey] || (p.price >= 9000 ? 3000 : (p.price >= 5000 ? 1500 : 200))

                return (
                  <div key={p.id}>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                      Commission for <strong>{p.name}</strong> ({Number(p.price).toLocaleString()} UGX)
                    </label>
                    <input 
                      type="number" 
                      name={planKey}
                      defaultValue={defaultVal}
                      className="flx-form-input" 
                    />
                  </div>
                )
              })
            ) : (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                    Daily Pass Commission (UGX)
                  </label>
                  <input type="number" name="affiliate_plan_1_reward" defaultValue={config.affiliate_plan_1_reward || 200} className="flx-form-input" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '6px' }}>
                    Monthly Pass Commission (UGX)
                  </label>
                  <input type="number" name="affiliate_plan_3_reward" defaultValue={config.affiliate_plan_3_reward || config.affiliate_plan_2_reward || 3000} className="flx-form-input" />
                </div>
              </>
            )}

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

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text3)' }}>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Partner User</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Tracking Code</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Balance</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Total Earned</th>
              <th style={{ padding: '16px 24px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAffiliates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--text3)' }}>
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
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: '600', color: '#fff' }}>@{aff.user_profiles?.username || 'User #' + aff.user_id}</div>
                    <div style={{ color: 'var(--text3)', fontSize: '12px' }}>{aff.user_profiles?.email || 'No email'}</div>
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
