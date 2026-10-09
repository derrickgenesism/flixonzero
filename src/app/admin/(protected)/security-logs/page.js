import { createAdminClient } from '@/utils/supabase/admin';
import SecurityLogsClient from './SecurityLogsClient';

export const dynamic = 'force-dynamic';

export default async function SecurityLogsPage() {
  const supabase = createAdminClient();
  
  // Fetch logs, newest first, limit to 100 for performance
  const { data: logs, error } = await supabase
    .from('security_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return <SecurityLogsClient initialLogs={logs || []} dbError={error?.message} />;
}
