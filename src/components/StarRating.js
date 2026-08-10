'use client';

import { useState } from 'react';

export default function StarRating({ movieId, currentRating = 0, totalCount = 0 }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(currentRating);
  const [submitted, setSubmitted] = useState(!!currentRating);
  const [loading, setLoading] = useState(false);

  async function handleRate(star) {
    if (loading) return;
    setLoading(true);
    setSelected(star);
    try {
      await fetch('/api/v1/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movieId, rating: star })
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const display = hovered || selected;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRate(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            disabled={loading}
            style={{
              fontSize: '22px',
              cursor: 'pointer',
              color: star <= display ? '#fbbf24' : 'rgba(255,255,255,0.2)',
              transition: 'color 0.15s, transform 0.15s',
              transform: hovered === star ? 'scale(1.2)' : 'scale(1)',
              padding: '2px'
            }}
            aria-label={`Rate ${star} stars`}
          >
            ★
          </button>
        ))}
        <span style={{ fontSize: '13px', color: 'var(--text3)', marginLeft: '8px' }}>
          {totalCount > 0 ? `${currentRating} (${totalCount} ratings)` : 'Be the first to rate'}
        </span>
      </div>
      {submitted && (
        <p style={{ fontSize: '12px', color: '#4ade80', margin: 0 }}>
          ✓ Thanks for rating!
        </p>
      )}
    </div>
  );
}
