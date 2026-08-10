'use client'

import { useState } from 'react'
import { adminLogin } from './actions'

export default function AdminLoginForm() {
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData) {
    setLoading(true)
    setError(null)
    
    const result = await adminLogin(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--bg2)',
      padding: '40px',
      borderRadius: '12px',
      width: '100%',
      maxWidth: '400px',
      border: '1px solid rgba(255,255,255,0.1)',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '10px', gap: '8px' }}>
        <img src="/logo.png" alt="FlixOn" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '3px', textTransform: 'uppercase', color: 'var(--acc)', opacity: 0.8 }}>ADMIN</span>
      </div>
      <p style={{ color: 'var(--text2)', textAlign: 'center', marginBottom: '30px' }}>
        Authorized personnel only.
      </p>
      
      {error && (
        <div style={{ 
          background: '#e87c03', 
          color: 'white', 
          padding: '10px 15px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          fontSize: '14px' 
        }}>
          {error}
        </div>
      )}

      <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <input
            type="email"
            name="email"
            placeholder="Admin Email"
            required
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: 'white',
              fontSize: '15px'
            }}
          />
        </div>
        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(0,0,0,0.2)',
              color: 'white',
              fontSize: '15px'
            }}
          />
        </div>
        
        <button 
          type="submit"
          disabled={loading}
          style={{
            background: 'var(--acc)',
            color: 'white',
            padding: '14px',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '10px',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? 'Authenticating...' : 'Secure Login'}
        </button>
      </form>
    </div>
  )
}
