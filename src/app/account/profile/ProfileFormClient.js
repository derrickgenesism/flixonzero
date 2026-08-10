'use client';

import { useState } from 'react';
import { updateProfile } from './actions';
import { createClient } from '@/utils/supabase/client';

export default function ProfileFormClient({ user, profile }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Password fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdError, setPwdError] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData(e.target);
    const result = await updateProfile(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage('Profile updated successfully!');
    }
    setLoading(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdLoading(true);
    setPwdMessage('');
    setPwdError('');

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      setPwdLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters');
      setPwdLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPwdError(error.message);
    } else {
      setPwdMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
    setPwdLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Personal Details */}
      <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#fff' }}>Personal Details</h2>
        
        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px' }}>Email Address (Read-only)</label>
            <input 
              type="email" 
              defaultValue={user.email} 
              disabled 
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', color: 'var(--text3)', borderRadius: '8px', opacity: 0.7 }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px' }}>Username</label>
            <input 
              type="text" 
              name="username"
              defaultValue={profile?.username || ''} 
              placeholder="e.g. John Doe"
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
            />
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <button type="submit" disabled={loading} className="gms-btn gms-btn--primary">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {message && <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: '500' }}>{message}</div>}
          {error && <div style={{ color: '#ff6b6b', fontSize: '14px', fontWeight: '500' }}>{error}</div>}
        </form>
      </div>

      {/* Security */}
      <div style={{ background: 'var(--bg2)', borderRadius: '16px', padding: '32px', border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>Security</h2>
        <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '24px' }}>Update your password to keep your account secure.</p>

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px' }}>New Password</label>
            <input 
              type="password" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text2)', marginBottom: '8px' }}>Confirm New Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 16px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px' }}
            />
          </div>
          
          <div style={{ marginTop: '8px' }}>
            <button type="submit" disabled={pwdLoading || !newPassword} className="gms-btn gms-btn--ghost" style={{ background: 'rgba(255,255,255,0.05)' }}>
              {pwdLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>

          {pwdMessage && <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: '500' }}>{pwdMessage}</div>}
          {pwdError && <div style={{ color: '#ff6b6b', fontSize: '14px', fontWeight: '500' }}>{pwdError}</div>}
        </form>
      </div>

    </div>
  );
}
