'use client';

import { useRef } from 'react';
import MovieCard from './MovieCard';

import Link from 'next/link';

export default function MovieRow({ title, movies, href }) {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    scrollRef.current.scrollTo({
      left: dir === 'left' ? scrollLeft - clientWidth + 80 : scrollLeft + clientWidth - 80,
      behavior: 'smooth'
    });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="gms-section">
      <div className="gms-section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="gms-section-title">{title}</h2>
        {href && (
          <Link href={href} style={{ color: 'var(--acc)', fontSize: '13px', fontWeight: '600', textDecoration: 'none' }}>
            View All &gt;
          </Link>
        )}
      </div>

      <div className="gms-scroll-wrap">
        <button className="gms-arrow gms-arrow--left" onClick={() => scroll('left')} aria-label="Scroll left">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        <div className="gms-scroll-row" ref={scrollRef}>
          {movies.map(movie => (
            <MovieCard key={movie.id} {...movie} />
          ))}
        </div>

        <button className="gms-arrow gms-arrow--right" onClick={() => scroll('right')} aria-label="Scroll right">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
