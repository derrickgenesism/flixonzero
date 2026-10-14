'use client';

import { useState } from 'react';
import MovieRequestModal from './MovieRequestModal';

export default function RequestMovieTrigger({
  initialTitle = '',
  buttonText = 'Request this Title',
  className = 'gms-btn gms-btn--primary',
  style = {}
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={className}
        style={style}
      >
        {buttonText}
      </button>

      <MovieRequestModal
        isOpen={open}
        onClose={() => setOpen(false)}
        initialTitle={initialTitle}
      />
    </>
  );
}
