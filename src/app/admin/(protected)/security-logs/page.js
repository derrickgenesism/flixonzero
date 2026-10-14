import { createAdminClient } from '@/utils/supabase/admin';
import SecurityLogsClient from './SecurityLogsClient';

export const dynamic = 'force-dynamic';

export default async function SecurityLogsPage() {
  const supabase = createAdminClient();
  
  // 1. Fetch DB security_logs (table may not exist yet)
  let logs = [];
  let dbError = null;

  try {
    const { data: dbLogs, error } = await supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      dbError = error.message;
    } else if (dbLogs) {
      logs = dbLogs;
    }
  } catch (err) {
    dbError = err.message;
  }

  // 2. Fetch security settings & fallback audit events from admin_settings
  const { data: settingsRows } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value')
    .in('setting_key', [
      'blocked_ips',
      'blocked_fingerprints',
      'vpn_blocking_enabled',
      'vpn_blocking_mode',
      'security_audit_events'
    ]);

  const getSetting = (key) => settingsRows?.find((s) => s.setting_key === key)?.setting_value;

  let blockedIps = [];
  try {
    const raw = getSetting('blocked_ips');
    if (raw) blockedIps = JSON.parse(raw);
  } catch {}

  let blockedFingerprints = [];
  try {
    const raw = getSetting('blocked_fingerprints');
    if (raw) blockedFingerprints = JSON.parse(raw);
  } catch {}

  let auditEvents = [];
  try {
    const raw = getSetting('security_audit_events');
    if (raw) auditEvents = JSON.parse(raw);
  } catch {}

  const vpnEnabled = getSetting('vpn_blocking_enabled') === 'true';
  const vpnMode = getSetting('vpn_blocking_mode') || 'all';

  // Merge audit events if dbLogs is empty or errored
  const combinedLogs = logs.length > 0 ? logs : auditEvents;

  return (
    <SecurityLogsClient
      initialLogs={combinedLogs}
      dbError={dbError}
      blockedIps={blockedIps}
      blockedFingerprints={blockedFingerprints}
      vpnEnabled={vpnEnabled}
      vpnMode={vpnMode}
    />
  );
}
