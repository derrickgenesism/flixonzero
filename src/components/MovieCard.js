import Link from 'next/link';
import { firstCleanCategory } from '@/utils/categories';

export default function MovieCard({ id, title, type, thumbnail_url, categories }) {
  const thumb = thumbnail_url || 'https://via.placeholder.com/360x540/1a1a1a/444?text=No+Image';

  const typeLabel = type === 'genesis_free_movie' ? 'Free'
    : type === 'gsm_series' ? 'Series'
    : 'Premium';

  const badgeClass = type === 'genesis_free_movie' ? 'gms-card-badge--free'
    : type === 'gsm_series' ? 'gms-card-badge--series'
    : 'gms-card-badge--premium';

  const firstCat = firstCleanCategory(categories);

  return (
    <div className="gms-card">
      <Link href={`/movie/${id}`} className="gms-card-link">
        <div className="gms-card-thumb">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt={title} loading="lazy" />

          <div className="gms-card-overlay">
            <div className="gms-card-play">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="11" fill="rgba(229,9,20,0.9)" />
                <path d="M10 8L16 12L10 16V8Z" fill="white" />
              </svg>
            </div>
          </div>

          {type && (
            <div className={`gms-card-badge ${badgeClass}`}>
              {typeLabel}
            </div>
          )}
        </div>

        <div className="gms-card-info">
          <h3 className="gms-card-title">{title}</h3>
          {firstCat && (
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {firstCat}
            </p>
          )}
        </div>
      </Link>
    </div>
  );
}
