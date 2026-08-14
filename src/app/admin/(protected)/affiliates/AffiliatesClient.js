'use client'

import { useState } from 'react'
import { updateSettings, adjustBalance } from './actions'

export default function AffiliatesClient({ data }) {
  const { config, affiliates } = data
  const [loading, setLoading] = useState(false)
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
    if (res.success) setMessage('Settings saved successfully!')
    else setMessage(res.error || 'Failed to save settings')
  }

  async function handleAdjustSubmit(e) {
    e.preventDefault()
    if (!selectedUser) return
    setLoading(true)
    const res = await adjustBalance(selectedUser.id, adjustAmount, adjustReason)
    setLoading(false)
    if (res.success) {
      setShowModal(false)
      setAdjustAmount('')
      setAdjustReason('')
    } else {
      alert(res.error || 'Failed to adjust balance')
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Affiliate & Referral Settings</h1>

      {message && (
        <div style={{ background: 'rgba(0,255,0,0.1)', color: '#4ade80', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
          {message}
        </div>
      )}

      {/* Settings Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '40px' }}>
        {/* PPC Settings */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Pay-Per-Click (PPC) Settings</h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '20px' }}>
            Rewards users for bringing unique visitors to the site using their referral link.
          </p>
          <form action={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" name="affiliate_ppc_enabled" value="true" defaultChecked={config.affiliate_ppc_enabled === 'true'} />
                Enable PPC Tracking
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
                CPM Rate (UGX per 1000 unique clicks)
              </label>
              <input 
                type="number" 
                name="affiliate_cpm_rate" 
                defaultValue={config.affiliate_cpm_rate || 5000}
                className="flx-form-input" 
              />
              <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '4px' }}>
                Affiliates will instantly earn {(Number(config.affiliate_cpm_rate || 5000) / 1000).toFixed(2)} UGX per unique click.
              </p>
            </div>
            {/* hidden inputs to preserve other settings */}
            <input type="hidden" name="affiliate_cpa_enabled" value={config.affiliate_cpa_enabled || 'false'} />
            <input type="hidden" name="affiliate_plan_1_reward" value={config.affiliate_plan_1_reward || 0} />
            <input type="hidden" name="affiliate_plan_2_reward" value={config.affiliate_plan_2_reward || 0} />
            <button type="submit" className="gms-btn gms-btn--primary" disabled={loading}>
              Save PPC Settings
            </button>
          </form>
        </div>

        {/* CPA Settings */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Subscription (CPA) Settings</h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginBottom: '20px' }}>
            Rewards affiliates a fixed commission when their referred user purchases a specific plan.
          </p>
          <form action={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', cursor: 'pointer' }}>
                <input type="checkbox" name="affiliate_cpa_enabled" value="true" defaultChecked={config.affiliate_cpa_enabled === 'true'} />
                Enable CPA Commissions
              </label>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
                Reward for Plan 1 (Daily Pass) - UGX
              </label>
              <input 
                type="number" 
                name="affiliate_plan_1_reward" 
                defaultValue={config.affiliate_plan_1_reward || 200}
                className="flx-form-input" 
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
                Reward for Plan 2 (Monthly Pass) - UGX
              </label>
              <input 
                type="number" 
                name="affiliate_plan_2_reward" 
                defaultValue={config.affiliate_plan_2_reward || 3000}
                className="flx-form-input" 
              />
            </div>
            {/* hidden inputs to preserve other settings */}
            <input type="hidden" name="affiliate_ppc_enabled" value={config.affiliate_ppc_enabled || 'false'} />
            <input type="hidden" name="affiliate_cpm_rate" value={config.affiliate_cpm_rate || 5000} />
            <button type="submit" className="gms-btn gms-btn--primary" disabled={loading}>
              Save CPA Settings
            </button>
          </form>
        </div>
      </div>

      {/* Affiliates List */}
      <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold' }}>Active Affiliates</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', color: 'var(--text3)' }}>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>User</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Status</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Code</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Balance</th>
              <th style={{ padding: '16px 24px', fontWeight: '500' }}>Total Earned</th>
              <th style={{ padding: '16px 24px', fontWeight: '500', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text3)' }}>No affiliates found.</td>
              </tr>
            ) : affiliates.map(aff => (
              <tr key={aff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '16px 24px' }}>
                  <div style={{ fontWeight: '500' }}>{aff.user_profiles?.username}</div>
                  <div style={{ color: 'var(--text3)', fontSize: '12px' }}>{aff.user_profiles?.email}</div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  {aff.status === 'approved' && <span style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Approved</span>}
                  {aff.status === 'pending' && <span style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Pending</span>}
                  {aff.status === 'rejected' && <span style={{ color: '#f87171', background: 'rgba(248,113,113,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Rejected</span>}
                  {!aff.status && <span style={{ color: '#4ade80', background: 'rgba(74,222,128,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Approved (Legacy)</span>}
                </td>
                <td style={{ padding: '16px 24px', fontFamily: 'monospace', color: 'var(--acc)' }}>
                  {aff.referral_code}
                </td>
                <td style={{ padding: '16px 24px', fontWeight: 'bold', color: '#4ade80' }}>
                  {Number(aff.balance).toLocaleString()} UGX
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--text2)' }}>
                  {Number(aff.total_earned).toLocaleString()} UGX
                </td>
                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {aff.status === 'pending' && (
                      <>
                        <button 
                          onClick={async () => {
                            setLoading(true);
                            const { approveAffiliate } = await import('./actions');
                            await approveAffiliate(aff.id);
                            setLoading(false);
                          }}
                          className="gms-btn" 
                          style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}
                          disabled={loading}
                        >
                          Approve
                        </button>
                        <button 
                          onClick={async () => {
                            setLoading(true);
                            const { rejectAffiliate } = await import('./actions');
                            await rejectAffiliate(aff.id);
                            setLoading(false);
                          }}
                          className="gms-btn" 
                          style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(248,113,113,0.1)', color: '#f87171' }}
                          disabled={loading}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => { setSelectedUser(aff); setShowModal(true); }}
                      className="gms-btn" 
                      style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.1)' }}
                      disabled={loading}
                    >
                      Adjust Balance
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Adjust Balance Modal */}
      {showModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{ background: 'var(--bg2)', width: '400px', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
              Adjust Balance for {selectedUser?.user_profiles?.username}
            </h3>
            <form onSubmit={handleAdjustSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>
                  Amount Change (+ or -)
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
                  placeholder="e.g. Bonus for good performance" 
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
