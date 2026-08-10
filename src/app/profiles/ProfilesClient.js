'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveProfile, createProfile, deleteProfile } from './actions';
import { processExtraProfileCharge, checkExtraProfileTransactionStatus } from './checkoutActions';

// Random avatar colors
const COLORS = ['#e50914', '#4ade80', '#fbbf24', '#60a5fa', '#a78bfa'];

export default function ProfilesClient({ initialProfiles, maxAllowed = 2, extraProfilePrice = 5000 }) {
  const router = useRouter();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [manageMode, setManageMode] = useState(false);
  const [addingProfile, setAddingProfile] = useState(false);
  
  // Payment states
  const [showPayment, setShowPayment] = useState(false);
  const [phone, setPhone] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [txRef, setTxRef] = useState(null);
  const [paymentInitiated, setPaymentInitiated] = useState(false);
  const [captchaUrl, setCaptchaUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Polling for payment status
  useEffect(() => {
    let intervalId;
    if (paymentInitiated && txRef) {
      intervalId = setInterval(async () => {
        try {
          const res = await checkExtraProfileTransactionStatus(txRef);
          if (res.status === 'successful') {
            clearInterval(intervalId);
            window.location.reload(); // Refresh to get the new maxAllowed limit
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      }, 4000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [paymentInitiated, txRef]);

  const handleSelect = async (profileId) => {
    if (manageMode) return;
    setLoading(true);
    await setActiveProfile(profileId);
    router.push('/');
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.target);
    const res = await createProfile(formData);
    
    if (res.error) {
      setError(res.error);
      setLoading(false);
    } else {
      window.location.reload(); 
    }
  };

  const handleDelete = async (profileId) => {
    if (!confirm('Are you sure you want to delete this profile? This cannot be undone.')) return;
    
    setLoading(true);
    const res = await deleteProfile(profileId);
    
    if (res.error) {
      alert(res.error);
      setLoading(false);
    } else {
      window.location.reload();
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setPaymentError("Please enter a valid mobile money number");
      return;
    }

    setPaymentLoading(true);
    setPaymentError('');
    setCaptchaUrl(null);
    setTxRef(null);

    const res = await processExtraProfileCharge(phone, network, extraProfilePrice);
    
    if (res?.error) {
      setPaymentError(res.error);
      setPaymentLoading(false);
      return;
    }

    if (res?.success) {
      if (res.tx_ref) setTxRef(res.tx_ref);
      if (res.redirect_url) {
        setCaptchaUrl(res.redirect_url);
      }
      setPaymentInitiated(true);
    }
    setPaymentLoading(false);
  };

  if (addingProfile) {
    return (
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '24px', color: '#fff' }}>Add Profile</h1>
        <p style={{ color: 'var(--text2)', marginBottom: '32px' }}>Add a profile for another person watching on this account.</p>
        
        <form onSubmit={handleAdd} style={{ maxWidth: '400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <input 
            type="text" 
            name="name" 
            placeholder="Name"
            autoFocus
            required
            maxLength={25}
            style={{ width: '100%', padding: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '8px', fontSize: '18px' }}
          />
          {error && <div style={{ color: '#ff6b6b' }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
            <button type="submit" disabled={loading} className="gms-btn gms-btn--primary" style={{ padding: '12px 32px' }}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button type="button" disabled={loading} onClick={() => setAddingProfile(false)} className="gms-btn gms-btn--ghost" style={{ padding: '12px 32px' }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div style={{ maxWidth: '400px', margin: '0 auto', background: 'var(--bg2)', padding: '32px', borderRadius: '16px', textAlign: 'left' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Unlock Profile Slot</h2>
        <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '24px' }}>
          Purchase a permanent extra profile slot for {extraProfilePrice} UGX.
        </p>

        {paymentInitiated ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div className="gms-spinner" style={{ margin: '0 auto 20px', borderTopColor: 'var(--acc)' }}></div>
            <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '10px' }}>Processing Payment...</p>
            <p style={{ color: 'var(--text3)', fontSize: '14px', marginBottom: '20px' }}>Please authorize the payment on your phone.</p>
            {captchaUrl && (
              <a href={captchaUrl} target="_blank" rel="noopener noreferrer" className="gms-btn gms-btn--primary">
                Click here to verify payment
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handlePaymentSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text2)', fontSize: '14px' }}>Mobile Money Number</label>
              <div style={{ display: 'flex' }}>
                <select 
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '4px 0 0 4px', borderRight: 'none' }}
                >
                  <option value="MTN">MTN</option>
                  <option value="AIRTEL">Airtel</option>
                </select>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="077..."
                  required
                  style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: '#fff', borderRadius: '0 4px 4px 0' }}
                />
              </div>
            </div>

            {paymentError && <div style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '20px' }}>{paymentError}</div>}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" disabled={paymentLoading} className="gms-btn gms-btn--primary" style={{ flex: 1 }}>
                {paymentLoading ? 'Processing...' : `Pay ${extraProfilePrice} UGX`}
              </button>
              <button type="button" onClick={() => setShowPayment(false)} disabled={paymentLoading} className="gms-btn gms-btn--ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '42px', fontWeight: '900', marginBottom: '48px', color: '#fff' }}>
        {manageMode ? 'Manage Profiles' : "Who's watching?"}
      </h1>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap', marginBottom: '48px' }}>
        {profiles.map((profile, idx) => (
          <div key={profile.id} style={{ position: 'relative' }}>
            <button 
              onClick={() => handleSelect(profile.id)}
              disabled={loading}
              style={{ 
                background: 'none', border: 'none', padding: 0, cursor: manageMode ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
                opacity: manageMode ? 0.5 : 1, transition: 'all 0.2s'
              }}
            >
              <div style={{ 
                width: '120px', height: '120px', borderRadius: '12px', 
                background: COLORS[idx % COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '48px', fontWeight: 'bold', color: '#fff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                border: '4px solid transparent',
              }}
              onMouseOver={(e) => { if(!manageMode && !loading) e.currentTarget.style.border = '4px solid #fff'; }}
              onMouseOut={(e) => e.currentTarget.style.border = '4px solid transparent'}
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ color: 'var(--text2)', fontSize: '18px', fontWeight: '500' }}>{profile.name}</span>
            </button>

            {manageMode && profiles.length > 1 && (
              <button 
                onClick={() => handleDelete(profile.id)}
                style={{ 
                  position: 'absolute', top: '-10px', right: '-10px', 
                  width: '32px', height: '32px', borderRadius: '50%', 
                  background: '#e50914', color: '#fff', border: 'none', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}
                title="Delete Profile"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {profiles.length < maxAllowed && (
          <button 
            onClick={() => setAddingProfile(true)}
            disabled={loading || manageMode}
            style={{ 
              background: 'none', border: 'none', padding: 0, cursor: (loading || manageMode) ? 'default' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
              opacity: manageMode ? 0 : 1, transition: 'all 0.2s', visibility: manageMode ? 'hidden' : 'visible'
            }}
          >
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '12px', 
              background: 'rgba(255,255,255,0.1)', border: '2px dashed rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '48px', fontWeight: '300', color: '#fff',
            }}>
              +
            </div>
            <span style={{ color: 'var(--text2)', fontSize: '18px', fontWeight: '500' }}>Add Profile</span>
          </button>
        )}

        {profiles.length >= maxAllowed && profiles.length < 5 && (
          <button 
            onClick={() => setShowPayment(true)}
            disabled={loading || manageMode}
            style={{ 
              background: 'none', border: 'none', padding: 0, cursor: (loading || manageMode) ? 'default' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px',
              opacity: manageMode ? 0 : 1, transition: 'all 0.2s', visibility: manageMode ? 'hidden' : 'visible'
            }}
          >
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '12px', 
              background: 'rgba(229, 9, 20, 0.1)', border: '2px dashed rgba(229, 9, 20, 0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px', fontWeight: '600', color: '#ff6b6b', textAlign: 'center', padding: '10px',
              flexDirection: 'column'
            }}>
              <span style={{ fontSize: '32px', marginBottom: '8px' }}>🔓</span>
              Buy Slot
            </div>
            <span style={{ color: 'var(--text2)', fontSize: '18px', fontWeight: '500' }}>Add Profile</span>
          </button>
        )}
      </div>

      <button 
        onClick={() => setManageMode(!manageMode)}
        disabled={loading}
        style={{ 
          background: 'transparent', border: '1px solid var(--text3)', 
          color: 'var(--text2)', padding: '10px 24px', fontSize: '16px', 
          cursor: 'pointer', letterSpacing: '2px', textTransform: 'uppercase' 
        }}
      >
        {manageMode ? 'Done' : 'Manage Profiles'}
      </button>
    </div>
  );
}
