'use client';

import { useTransition, useState } from 'react';
import { toggleFavorite } from '@/app/actions/favorites';

export default function FavoriteButton({ movieId, initialIsFavorite }) {
  const [isPending, startTransition] = useTransition();
  const [isFav, setIsFav] = useState(initialIsFavorite);

  const handleClick = () => {
    // Optimistic update
    setIsFav(!isFav);
    startTransition(async () => {
      const res = await toggleFavorite(movieId);
      if (res?.error) {
        // Revert on error
        setIsFav(isFav);
        alert(res.error);
      }
    });
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={isPending}
      className="gms-btn gms-btn--ghost"
      style={{ opacity: isPending ? 0.7 : 1, transition: 'all 0.2s', minWidth: '140px' }}
    >
      {isFav ? (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--acc)" stroke="var(--acc)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          In My List
        </>
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add to List
        </>
      )}
    </button>
  );
}
