import { listBackups } from './actions';
import BackupsClient from './BackupsClient';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Database Backups ?" Admin' };

export default async function BackupsPage() {
  const supabase = await createClient();

  const { data: settings } = await supabase.from('admin_settings').select('*');
  const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
  let cdnDomain = settings?.find(s => s.setting_key === 'cdn_domain')?.setting_value;

  if (!accountId) {
    return (
      <div>
        <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Database Backups</h1>
        <div style={{ background: 'rgba(229, 9, 20, 0.1)', border: '1px solid #e50914', padding: '20px', borderRadius: '8px', color: '#fff' }}>
          <h3 style={{ margin: '0 0 10px', color: '#e50914' }}>Missing R2 Credentials</h3>
          <p style={{ margin: 0 }}>You must configure your Cloudflare R2 credentials in the <Link href="/admin/settings" style={{color: 'var(--acc)'}}>Settings</Link> page to use the backup system.</p>
        </div>
      </div>
    );
  }

  // Ensure CDN domain is formatted correctly
  if (cdnDomain && !cdnDomain.startsWith('http')) {
    cdnDomain = `https://${cdnDomain}`;
  } else if (!cdnDomain) {
    const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;
    cdnDomain = `https://${bucketName}.${accountId}.r2.cloudflarestorage.com`;
  }
  cdnDomain = cdnDomain.replace(/\/$/, '');

  const res = await listBackups();

  return (
    <div>
      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Database Backups</h1>
      <p style={{ color: 'var(--text2)', marginBottom: '30px' }}>
        Manage automated and manual backups of your database stored securely in Cloudflare R2.
      </p>

      <BackupsClient initialFiles={res.files || []} cdnDomain={cdnDomain} />
    </div>
  );
}
