import { updatePassword } from './actions'

export default function UpdatePasswordPage({ searchParams }) {
  const message = searchParams.message || '';

  return (
    <div className="gms-login-wrap" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="gms-login-box" style={{ maxWidth: '400px', width: '100%', padding: '40px', background: 'var(--bg-card)', borderRadius: 'var(--r)' }}>
        <div className="gms-login-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 10px', color: '#fff', fontSize: '24px' }}>Set New Password</h1>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>
            Enter your new password below.
          </p>
        </div>

        {message && (
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '4px', marginBottom: '20px', color: '#fff' }}>
            {message}
          </div>
        )}

        <form action={updatePassword}>
          <div className="gms-form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#fff' }}>New Password</label>
            <input 
              type="password" 
              name="password" 
              placeholder="Enter new password" 
              required 
              style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '4px' }}
            />
          </div>

          <button type="submit" className="gms-btn gms-btn--primary" style={{ width: '100%', justifyContent: 'center' }}>
            Update Password
          </button>
        </form>
      </div>
    </div>
  )
}
