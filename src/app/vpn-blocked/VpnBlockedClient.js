'use client';

import { useState } from 'react';

export default function VpnBlockedClient({ returnUrl = '/' }) {
  const [checking, setChecking] = useState(false);

  const handleRetry = () => {
    setChecking(true);
    // Reload destination or current page
    setTimeout(() => {
      window.location.href = returnUrl || '/';
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button
        onClick={handleRetry}
        disabled={checking}
        style={{
          width: '100%',
          padding: '14px 20px',
          background: '#e50914',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '15px',
          fontWeight: '700',
          cursor: checking ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          boxShadow: '0 4px 14px rgba(229, 9, 20, 0.4)',
          transition: 'all 0.2s ease',
          opacity: checking ? 0.7 : 1
        }}
      >
        {checking ? (
          <>
            <span
              style={{
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            Checking connection...
          </>
        ) : (
          <>🔄 I&apos;ve Disconnected My VPN — Try Again</>
        )}
      </button>

      <style jsx global>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
