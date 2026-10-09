'use client';
import { useState, useEffect } from 'react';

export default function SecurityLogsClient({ initialLogs, dbError }) {
  const [logs, setLogs] = useState(initialLogs);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [scanScore, setScanScore] = useState(100);

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'CRITICAL': return '#ef4444'; // red
      case 'HIGH': return '#f97316'; // orange
      case 'MEDIUM': return '#eab308'; // yellow
      default: return '#3b82f6'; // blue
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
      
      // Artificial delay for effect
      setTimeout(() => {
        setScanResults(data.results);
        setScanScore(data.score);
        setIsScanning(false);
      }, 1500);
      
    } catch (err) {
      setScanError(err.message);
      setIsScanning(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          ??? Security Center & Scanner
        </h1>
        <button 
          onClick={runScan} 
          disabled={isScanning}
          style={{ 
            background: isScanning ? 'var(--bg2)' : 'var(--acc)', 
            color: '#fff', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '6px', 
            fontWeight: 'bold', 
            cursor: isScanning ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {isScanning ? '? Scanning Platform...' : '?? Run Full System Scan'}
        </button>
      </div>

      {dbError && dbError.includes("does not exist") && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 8px' }}>Database Table Missing!</h3>
          <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#fff' }}>The security monitoring system requires the <code>security_logs</code> table to be created in your database.</p>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text3)' }}>Please go to your Supabase SQL Editor and run the initialization script provided by your AI assistant.</p>
        </div>
      )}

      {/* SCAN RESULTS SECTION */}
      {scanResults && (
        <div style={{ background: 'var(--bg2)', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: scanScore < 100 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ?? Scan Report
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text3)', fontSize: '14px' }}>System Health Score:</span>
              <span style={{ 
                fontSize: '24px', 
                fontWeight: '900', 
                color: scanScore >= 90 ? '#22c55e' : scanScore >= 70 ? '#eab308' : '#ef4444' 
              }}>
                {scanScore}%
              </span>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {scanResults.map((res, i) => (
              <div key={i} style={{ 
                background: 'rgba(0,0,0,0.2)', 
                padding: '16px', 
                borderRadius: '8px',
                borderLeft: `4px solid ${res.status === 'passed' ? '#22c55e' : res.status === 'warning' ? '#eab308' : '#ef4444'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#fff' }}>{res.name}</span>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: res.status === 'passed' ? '#22c55e' : res.status === 'warning' ? '#eab308' : '#ef4444', textTransform: 'uppercase' }}>
                    {res.status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text2)', marginBottom: '8px' }}>{res.message}</p>
                {res.action && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#3b82f6', fontWeight: '600' }}>Action: {res.action}</p>
                )}
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
      <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: '#fff' }}>?? Recent Security Events</h2>
      {!dbError && logs.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg2)', borderRadius: '12px' }}>
          <div style={{ fontSize: '40px', marginBottom: '10px' }}>?</div>
          <h3 style={{ margin: '0 0 8px', color: '#fff' }}>No Security Alerts</h3>
          <p style={{ margin: 0, color: 'var(--text3)' }}>Your platform is currently safe. No malicious activity has been detected.</p>
        </div>
      )}

      {logs.length > 0 && (
        <div style={{ background: 'var(--bg2)', borderRadius: '12px', overflow: 'hidden', overflowX: 'auto', maxWidth: '100%' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', width: '150px' }}>Time</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', width: '100px' }}>Severity</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', width: '180px' }}>Event Type</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '16px', textAlign: 'left', color: 'var(--text3)', fontSize: '12px', textTransform: 'uppercase', width: '250px' }}>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      background: `${getSeverityColor(log.severity)}20`, 
                      color: getSeverityColor(log.severity),
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {log.severity}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', fontWeight: '600', color: '#fff' }}>
                    {log.event_type}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--text2)' }}>
                    {log.description}
                  </td>
                  <td style={{ padding: '16px', fontSize: '12px', color: 'var(--text3)' }}>
                    {log.metadata ? (
                      <pre style={{ margin: 0, background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', overflowX: 'auto', maxWidth: '100%' }}>
                        {JSON.stringify(log.metadata, null, 2)}
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
