'use client'

import { useState } from 'react'
import { forcePasswordReset } from './actions'

export default function ForceResetPage({ searchParams }) {
  const email = searchParams.email || ''
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.target)
    const result = await forcePasswordReset(formData)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      // redirect happens server-side so this is a fallback
      window.location.href = '/'
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '40px', background: 'var(--bg-card, #1a1a1a)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px', color: '#fff', fontSize: '24px' }}>Welcome to the New Flixon!</h1>
          <p style={{ margin: 0, color: '#aaa', lineHeight: 1.6 }}>
            For your security, please set a new password for:<br/>
            <strong style={{ color: '#fff' }}>{email}</strong>
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(229,9,20,0.15)', border: '1px solid rgba(229,9,20,0.4)', color: '#ff6b6b', padding: '12px 16px', borderRadius: '6px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', color: '#4ade80' }}>
            ✅ Password updated! Logging you in...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="email" value={email} />
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px' }}>New Password</label>
              <input 
                type="password" 
                name="password" 
                placeholder="Enter a new password (min. 6 characters)" 
                required
                minLength={6}
                style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '6px', boxSizing: 'border-box', fontSize: '14px' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', background: loading ? '#555' : '#E50914', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Saving...' : 'Save & Log In'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
