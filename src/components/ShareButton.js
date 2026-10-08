'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ShareButton({ title }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');
  
  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const whatsappText = encodeURIComponent(`\uD83C\uDFAC Watch "${title}" on Flixon!\n${url}`);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={copyLink}
        className="gms-btn gms-btn--ghost"
        style={{ padding: '10px 16px', fontSize: '13px' }}
      >
        {copied ? '\u2713 Copied!' : '\uD83D\uDD17 Share'}
      </button>
      <a
        href={`https://wa.me/?text=${whatsappText}`}
        target="_blank"
        rel="noopener noreferrer"
        className="gms-btn gms-btn--ghost"
        style={{ padding: '10px 16px', fontSize: '13px', color: '#25D366' }}
      >
        WhatsApp
      </a>
    </div>
  );
}
