'use client';

import { useEffect, useState } from 'react';

/**
 * OfferCountdown — a lightweight, self-contained "limited-time offer" countdown.
 *
 * - Runs 100% in the browser (no server calls, no database usage).
 * - Each visitor gets their own countdown, remembered in localStorage so it keeps
 *   counting down across pages/refreshes (checkout, movie pages, download prompt all
 *   share the same clock). When it reaches zero a fresh cycle starts automatically.
 * - Duration and discount % are controlled from Admin → System Settings.
 *
 * variant="banner"  → full-width card (used above the pricing plans)
 * variant="compact" → small inline pill (used on movie pages / download prompt)
 */

const STORAGE_KEY = 'flx_offer_end';

function readOrCreateEnd(durationMs) {
  const now = Date.now();
  let end = 0;
  try {
    end = parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
  } catch (_) {}

  // Start a new cycle if none exists, it expired, or admin shortened the duration.
  if (!end || end <= now || end - now > durationMs) {
    end = now + durationMs;
    try {
      localStorage.setItem(STORAGE_KEY, String(end));
    } catch (_) {}
  }
  return end;
}

const pad = (n) => String(n).padStart(2, '0');

export default function OfferCountdown({ durationMinutes = 60, discountPercent = 50, variant = 'banner' }) {
  const minutes = Math.min(Math.max(Number(durationMinutes) || 60, 1), 1440);
  const percent = Math.min(Math.max(Number(discountPercent) || 0, 0), 99);
  const durationMs = minutes * 60000;

  // null until mounted → avoids server/client hydration mismatch
  const [remaining, setRemaining] = useState(null);

  useEffect(() => {
    let end = readOrCreateEnd(durationMs);
    const tick = () => {
      let left = end - Date.now();
      if (left <= 0) {
        end = readOrCreateEnd(durationMs);
        left = end - Date.now();
      }
      setRemaining(left);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [durationMs]);

  const ready = remaining !== null;
  const totalSeconds = ready ? Math.max(0, Math.floor(remaining / 1000)) : 0;
  const h = ready ? pad(Math.floor(totalSeconds / 3600)) : '--';
  const m = ready ? pad(Math.floor((totalSeconds % 3600) / 60)) : '--';
  const s = ready ? pad(totalSeconds % 60) : '--';

  const headline = percent > 0 ? `${percent}% OFF` : 'Special Price';

  return (
    <>
      {variant === 'compact' ? (
        <div className="flx-offer-pill" role="timer" aria-label={`Offer ends in ${h} hours ${m} minutes ${s} seconds`}>
          <span className="flx-offer-dot" />
          <span className="flx-offer-pill-text">{headline} ends in</span>
          <span className="flx-offer-pill-time">{h}:{m}:{s}</span>
        </div>
      ) : (
        <div className="flx-offer-banner" role="timer" aria-label={`Offer ends in ${h} hours ${m} minutes ${s} seconds`}>
          <div className="flx-offer-left">
            <span className="flx-offer-dot" />
            <span className="flx-offer-badge">Flash Offer</span>
            <span className="flx-offer-text">
              {percent > 0 ? (
                <><strong>{percent}% OFF</strong> all subscription plans</>
              ) : (
                <>Special low prices available now</>
              )}
            </span>
          </div>

          <div className="flx-offer-right">
            <span className="flx-offer-ends-label">Ends in:</span>
            <div className="flx-offer-digits">
              <span className="flx-offer-digit-box">{h}</span>
              <span className="flx-offer-colon">:</span>
              <span className="flx-offer-digit-box">{m}</span>
              <span className="flx-offer-colon">:</span>
              <span className="flx-offer-digit-box">{s}</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes flxOfferPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }

        .flx-offer-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #ff3b3b; display: inline-block; flex-shrink: 0;
          box-shadow: 0 0 6px rgba(255,59,59,.9);
          animation: flxOfferPulse 1.4s ease-in-out infinite;
        }

        /* ── Compact Slim Banner ── */
        .flx-offer-banner {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          padding: 8px 14px; border-radius: 10px;
          background: linear-gradient(135deg, rgba(229,9,20,.18) 0%, rgba(20,20,20,.95) 70%);
          border: 1px solid rgba(229,9,20,.35);
          box-shadow: 0 4px 14px rgba(0,0,0,.3);
        }
        .flx-offer-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .flx-offer-badge {
          background: rgba(229,9,20,.2); border: 1px solid rgba(229,9,20,.5);
          color: #ff6b6b; font-size: 10.5px; font-weight: 800; padding: 2px 7px;
          border-radius: 4px; text-transform: uppercase; letter-spacing: .5px;
        }
        .flx-offer-text { font-size: 13.5px; color: #fff; font-weight: 600; }
        .flx-offer-text strong { color: #ffd34d; font-weight: 800; }
        .flx-offer-right { display: flex; align-items: center; gap: 6px; }
        .flx-offer-ends-label { font-size: 11px; color: var(--text3, #888); font-weight: 600; text-transform: uppercase; letter-spacing: .5px; }
        .flx-offer-digits { display: inline-flex; align-items: center; gap: 2px; }
        .flx-offer-digit-box {
          background: #000; border: 1px solid rgba(255,255,255,.15);
          color: #fff; font-size: 13px; font-weight: 800; padding: 2px 6px;
          border-radius: 4px; font-variant-numeric: tabular-nums;
        }
        .flx-offer-colon { color: rgba(255,255,255,.4); font-size: 12px; font-weight: 900; }

        /* ── Compact pill ── */
        .flx-offer-pill {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 5px 10px; border-radius: 999px;
          background: rgba(229,9,20,.14); border: 1px solid rgba(229,9,20,.35);
          font-size: 11.5px; font-weight: 700; color: #fff; white-space: nowrap;
        }
        .flx-offer-pill-text { color: #ffd34d; }
        .flx-offer-pill-time { font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: .5px; }

        @media (max-width: 560px) {
          .flx-offer-banner { padding: 8px 12px; justify-content: center; text-align: center; }
          .flx-offer-left { justify-content: center; }
          .flx-offer-right { justify-content: center; width: 100%; margin-top: 2px; }
        }
        @media (prefers-reduced-motion: reduce) { .flx-offer-dot { animation: none; } }
      `}</style>
    </>
  );
}
