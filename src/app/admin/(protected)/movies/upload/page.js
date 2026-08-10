import { createClient } from '@/utils/supabase/server';
import UploadClient from './UploadClient';
import QueueClient from './QueueClient';

export const metadata = { title: 'Upload & Compress — Admin' };
export const dynamic = 'force-dynamic';

export default async function CompressionPage() {
  const supabase = await createClient();

  const { data: jobs } = await supabase
    .from('compression_jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', margin: '0 0 8px' }}>Video Uploader & Compressor</h1>
        <p style={{ color: 'var(--text2)', margin: 0 }}>
          Upload a raw video directly to your Cloudflare R2 bucket. It will be automatically queued for compression.
        </p>
      </div>

      <div style={{ marginBottom: '36px' }}>
        <UploadClient />
      </div>

      <QueueClient initialJobs={jobs || []} />
    </div>
  );
}
