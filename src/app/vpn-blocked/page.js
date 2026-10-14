import Link from 'next/link';
import { headers } from 'next/headers';
import { getClientIpFromHeaders, checkVpnOrProxy } from '@/lib/ipShield';
import VpnBlockedClient from './VpnBlockedClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'VPN / Proxy Detected — FlixOn',
  description: 'Please disconnect your VPN or proxy to continue using FlixOn.',
};

export default async function VpnBlockedPage({ searchParams }) {
  const h = await headers();
  const clientIp = getClientIpFromHeaders(h);
  const vpnInfo = await checkVpnOrProxy(clientIp);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 50% 20%, #1f0709 0%, #0d0d0f 70%, #050507 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
    >
      <div
        style={{
          maxWidth: '540px',
          width: '100%',
          background: 'rgba(20, 20, 25, 0.85)',
          border: '1px solid rgba(229, 9, 20, 0.35)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(229, 9, 20, 0.15)',
          backdropFilter: 'blur(16px)',
          textAlign: 'center'
        }}
      >
        {/* Brand Logo */}
        <div style={{ marginBottom: '24px' }}>
          <img
            src="/logo.png"
            alt="FlixOn"
            style={{ height: '42px', width: 'auto', margin: '0 auto', display: 'block' }}
          />
        </div>

        {/* Shield Icon */}
        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'rgba(229, 9, 20, 0.12)',
            border: '2px solid rgba(229, 9, 20, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '36px'
          }}
        >
          🛡️
        </div>

        <h1
          style={{
            fontSize: '24px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            margin: '0 0 10px',
            color: '#fff'
          }}
        >
          VPN or Proxy Detected
        </h1>

        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.75)',
            margin: '0 0 24px'
          }}
        >
          FlixOn requires a direct connection to stream video smoothly and process mobile money payments securely.
          Streaming and payments are not permitted over VPNs, web proxies, or data-center relays.
        </p>

        {/* Connection Diagnostics Card */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '28px',
            textAlign: 'left',
            fontSize: '13px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Detected IP Address:</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#ff6b6b' }}>
              {clientIp}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Network / ISP:</span>
            <span style={{ color: '#fff', fontWeight: '500' }}>
              {vpnInfo?.isp || 'Data Center / Hosting Provider'}
            </span>
          </div>
          {vpnInfo?.country && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Location Detected:</span>
              <span style={{ color: '#fff', fontWeight: '500' }}>
                {vpnInfo.city ? `${vpnInfo.city}, ` : ''}{vpnInfo.country}
              </span>
            </div>
          )}
        </div>

        {/* Client Interactive Buttons (Refresh / Check) */}
        <VpnBlockedClient returnUrl={searchParams?.from || '/'} />

        {/* Footer Support Notice */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'rgba(255, 255, 255, 0.45)' }}>
            Are you using normal MTN or Airtel mobile data and seeing this by mistake?{' '}
            <Link
              href="/support"
              style={{ color: '#e50914', textDecoration: 'none', fontWeight: '600' }}
            >
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
