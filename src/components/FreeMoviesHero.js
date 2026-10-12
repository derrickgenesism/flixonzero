import Link from 'next/link';
import OfferCountdown from '@/components/OfferCountdown';

/**
 * FreeMoviesHero — compact offer card positioned down below the free movies.
 * Shows "Free to Watch" and "50% off", with concise copy and "See the Offer".
 */
export default function FreeMoviesHero({ offer, showUpsell = true }) {
  if (!showUpsell) return null;

  const percent = offer?.discountPercent ?? 50;

  return (
    <div style={{ maxWidth: '1100px', margin: '36px auto 20px', padding: '0 24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        padding: '12px 18px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, rgba(229, 9, 20, 0.14) 0%, rgba(20, 20, 20, 0.9) 60%)',
        border: '1px solid rgba(229, 9, 20, 0.3)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.35)'
      }}>
        {/* Left: badges + text */}
        <div style={{ flex: 1, minWidth: '220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(74, 222, 128, 0.15)',
              color: '#4ade80',
              border: '1px solid rgba(74, 222, 128, 0.35)',
              fontSize: '11px',
              fontWeight: '800',
              padding: '2px 8px',
              borderRadius: '5px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              Free to Watch
            </span>
            {percent > 0 && (
              <span style={{
                background: 'rgba(255, 211, 77, 0.15)',
                color: '#ffd34d',
                border: '1px solid rgba(255, 211, 77, 0.3)',
                fontSize: '11px',
                fontWeight: '800',
                padding: '2px 8px',
                borderRadius: '5px'
              }}>
                {percent}% OFF
              </span>
            )}
          </div>
          <div style={{ color: '#fff', fontSize: '13.5px', fontWeight: '600' }}>
            If you want more movies, get them at a cheap price.
          </div>
        </div>

        {/* Right side: timer + See the Offer button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {offer?.enabled && (
            <OfferCountdown durationMinutes={offer.durationMinutes} discountPercent={offer.discountPercent} variant="compact" />
          )}
          <Link
            href="/checkout"
            className="gms-btn gms-btn--primary"
            style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            See the Offer →
          </Link>
        </div>
      </div>
    </div>
  );
}
