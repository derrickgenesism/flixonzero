'use client';

import { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInStandaloneMode, setIsInStandaloneMode] = useState(false);

  useEffect(() => {
    // Don't show if already installed as standalone app
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (standalone) {
      setIsInStandaloneMode(true);
      return;
    }

    // Don't show if inside a WebView (React Native)
    if (window.ReactNativeWebView || window.self !== window.top) return;

    // Don't show if user dismissed within last 7 days
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - dismissedAt < sevenDays) return;
    }

    // Detect iOS (Safari doesn't support beforeinstallprompt)
    const ua = window.navigator.userAgent;
    const ios = /iphone|ipad|ipod/i.test(ua);
    setIsIOS(ios);

    if (ios) {
      // On iOS show the prompt after 3 seconds unconditionally
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }

    // For Chrome/Android: capture the native prompt event
    const handleInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    // Fallback: also show after 5 seconds even without the native prompt
    // (covers edge cases where Chrome doesn't fire the event but PWA is still installable)
    const fallbackTimer = setTimeout(() => {
      setShow(true);
    }, 5000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        return;
      }
    }
    // If no native prompt (iOS / fallback), the button opens instructions
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', String(Date.now()));
    setShow(false);
  };

  if (!show || isInStandaloneMode) return null;

  return (
    <>
      {/* Backdrop blur */}
      <div
        onClick={handleDismiss}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
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
        background: 'linear-gradient(135deg, #1a1a1a 0%, #141414 100%)',
        borderRadius: '20px',
        padding: '24px',
        zIndex: 9999,
        border: '1px solid rgba(229,9,20,0.3)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
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
            cursor: 'pointer', color: '#aaa',
            fontSize: '18px', lineHeight: 1,
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192x192.png" alt="FlixOn" width={48} height={48}
            style={{ borderRadius: '12px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', lineHeight: 1.2 }}>
              Install FlixOn
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginTop: '3px' }}>
              Add to Home Screen for the best experience
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {[
            { icon: '⚡', text: 'Faster loading — works offline' },
            { icon: '📱', text: 'Full-screen app experience' },
            { icon: '🔔', text: 'Instant access from your home screen' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
              <span style={{ fontSize: '16px' }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>

        {isIOS ? (
          // iOS instructions (no native install API)
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '14px', fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
            To install: tap <strong style={{ color: '#fff' }}>Share</strong> <span style={{ fontSize: '16px' }}>⬆</span> then <strong style={{ color: '#fff' }}>&quot;Add to Home Screen&quot;</strong>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #e50914, #ff2d2d)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(229,9,20,0.4)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(229,9,20,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(229,9,20,0.4)'; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Install the App — It&apos;s Free
          </button>
        )}

        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
          onClick={handleDismiss}>
          No thanks, I&apos;ll use the browser
        </p>
      </div>

      <style>{`
        @keyframes pwaFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pwaSlideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(40px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  );
}
