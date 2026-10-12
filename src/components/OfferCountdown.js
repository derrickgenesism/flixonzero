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
          <div className="flx-offer-info">
            <div className="flx-offer-tag">
              <span className="flx-offer-dot" />
              Flash Offer
            </div>
            <div className="flx-offer-title">
              {percent > 0 ? (
                <>
                  <strong>{percent}% OFF</strong> all subscription plans
                </>
              ) : (
                <>Special low prices on all plans</>
              )}
            </div>
            <div className="flx-offer-sub">Prices are very low right now — grab yours before the timer runs out.</div>
          </div>
          <div className="flx-offer-clock">
            {[['Hrs', h], ['Min', m], ['Sec', s]].map(([label, value], i) => (
              <div key={label} className="flx-offer-clock-group">
                {i > 0 && <span className="flx-offer-colon">:</span>}
                <div className="flx-offer-unit">
                  <div className="flx-offer-num">{value}</div>
                  <div className="flx-offer-label">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes flxOfferPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }

        .flx-offer-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #ff3b3b; display: inline-block; flex-shrink: 0;
          box-shadow: 0 0 8px rgba(255,59,59,.9);
          animation: flxOfferPulse 1.4s ease-in-out infinite;
        }

        /* ── Banner ── */
        .flx-offer-banner {
          display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
          padding: 14px 18px; border-radius: 16px;
          background: linear-gradient(135deg, rgba(229,9,20,.24) 0%, rgba(229,9,20,.08) 55%, rgba(255,255,255,.03) 100%);
          border: 1px solid rgba(229,9,20,.45);
          box-shadow: 0 0 28px rgba(229,9,20,.14);
        }
        .flx-offer-info { flex: 1; min-width: 200px; text-align: left; }
        .flx-offer-tag {
          display: inline-flex; align-items: center; gap: 7px; margin-bottom: 6px;
          font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #ff6b6b;
        }
        .flx-offer-title { font-size: 17px; font-weight: 700; color: #fff; line-height: 1.25; }
        .flx-offer-title strong { color: #ffd34d; font-weight: 900; }
        .flx-offer-sub { font-size: 12px; color: var(--text2, #a0a0a0); margin-top: 3px; line-height: 1.4; }
        .flx-offer-clock { display: flex; align-items: center; }
        .flx-offer-clock-group { display: flex; align-items: center; }
        .flx-offer-colon { color: rgba(255,255,255,.45); font-weight: 900; font-size: 20px; margin: 0 5px 14px; }
        .flx-offer-unit {
          min-width: 52px; padding: 7px 8px 5px; border-radius: 10px; text-align: center;
          background: rgba(0,0,0,.6); border: 1px solid rgba(255,255,255,.12);
        }
        .flx-offer-num { font-size: 22px; font-weight: 900; color: #fff; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: .5px; }
        .flx-offer-label { font-size: 9px; font-weight: 700; color: var(--text3, #686868); text-transform: uppercase; letter-spacing: .8px; margin-top: 3px; }

        /* ── Compact pill ── */
        .flx-offer-pill {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 12px; border-radius: 999px;
          background: rgba(229,9,20,.14); border: 1px solid rgba(229,9,20,.4);
          font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap;
        }
        .flx-offer-pill-text { color: #ffd34d; }
        .flx-offer-pill-time { font-variant-numeric: tabular-nums; font-weight: 900; letter-spacing: .5px; }

        @media (max-width: 560px) {
          .flx-offer-banner { padding: 12px 14px; justify-content: center; text-align: center; }
          .flx-offer-info { text-align: center; min-width: 100%; }
          .flx-offer-title { font-size: 16px; }
        }
        @media (prefers-reduced-motion: reduce) { .flx-offer-dot { animation: none; } }
      `}</style>
    </>
  );
}
