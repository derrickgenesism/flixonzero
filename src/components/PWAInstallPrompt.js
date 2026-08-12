'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    if (window.ReactNativeWebView || window.self !== window.top) return;

    try {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) return;
      if (localStorage.getItem('pwa-installed')) return;
    } catch (_) {}

    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    setIsIOS(ios);

    if (ios && isSafari) {
      const timer = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(timer);
    }

    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', () => {
      try { localStorage.setItem('pwa-installed', '1'); } catch (_) {}
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        try { localStorage.setItem('pwa-installed', '1'); } catch (_) {}
      }
    }
    setShow(false);
  };

  const handleDismiss = () => {
    try { localStorage.setItem('pwa-prompt-dismissed', String(Date.now())); } catch (_) {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: '360px',
          background: 'rgba(18,18,18,0.97)',
          borderRadius: '14px',
          padding: '14px 16px',
          zIndex: 9999,
          border: '1px solid rgba(229,9,20,0.35)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          animation: 'pwaSlideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* App icon */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192x192.png" alt="FlixOn"
          width={36} height={36}
          style={{ borderRadius: '8px', flexShrink: 0 }} />

        {/* Text + button */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Install FlixOn App
          </div>
          {isIOS ? (
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
              Tap <strong style={{ color: '#fff' }}>Share ⬆</strong> → <strong style={{ color: '#fff' }}>Add to Home Screen</strong>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              style={{
                marginTop: '6px',
                padding: '5px 14px',
                background: 'linear-gradient(135deg, #e50914, #ff2d2d)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(229,9,20,0.4)',
                whiteSpace: 'nowrap',
              }}
            >
              Install — Free
            </button>
          )}
        </div>

        {/* Close X */}
        <button
          onClick={handleDismiss}
          aria-label="Close"
          style={{
            flexShrink: 0,
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)',
            fontSize: '13px',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
        >
          ×
        </button>
      </div>

      <style>{`
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
