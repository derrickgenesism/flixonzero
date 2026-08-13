'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { cleanCategories } from '@/utils/categories';

export default function HeroSlider({ movies, appDownloadUrl }) {
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isApp, setIsApp] = useState(false);

  const slides = movies?.slice(0, 6) || [];

  const goTo = useCallback((index) => {
    setCurrent((index + slides.length) % slides.length);
  }, [slides.length]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (isPaused || slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsApp(!!window.isReactNativeApp || !!window.ReactNativeWebView);
    }
  }, []);

  if (!slides.length) return null;

  return (
    <div
      className="flx-hero"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {slides.map((movie, i) => {
        const bg = movie.thumbnail_url || 'https://via.placeholder.com/1920x1080/111/333?text=Flixon';
        const typeLabel = movie.type === 'genesis_free_movie'
          ? 'Free'
          : movie.type === 'gsm_series'
          ? 'Series'
          : 'Premium';
        const badgeClass = movie.type === 'genesis_free_movie'
          ? 'flx-hero__badge--free'
          : movie.type === 'gsm_series'
          ? 'flx-hero__badge--series'
          : 'flx-hero__badge--premium';
        const cats = cleanCategories(movie.categories).slice(0, 3);

        return (
          <div
            key={movie.id}
            className={`flx-hero__slide${i === current ? ' flx-hero__slide--active' : ''}`}
          >
            <div className="flx-hero__bg" style={{ backgroundImage: `url(${bg})` }} />
            <div className="flx-hero__gradient" />

            <div className="flx-hero__content">
              <div className="flx-hero__meta">
                <span className={`flx-hero__badge ${badgeClass}`}>{typeLabel}</span>
                {cats.map(cat => (
                  <span key={cat} className="flx-hero__cat">{cat}</span>
                ))}
              </div>

              <h1 className="flx-hero__title">{movie.title}</h1>

              <p className="flx-hero__desc">
                {movie.description || 'Watch premium movies and series exclusively on Flixon. Subscribe now for unlimited access.'}
              </p>

              <div className="flx-hero__actions">
                <Link href={`/movie/${movie.id}`} className="gms-btn gms-btn--primary">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5V19L19 12L8 5Z" />
                  </svg>
                  Play Now
                </Link>
                {isApp ? (
                  <Link href={`/movie/${movie.id}`} className="gms-btn gms-btn--ghost">
                    More Info
                  </Link>
                ) : (
                  <a href={appDownloadUrl || '#'} className="gms-btn gms-btn--ghost" target="_blank" rel="noopener noreferrer">
                    Download App
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            className="flx-hero__arrow flx-hero__arrow--left"
            onClick={() => goTo(current - 1)}
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            className="flx-hero__arrow flx-hero__arrow--right"
            onClick={() => goTo(current + 1)}
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Dot Indicators */}
      {slides.length > 1 && (
        <div className="flx-hero__dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`flx-hero__dot${i === current ? ' flx-hero__dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
