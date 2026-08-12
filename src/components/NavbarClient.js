'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SearchInput from './SearchInput';
import NotificationBell from './NotificationBell';
import { logoutAndClearProfile } from '@/app/profiles/actions';

export default function NavbarClient({ user, activeProfile, isActive, daysLeft }) {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`flx-nav${scrolled ? ' flx-nav--scrolled' : ''}`}>
      {/* Left: Logo + Links */}
      <Link href="/" className="flx-nav__logo" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo.png" alt="FlixOn" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
      </Link>
      <div className="flx-nav__links">
        <Link href="/" className={`flx-nav__link${pathname === '/' ? ' flx-nav__link--active' : ''}`}>Home</Link>
        <Link href="/movies" className={`flx-nav__link${pathname === '/movies' ? ' flx-nav__link--active' : ''}`}>Movies</Link>
        <Link href="/my-list" className={`flx-nav__link${pathname === '/my-list' ? ' flx-nav__link--active' : ''}`}>My List</Link>
      </div>

      {/* Center: Search */}
      <div className="flx-nav__search">
        <SearchInput />
      </div>

      {/* Right: User area */}
      <div className="flx-nav__right">
        {user ? (
          <>
            <Link href="/profiles" style={{ cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }} title="Switch Profile">
              <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#e50914', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                {activeProfile ? activeProfile.name.charAt(0).toUpperCase() : '?'}
              </div>
            </Link>
            <form action={logoutAndClearProfile}>
              <button type="submit" className="gms-btn gms-btn--ghost" style={{ padding: '8px 14px', fontSize: '13px' }}>
                Sign Out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="gms-btn gms-btn--ghost" style={{ padding: '8px 16px', fontSize: '13px' }}>
              Sign In
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
