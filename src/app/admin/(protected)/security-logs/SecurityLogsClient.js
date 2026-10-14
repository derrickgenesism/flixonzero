'use client';

import { useState } from 'react';
import {
  toggleVpnShieldAction,
  blockIpServerAction,
  unblockIpServerAction,
  blockFingerprintServerAction,
  unblockFingerprintServerAction,
  testIpLookupAction
} from './actions';

export default function SecurityLogsClient({
  initialLogs = [],
  dbError,
  blockedIps = [],
  blockedFingerprints = [],
  vpnEnabled = false,
  vpnMode = 'all'
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [vpnShieldActive, setVpnShieldActive] = useState(vpnEnabled);
  const [vpnShieldMode, setVpnShieldMode] = useState(vpnMode);
  const [ipList, setIpList] = useState(blockedIps);
  const [fingerprintList, setFingerprintList] = useState(blockedFingerprints);

  // Form states
  const [newIp, setNewIp] = useState('');
  const [newIpReason, setNewIpReason] = useState('');
  const [newFp, setNewFp] = useState('');
  const [newFpReason, setNewFpReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);

  // Diagnostic states
  const [testIpInput, setTestIpInput] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Scanner states
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanScore, setScanScore] = useState(100);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return '#ef4444';
      case 'HIGH':
        return '#f97316';
      case 'MEDIUM':
        return '#eab308';
      default:
        return '#3b82f6';
    }
  };

  const handleToggleVpn = async (newVal, mode = vpnShieldMode) => {
    setActionLoading(true);
    setActionStatus(null);
    try {
      await toggleVpnShieldAction(newVal, mode);
      setVpnShieldActive(newVal);
      setVpnShieldMode(mode);
      setActionStatus({
        type: 'success',
        msg: `VPN Shield ${newVal ? 'ACTIVATED' : 'DISABLED'} (${mode === 'all' ? 'Whole Platform' : 'Checkout & Payments Only'})`
      });
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockIp = async (e) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    setActionLoading(true);
    setActionStatus(null);
    try {
      const res = await blockIpServerAction(newIp.trim(), newIpReason.trim());
      if (res.success) {
        setIpList((prev) => [
          {
            ip: newIp.trim(),
            reason: newIpReason.trim() || 'Manual block via Security Center',
            blocked_at: new Date().toISOString(),
            associated_accounts: res.bannedAccounts || []
          },
          ...prev.filter((item) => (typeof item === 'string' ? item !== newIp.trim() : item?.ip !== newIp.trim()))
        ]);
        setNewIp('');
        setNewIpReason('');
        setActionStatus({
          type: 'success',
          msg: `IP ${res.ip} has been blocked. ${res.bannedAccounts?.length ? `Auto-banned ${res.bannedAccounts.length} linked account(s).` : ''}`
        });
      } else {
        setActionStatus({ type: 'error', msg: res.error || 'Failed to block IP' });
      }
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockIp = async (ipToUnblock) => {
    if (!confirm(`Are you sure you want to unblock IP ${ipToUnblock}?`)) return;
    setActionLoading(true);
    setActionStatus(null);
    try {
      const res = await unblockIpServerAction(ipToUnblock);
      if (res.success) {
        setIpList((prev) => prev.filter((item) => (typeof item === 'string' ? item !== ipToUnblock : item?.ip !== ipToUnblock)));
        setActionStatus({ type: 'success', msg: `IP ${ipToUnblock} successfully unblocked.` });
      } else {
        setActionStatus({ type: 'error', msg: res.error });
      }
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBlockFingerprint = async (e) => {
    e.preventDefault();
    if (!newFp.trim()) return;
    setActionLoading(true);
    setActionStatus(null);
    try {
      const res = await blockFingerprintServerAction(newFp.trim(), newFpReason.trim());
      if (res.success) {
        setFingerprintList((prev) => Array.from(new Set([newFp.trim(), ...prev])));
        setNewFp('');
        setNewFpReason('');
        setActionStatus({
          type: 'success',
          msg: `Device fingerprint blocked. ${res.bannedAccounts?.length ? `Auto-banned ${res.bannedAccounts.length} user account(s).` : ''}`
        });
      } else {
        setActionStatus({ type: 'error', msg: res.error });
      }
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnblockFingerprint = async (fpToUnblock) => {
    if (!confirm(`Are you sure you want to unblock device fingerprint ${fpToUnblock}?`)) return;
    setActionLoading(true);
    try {
      const res = await unblockFingerprintServerAction(fpToUnblock);
      if (res.success) {
        setFingerprintList((prev) => prev.filter((item) => item !== fpToUnblock));
        setActionStatus({ type: 'success', msg: `Fingerprint unblocked.` });
      }
    } catch (err) {
      setActionStatus({ type: 'error', msg: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTestIpLookup = async (e) => {
    e.preventDefault();
    if (!testIpInput.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await testIpLookupAction(testIpInput.trim());
      if (res.success) {
        setTestResult(res.info);
      } else {
        alert(res.error || 'Lookup failed');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setTestLoading(false);
    }
  };

  const runScan = async () => {
    setIsScanning(true);
    setScanResults(null);
    setScanError(null);
    try {
      const res = await fetch('/api/admin/security-scan');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scan failed');
      setTimeout(() => {
        setScanResults(data.results);
        setScanScore(data.score);
        setIsScanning(false);
      }, 1000);
    } catch (err) {
      setScanError(err.message);
      setIsScanning(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: '26px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🛡️ Security Center & Threat Defense
          </h1>
          <p style={{ margin: 0, color: 'var(--text3)', fontSize: '14px' }}>
            Smart IP blocking, device fingerprint enforcement, and fail-open VPN shielding.
          </p>
        </div>
        <button
          onClick={runScan}
          disabled={isScanning}
          style={{
            background: isScanning ? 'var(--bg2)' : 'var(--acc)',
            color: '#fff',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: isScanning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isScanning ? '⏳ Scanning Platform...' : '🔍 Run Full System Scan'}
        </button>
      </div>

      {actionStatus && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '8px',
            marginBottom: '24px',
            background: actionStatus.type === 'success' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: `1px solid ${actionStatus.type === 'success' ? '#22c55e' : '#ef4444'}`,
            color: actionStatus.type === 'success' ? '#4ade80' : '#ff6b6b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span>{actionStatus.msg}</span>
          <button onClick={() => setActionStatus(null)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      {/* ── CARD 1: ACTIVE VPN & PROXY SHIELD ────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg2)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '28px',
          border: vpnShieldActive ? '1px solid rgba(74, 222, 128, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ fontSize: '20px' }}>🌐</span>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>VPN & Proxy Shield</h2>
              <span
                style={{
                  background: vpnShieldActive ? '#22c55e20' : '#ef444420',
                  color: vpnShieldActive ? '#4ade80' : '#ef4444',
                  border: `1px solid ${vpnShieldActive ? '#22c55e' : '#ef4444'}`,
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '800',
                  textTransform: 'uppercase'
                }}
              >
                {vpnShieldActive ? 'SHIELD ACTIVE' : 'SHIELD DISABLED'}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)', maxWidth: '650px', lineHeight: '1.5' }}>
              Restricts access from hosting data centers (AWS, DigitalOcean, Hetzner, Linode, M247) and commercial VPN nodes.
              Ugandan cellular networks (MTN & Airtel) and residential ISPs are automatically protected.
            </p>
          </div>

          {/* Toggle Switches */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {vpnShieldActive ? (
              <button
                onClick={() => handleToggleVpn(false)}
                disabled={actionLoading}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '700',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Turn Off VPN Shield
              </button>
            ) : (
              <button
                onClick={() => handleToggleVpn(true)}
                disabled={actionLoading}
                style={{
                  background: '#22c55e',
                  border: 'none',
                  color: '#000',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Turn ON VPN Shield
              </button>
            )}
          </div>
        </div>

        {/* Mode Selector */}
        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '600', color: '#fff', display: 'block', marginBottom: '2px' }}>
              Enforcement Scope:
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text3)' }}>
              Choose where VPN restrictions are enforced.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleToggleVpn(vpnShieldActive, 'all')}
              disabled={actionLoading}
              style={{
                background: vpnShieldMode === 'all' ? 'var(--acc)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: vpnShieldMode === 'all' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              🔒 Whole Platform (Site-wide)
            </button>
            <button
              onClick={() => handleToggleVpn(vpnShieldActive, 'checkout')}
              disabled={actionLoading}
              style={{
                background: vpnShieldMode === 'checkout' ? 'var(--acc)' : 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: vpnShieldMode === 'checkout' ? '700' : '500',
                cursor: 'pointer'
              }}
            >
              💳 Payments & Checkout Only
            </button>
          </div>
        </div>
      </div>

      {/* ── CARD 2 & 3: BLOCKED IPS & FINGERPRINTS ────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        
        {/* BLOCKED IPS */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⛔ Blocked IP Addresses ({ipList.length})
            </h2>
          </div>

          {/* Form to add IP */}
          <form onSubmit={handleBlockIp} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder="Enter IP address (e.g. 102.134.x.x)"
                style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
              />
              <button
                type="submit"
                disabled={actionLoading || !newIp.trim()}
                style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                Block IP
              </button>
            </div>
            <input
              type="text"
              value={newIpReason}
              onChange={(e) => setNewIpReason(e.target.value)}
              placeholder="Reason for blocking (e.g. repeat checkout attack, bot spam)"
              style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text2)', borderRadius: '6px', fontSize: '12px' }}
            />
          </form>

          {/* Table of Blocked IPs */}
          {ipList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text3)', fontSize: '13px' }}>
              No IP addresses are currently blocked.
            </div>
          ) : (
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {ipList.map((item, idx) => {
                const ipStr = typeof item === 'string' ? item : item?.ip;
                const reasonStr = typeof item === 'object' ? item?.reason : 'Manual block';
                const dateStr = typeof item === 'object' && item?.blocked_at ? new Date(item.blocked_at).toLocaleDateString() : '';
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 12px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      borderLeft: '3px solid #ef4444'
                    }}
                  >
                    <div>
                      <div style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '13px', color: '#ff6b6b' }}>
                        {ipStr}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                        {reasonStr} {dateStr ? `• ${dateStr}` : ''}
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblockIp(ipStr)}
                      disabled={actionLoading}
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'var(--text2)',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer'
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* BLOCKED DEVICE FINGERPRINTS */}
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              📱 Blocked Device Fingerprints ({fingerprintList.length})
            </h2>
          </div>

          {/* Form to add fingerprint */}
          <form onSubmit={handleBlockFingerprint} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newFp}
                onChange={(e) => setNewFp(e.target.value)}
                placeholder="Enter visitor UUID / device hash"
                style={{ flex: 1, padding: '10px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
              />
              <button
                type="submit"
                disabled={actionLoading || !newFp.trim()}
                style={{ background: '#f97316', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
              >
                Block Device
              </button>
            </div>
            <input
              type="text"
              value={newFpReason}
              onChange={(e) => setNewFpReason(e.target.value)}
              placeholder="Reason (auto-bans any account logging in on this device)"
              style={{ padding: '8px 12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text2)', borderRadius: '6px', fontSize: '12px' }}
            />
          </form>

          {/* Table of Blocked Fingerprints */}
          {fingerprintList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text3)', fontSize: '13px' }}>
              No device fingerprints are currently blocked.
            </div>
          ) : (
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {fingerprintList.map((fp, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 12px',
                    background: 'rgba(0,0,0,0.2)',
                    borderRadius: '6px',
                    marginBottom: '8px',
                    borderLeft: '3px solid #f97316'
                  }}
                >
                  <div style={{ minWidth: 0, paddingRight: '10px' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '12px', color: '#fb923c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {fp}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                      Auto-ban active on this device
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblockFingerprint(fp)}
                    disabled={actionLoading}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: 'var(--text2)',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      flexShrink: 0
                    }}
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── CARD 4: REAL-TIME IP & VPN DIAGNOSTIC INSPECTOR ────────────── */}
      <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', marginBottom: '28px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <h2 style={{ margin: '0 0 8px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🔍 Real-Time IP & VPN Diagnostic Inspector
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text3)' }}>
          Test any IP address in real-time to inspect ISP details, hosting datacenter flags, and whether FlixOn allows or blocks it.
        </p>

        <form onSubmit={handleTestIpLookup} style={{ display: 'flex', gap: '10px', maxWidth: '600px', marginBottom: '16px' }}>
          <input
            type="text"
            value={testIpInput}
            onChange={(e) => setTestIpInput(e.target.value)}
            placeholder="e.g. 41.210.144.1 (MTN) or 138.197.0.1 (DigitalOcean)"
            style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '13px' }}
          />
          <button
            type="submit"
            disabled={testLoading || !testIpInput.trim()}
            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}
          >
            {testLoading ? 'Inspecting...' : 'Inspect IP'}
          </button>
        </form>

        {testResult && (
          <div
            style={{
              background: 'rgba(0,0,0,0.35)',
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${testResult.isVpn ? '#ef4444' : '#22c55e'}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              fontSize: '13px'
            }}
          >
            <div>
              <span style={{ color: 'var(--text3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>ISP / Organization</span>
              <strong style={{ color: '#fff' }}>{testResult.isp || 'Unknown'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Location</span>
              <strong style={{ color: '#fff' }}>{testResult.city ? `${testResult.city}, ` : ''}{testResult.country || 'Unknown'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Hosting / Datacenter</span>
              <strong style={{ color: testResult.isHosting ? '#ef4444' : '#4ade80' }}>
                {testResult.isHosting ? '⚠️ YES (Datacenter)' : '✅ NO (Residential)'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text3)', display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Verdict</span>
              <span
                style={{
                  display: 'inline-block',
                  background: testResult.isVpn ? '#ef444425' : '#22c55e25',
                  color: testResult.isVpn ? '#ef4444' : '#4ade80',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontWeight: '800'
                }}
              >
                {testResult.isVpn ? '🛡️ BLOCKED (VPN / Proxy)' : '✅ ALLOWED (Clean Connection)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── CARD 5: SECURITY AUDIT & SCAN EVENTS ────────────────────────── */}
      {scanResults && (
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: scanScore < 100 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>📋 Scan Report</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text3)', fontSize: '14px' }}>System Health Score:</span>
              <span style={{ fontSize: '24px', fontWeight: '900', color: scanScore >= 90 ? '#22c55e' : scanScore >= 70 ? '#eab308' : '#ef4444' }}>
                {scanScore}%
              </span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {scanResults.map((res, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '8px', borderLeft: `4px solid ${res.status === 'passed' ? '#22c55e' : res.status === 'warning' ? '#eab308' : '#ef4444'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{res.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: res.status === 'passed' ? '#22c55e' : res.status === 'warning' ? '#eab308' : '#ef4444', textTransform: 'uppercase' }}>
                    {res.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>{res.message}</p>
                {res.action && <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>Action: {res.action}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {scanError && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', marginBottom: '32px' }}>
          <strong>Scan Failed:</strong> {scanError}
        </div>
      )}

      {/* EVENT LOGS SECTION */}
      <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: '#fff' }}>📋 Recent Security Events</h2>
      {logs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '50px 20px', background: 'var(--bg2)', borderRadius: '12px' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>🛡️</div>
          <h3 style={{ margin: '0 0 8px', color: '#fff' }}>No Active Threat Alerts</h3>
          <p style={{ margin: 0, color: 'var(--text3)' }}>FlixOn is secure. Suspicious attempts will be recorded here.</p>
        </div>
      ) : (
        <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', maxWidth: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', width: '160px' }}>Time</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', width: '110px' }}>Severity</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', width: '180px' }}>Event Type</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', width: '220px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td suppressHydrationWarning style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        background: `${getSeverityColor(log.severity)}20`,
                        color: getSeverityColor(log.severity),
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '700'
                      }}
                    >
                      {log.severity || 'INFO'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                    {log.event_type}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text2)' }}>
                    {log.description}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text3)' }}>
                    {log.metadata ? (
                      <pre style={{ margin: 0, background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: '4px', overflowX: 'auto', maxWidth: '100%', fontSize: '11px' }}>
                        {JSON.stringify(log.metadata, null, 1)}
                      </pre>
                    ) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
