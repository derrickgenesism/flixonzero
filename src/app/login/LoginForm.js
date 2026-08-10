'use client';

import { useState } from 'react';
import { login, signup, signInWithGoogle } from './actions';
import Link from 'next/link';

export default function LoginForm({ refCode }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData) {
    setLoading(true);
    setError(null);
    const result = await (isLogin ? login : signup)(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flx-login-card">
      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        <img src="/logo.png" alt="FlixOn" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
      </div>

      <h1 style={{ margin: '0 0 6px', fontSize: '26px', fontWeight: '800' }}>
        {isLogin ? 'Welcome back' : 'Create account'}
      </h1>
      <p style={{ margin: '0 0 28px', color: 'var(--text2)', fontSize: '14px' }}>
        {isLogin ? 'Sign in to continue streaming' : 'Join FlixOn and start watching today'}
      </p>

      {error && (
        <div style={{
          background: 'rgba(229,9,20,0.1)',
          border: '1px solid rgba(229,9,20,0.3)',
          color: '#ff6b6b',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input
          type="email"
          name="email"
          placeholder="Email address"
          required
          className="flx-form-input"
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          className="flx-form-input"
        />
        {!isLogin && refCode && (
          <input type="hidden" name="refCode" value={refCode} />
        )}

        <button
          type="submit"
          disabled={loading}
          className="gms-btn gms-btn--primary"
          style={{ width: '100%', padding: '14px', fontSize: '15px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
        </button>

        {isLogin && (
          <div style={{ textAlign: 'center' }}>
            <Link href="/reset-password" style={{ color: 'var(--text3)', fontSize: '13px', transition: 'color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text2)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text3)'}
            >
              Forgot your password?
            </Link>
          </div>
        )}
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0', color: 'var(--text3)' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      {/* Google */}
      <form action={signInWithGoogle}>
        <button
          type="submit"
          style={{
            width: '100%',
            background: '#fff',
            color: '#111',
            padding: '13px 20px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontFamily: 'inherit',
            transition: 'opacity 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px' }} />
          Continue with Google
        </button>
      </form>

      {/* Toggle */}
      <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text3)', fontSize: '14px', margin: '24px 0 0' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          onClick={() => { setIsLogin(!isLogin); setError(null); }}
          style={{ color: '#fff', fontWeight: '600', fontSize: '14px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
        >
          {isLogin ? 'Sign up' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
