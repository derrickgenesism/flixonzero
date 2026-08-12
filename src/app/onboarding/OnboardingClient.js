'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const GENRES = [
  'Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Thriller',
  'Romance', 'Science Fiction', 'Animation', 'Family', 'Crime',
  'Mystery', 'Fantasy', 'History', 'Documentary',
  'VJ ICE P', 'VJ Emmy', 'VJ Junior', 'VJ Jingo', 'VJ Mark'
];

const STEPS = ['Welcome', 'Genres', 'Done'];

export default function OnboardingClient() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function toggleGenre(g) {
    setSelected(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  }

  async function finish() {
    setLoading(true);
    try {
      await fetch('/api/v1/me/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genres: selected })
      });
    } catch (e) {
      console.error(e);
    }
    router.push('/');
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      {/* Progress */}
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: i <= step ? 'var(--acc)' : 'var(--bg2)',
                border: `2px solid ${i <= step ? 'var(--acc)' : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700', color: i <= step ? '#fff' : 'var(--text3)',
                transition: 'all 0.3s ease'
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ width: '60px', height: '2px', background: i < step ? 'var(--acc)' : 'var(--border)', transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center', animation: 'fadeSlideDown 0.3s ease' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎬</div>
            <div style={{ marginBottom: '20px' }}>
              <img src="/logo.png" alt="FlixOn" style={{ height: '90px', width: 'auto', objectFit: 'contain' }} />
            </div>
            <h1 style={{ fontSize: '36px', fontWeight: '900', marginBottom: '16px', letterSpacing: '-1px' }}>
              Welcome to FlixOn!
            </h1>
            <p style={{ fontSize: '16px', color: 'var(--text2)', lineHeight: '1.7', marginBottom: '40px', maxWidth: '480px', margin: '0 auto 40px' }}>
              The best streaming experience in Uganda. Let&apos;s take 30 seconds to personalize your experience. We&apos;ll show you movies and series you&apos;ll actually love.
            </p>
            <button onClick={() => setStep(1)} className="gms-btn gms-btn--primary" style={{ padding: '16px 40px', fontSize: '16px' }}>
              Let&apos;s Get Started →
            </button>
            <p style={{ marginTop: '20px' }}>
              <button onClick={finish} style={{ color: 'var(--text3)', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}>
                Skip for now
              </button>
            </p>
          </div>
        )}

        {/* Step 1: Genre Preferences */}
        {step === 1 && (
          <div style={{ animation: 'fadeSlideDown 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>What do you love watching?</h2>
              <p style={{ color: 'var(--text2)', fontSize: '15px' }}>Select at least 3 genres to get personalized recommendations.</p>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '40px' }}>
              {GENRES.map(g => (
                <button
                  key={g}
                  onClick={() => toggleGenre(g)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '30px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: selected.includes(g) ? '2px solid var(--acc)' : '2px solid var(--border)',
                    background: selected.includes(g) ? 'rgba(229,9,20,0.15)' : 'var(--bg2)',
                    color: selected.includes(g) ? '#fff' : 'var(--text2)',
                    transform: selected.includes(g) ? 'scale(1.05)' : 'scale(1)'
                  }}
                >
                  {selected.includes(g) ? '✓ ' : ''}{g}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => setStep(0)} className="gms-btn gms-btn--ghost" style={{ padding: '14px 28px' }}>
                ← Back
              </button>
              <button
                onClick={() => selected.length >= 1 ? setStep(2) : null}
                className="gms-btn gms-btn--primary"
                style={{ padding: '14px 32px', opacity: selected.length < 1 ? 0.5 : 1 }}
              >
                Continue ({selected.length} selected)
              </button>
            </div>
          </div>
        )}

        {/* Step 2: All Done */}
        {step === 2 && (
          <div style={{ textAlign: 'center', animation: 'fadeSlideDown 0.3s ease' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🚀</div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', marginBottom: '16px' }}>You&apos;re all set!</h2>
            <p style={{ fontSize: '16px', color: 'var(--text2)', lineHeight: '1.7', marginBottom: '16px', maxWidth: '440px', margin: '0 auto 16px' }}>
              We&apos;ve personalized your FlixOn experience based on your preferences.
            </p>
            {selected.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '32px' }}>
                {selected.map(g => (
                  <span key={g} style={{ padding: '4px 12px', background: 'rgba(229,9,20,0.1)', border: '1px solid rgba(229,9,20,0.3)', borderRadius: '20px', fontSize: '13px', color: 'var(--acc)' }}>{g}</span>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={finish}
                disabled={loading}
                className="gms-btn gms-btn--primary"
                style={{ padding: '16px 40px', fontSize: '16px' }}
              >
                {loading ? 'Saving...' : '🎬 Start Watching!'}
              </button>
              <a href="/checkout" className="gms-btn gms-btn--ghost" style={{ padding: '16px 24px', fontSize: '15px' }}>
                View Plans
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
