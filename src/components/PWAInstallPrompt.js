'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // ─── Never show if already installed as a PWA ───
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    // ─── Never show inside the React Native WebView ───
    if (window.ReactNativeWebView || window.self !== window.top) return;

    // ─── Never show if user dismissed recently (7 day cooldown) ───
    try {
      const dismissed = localStorage.getItem('pwa-prompt-dismissed');
      if (dismissed) {
        const sevenDays = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - parseInt(dismissed, 10) < sevenDays) return;
      }
    } catch (_) {}

    // ─── Never show if user already installed via the native prompt ───
    try {
      const installed = localStorage.getItem('pwa-installed');
      if (installed) return;
    } catch (_) {}

    // ─── Detect iOS (Safari has no beforeinstallprompt) ───
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    setIsIOS(ios);

    if (ios && isSafari) {
      // Show iOS instructions after 4 seconds
      const timer = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(timer);
    }

    // ─── Chrome/Android: listen for the native install event ───
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show our beautiful prompt instead of the plain browser bar
      setTimeout(() => setShow(true), 1500);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      try { localStorage.setItem('pwa-installed', '1'); } catch (_) {}
      setShow(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
    // NOTE: No unconditional fallback timer — we only show when Chrome explicitly
    // tells us the app is installable via beforeinstallprompt.
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
      {/* Backdrop */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.55)',
          zIndex: 9998,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'pwaFadeIn 0.3s ease',
        }}
      />

      {/* Card */}
      <div style={{
        position: 'fixed',
        bottom: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 32px)',
        maxWidth: '420px',
        background: 'linear-gradient(135deg, #1c1c1c 0%, #141414 100%)',
        borderRadius: '20px',
        padding: '24px',
        zIndex: 9999,
        border: '1px solid rgba(229,9,20,0.25)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)',
        animation: 'pwaSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Close"
          style={{
            position: 'absolute', top: '14px', right: '14px',
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '50%',
            width: '30px', height: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#999',
            fontSize: '18px', lineHeight: 1,
          }}
        >×</button>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192x192.png" alt="FlixOn"
            width={48} height={48}
            style={{ borderRadius: '12px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>
              Install FlixOn
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', marginTop: '3px' }}>
              Add to Home Screen · Free
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {[
            { icon: '⚡', text: 'Faster loading, works offline' },
            { icon: '📱', text: 'Full-screen app — no browser chrome' },
            { icon: '🔔', text: 'Quick access from your home screen' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>
              <span>{icon}</span>{text}
            </div>
          ))}
        </div>

        {isIOS ? (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            Tap <strong style={{ color: '#fff' }}>Share</strong> <span>⬆</span> then <strong style={{ color: '#fff' }}>&quot;Add to Home Screen&quot;</strong>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            style={{
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #e50914, #ff2d2d)',
              color: '#fff', border: 'none', borderRadius: '12px',
              fontSize: '15px', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(229,9,20,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Install the App
          </button>
        )}

        <p
          onClick={handleDismiss}
          style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.28)', cursor: 'pointer' }}
        >
          Not now
        </p>
      </div>

      <style>{`
        @keyframes pwaFadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(40px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
