'use client';

import Link from 'next/link';

export default function PaginatedSeriesGrid({ title, initialSeries, totalCount }) {
  if (!initialSeries || initialSeries.length === 0) {
    return (
      <div className="gms-section gms-visible">
        {title && <h2 className="gms-section-title">{title}</h2>}
        <div style={{ padding: '80px 20px', textAlign: 'center', color: 'var(--text2)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📺</div>
          <h2 style={{ fontSize: '22px', marginBottom: '12px', color: '#fff' }}>No series found</h2>
          <p style={{ fontSize: '15px', color: 'var(--text3)' }}>We couldn&apos;t find any TV series at the moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gms-section gms-visible">
      {title && (
        <div className="gms-section-head">
          <h2 className="gms-section-title">{title}</h2>
          <span className="gms-view-more">{totalCount} Results</span>
        </div>
      )}
      
      <div className="gms-movie-grid">
        {initialSeries.map((s) => (
          <div key={s.id} className="gms-card">
            <Link href={`/series/${s.id}`} className="gms-card-link">
              <div className="gms-card-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.thumbnail_url || 'https://via.placeholder.com/360x540/1a1a1a/444?text=No+Image'} alt={s.title} loading="lazy" />

                <div className="gms-card-overlay">
                  <div className="gms-card-play">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="11" fill="rgba(229,9,20,0.9)" />
                      <path d="M10 8L16 12L10 16V8Z" fill="white" />
                    </svg>
                  </div>
                </div>

                <div className="gms-card-badge gms-card-badge--series">
                  Series
                </div>
              </div>

              <div className="gms-card-info">
                <h3 className="gms-card-title">{s.title}</h3>
                {s.categories && s.categories.length > 0 && (
                  <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.categories[0]}
                  </p>
                )}
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
