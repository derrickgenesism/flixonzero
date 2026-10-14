import Link from 'next/link';
import { headers } from 'next/headers';
import { getClientIpFromHeaders } from '@/lib/ipShield';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Access Restricted — FlixOn',
  description: 'Access from this IP address has been restricted.',
};

export default async function IpBlockedPage() {
  const h = await headers();
  const clientIp = getClientIpFromHeaders(h);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0c',
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
          maxWidth: '520px',
          width: '100%',
          background: 'rgba(25, 15, 17, 0.9)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '16px',
          padding: '40px 32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(239, 68, 68, 0.2)',
          textAlign: 'center'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <img
            src="/logo.png"
            alt="FlixOn"
            style={{ height: '42px', width: 'auto', margin: '0 auto', display: 'block' }}
          />
        </div>

        <div
          style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '2px solid #ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            fontSize: '36px'
          }}
        >
          🚫
        </div>

        <h1
          style={{
            fontSize: '24px',
            fontWeight: '800',
            letterSpacing: '-0.5px',
            margin: '0 0 12px',
            color: '#ef4444'
          }}
        >
          Access Restricted
        </h1>

        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: '0 0 24px'
          }}
        >
          Access from your network or device has been blocked due to repeated violations of FlixOn terms of service, payment abuse, or suspicious automated traffic.
        </p>

        <div
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '14px',
            marginBottom: '28px',
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#f87171'
          }}
        >
          IP Identifier: {clientIp}
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: 'rgba(255, 255, 255, 0.5)' }}>
          If you believe this restriction is an error, contact administrative support at{' '}
          <a
            href="mailto:support@flixon.net"
            style={{ color: '#fff', textDecoration: 'underline' }}
          >
            support@flixon.net
          </a>
        </p>
      </div>
    </div>
  );
}
