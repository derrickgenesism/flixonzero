'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ConvertToWatchDaysButton({ availableBalance, ugxPerDay, convertibleDays }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (convertibleDays < 1) return null;

  async function convert() {
    setLoading(true);
    try {
      const res = await fetch('/api/referrals/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: convertibleDays })
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
        router.refresh();
      } else {
        alert(data.error || 'Conversion failed. Please try again.');
      }
    } catch {
      alert('Network error. Please try again.');
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div style={{ color: '#4ade80', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
        ✓ {convertibleDays} days added!
      </div>
    );
  }

  return (
    <button
      onClick={convert}
      disabled={loading}
      className="gms-btn gms-btn--primary"
      style={{ padding: '10px 18px', fontSize: '14px', background: '#d97706', borderColor: '#d97706' }}
    >
      {loading ? 'Converting...' : `Convert to ${convertibleDays} Watch Days`}
    </button>
  );
}
