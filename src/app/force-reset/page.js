import { forcePasswordReset } from './actions'

export default function ForceResetPage({ searchParams }) {
  const email = searchParams.email || '';

  return (
    <div className="gms-login-wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="gms-login-box" style={{ maxWidth: '400px', width: '100%', padding: '40px', background: 'var(--bg-card)', borderRadius: 'var(--r)' }}>
        <div className="gms-login-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px', color: '#fff', fontSize: '24px' }}>Welcome to the New Flixon!</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            We have upgraded our platform. For security reasons, please set a new password for your account: <br/>
            <strong style={{ color: '#fff' }}>{email}</strong>
          </p>
        </div>

        <form action={forcePasswordReset}>
          <input type="hidden" name="email" value={email} />
          
          <div className="gms-form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>New Password</label>
            <input 
              type="password" 
              name="password" 
              placeholder="Enter a new password" 
              required 
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>

          <button type="submit" className="gms-btn gms-btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
            Save & Log In
          </button>
        </form>
      </div>
    </div>
  )
}
