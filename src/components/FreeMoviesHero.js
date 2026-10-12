import Link from 'next/link';
import OfferCountdown from '@/components/OfferCountdown';

/**
 * FreeMoviesHero — header banner for the "Free to Watch" listing pages.
 * Server component (no JS cost); only the small countdown is a client component.
 *
 * Props:
 *  total       number   – how many free movies are available
 *  offer       object   – result of parseOfferSettings()
 *  showUpsell  boolean  – false for active subscribers (hides the subscribe CTA)
 *  titleTag    string   – 'h1' | 'h2' (avoid duplicate <h1> on pages that already have one)
 */
export default function FreeMoviesHero({ total = 0, offer, showUpsell = true, titleTag = 'h1' }) {
  const Title = titleTag;

  return (
    <section
      aria-label="Free movies"
      style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 clamp(16px, 4vw, 40px) 8px' }}
    >
      <div style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap',
        padding: 'clamp(18px, 3vw, 28px)', borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(34,197,94,0.20) 0%, rgba(20,20,20,0.95) 55%, rgba(229,9,20,0.16) 100%)',
        border: '1px solid rgba(74,222,128,0.28)',
        boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
      }}>
        {/* Left: heading */}
        <div style={{ flex: 1, minWidth: '240px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px',
            padding: '4px 12px', borderRadius: '999px',
            background: 'rgba(74,222,128,0.14)', border: '1px solid rgba(74,222,128,0.35)',
            fontSize: '11px', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', color: '#4ade80',
          }}>
            <span aria-hidden="true">🎁</span> Free to Watch
          </span>

          <Title style={{ margin: '0 0 8px', fontSize: 'clamp(24px, 4.5vw, 38px)', fontWeight: '900', letterSpacing: '-0.6px', lineHeight: 1.1, color: '#fff' }}>
            Free Movies
          </Title>

          <p style={{ margin: 0, maxWidth: '520px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text2)' }}>
            Press play on any of these — no payment needed.
            {showUpsell ? ' Want downloads and the full premium library too? Subscribe while prices are low.' : ''}
            {total > 0 && (
              <strong style={{ display: 'block', marginTop: '8px', fontSize: '12.5px', color: '#4ade80', fontWeight: '700' }}>
                {total} free {total === 1 ? 'movie' : 'movies'} available now
              </strong>
            )}
          </p>
        </div>

        {/* Right: offer + CTA (hidden for subscribers) */}
        {showUpsell && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
            {offer?.enabled && (
              <OfferCountdown durationMinutes={offer.durationMinutes} discountPercent={offer.discountPercent} variant="compact" />
            )}
            <Link
              href="/checkout"
              className="gms-btn gms-btn--primary"
              style={{ padding: '12px 26px', fontSize: '15px', fontWeight: '800', borderRadius: '12px' }}
            >
              Go Premium
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
