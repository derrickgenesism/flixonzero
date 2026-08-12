'use client'

import { useActionState, useEffect } from 'react'
import { migrateUser } from './actions'

export default function MigrateManuallyPage() {
  const [state, formAction, isPending] = useActionState(migrateUser, null)

  // Clear form if success
  useEffect(() => {
    if (state?.success) {
      document.getElementById('migrateForm')?.reset()
    }
  }, [state])

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px', fontSize: '28px', color: '#fff' }}>Migrate Users Manually</h1>
        <p style={{ color: 'var(--text2)', margin: 0, maxWidth: '600px' }}>
          Use this tool to manually migrate users from the old WordPress platform. 
          The system will create their account with a random password and preserve their remaining subscription days.
          <br /><br />
          <strong>Important:</strong> After you migrate them here, tell the user to use the <strong>Forgot Password / Reset Password</strong> feature on the login page to set their own password and access their account.
        </p>
      </div>

      <div style={{ background: 'var(--bg2)', padding: '30px', borderRadius: '12px', maxWidth: '500px' }}>
        {state?.error && (
          <div style={{ padding: '12px', background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', borderRadius: '6px', color: '#fff', marginBottom: '20px' }}>
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div style={{ padding: '12px', background: 'rgba(70, 180, 80, 0.1)', border: '1px solid #46b450', borderRadius: '6px', color: '#fff', marginBottom: '20px' }}>
            {state.message}
          </div>
        )}

        <form id="migrateForm" action={formAction}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: '500' }}>Username / Full Name *</label>
            <input 
              type="text" 
              name="username" 
              required
              placeholder="e.g. John Doe"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: '500' }}>Email Address *</label>
            <input 
              type="email" 
              name="email" 
              required
              placeholder="e.g. user@example.com"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
            />
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#fff', fontSize: '14px', fontWeight: '500' }}>Subscription Days Left</label>
            <input 
              type="number" 
              name="daysLeft" 
              min="0"
              defaultValue="0"
              placeholder="0"
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text3)', margin: '6px 0 0' }}>
              Leave at 0 if they don't have an active subscription.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            style={{ 
              width: '100%', 
              padding: '14px', 
              background: 'var(--acc)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '6px', 
              fontSize: '15px', 
              fontWeight: '600', 
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.7 : 1
            }}
          >
            {isPending ? 'Migrating User...' : 'Migrate User'}
          </button>
        </form>
      </div>
    </div>
  )
}
