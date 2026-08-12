export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', flexDirection: 'column', gap: '16px' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#e50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'flx-spin 1s linear infinite' }}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      <style>{`
        @keyframes flx-spin { 
          100% { transform: rotate(360deg); } 
        }
      `}</style>
    </div>
  );
}
