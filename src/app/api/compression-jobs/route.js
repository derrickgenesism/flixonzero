import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const adminClient = createAdminClient();
  
  const { data: jobs, error } = await supabase
    .from('compression_jobs')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Check worker heartbeat in admin_settings
  let workerOnline = false;
  let lastPing = null;
  try {
    const { data: pingSetting } = await adminClient
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'compressor_worker_last_ping')
      .maybeSingle();

    if (pingSetting?.setting_value) {
      lastPing = Number(pingSetting.setting_value);
      workerOnline = (Date.now() - lastPing) < 30000; // active within last 30s
    }
  } catch (_) {}

  return NextResponse.json({
    jobs: jobs || [],
    workerOnline,
    lastPing,
  });
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { videoKey, sourceUrl, provider = 'b2' } = body;

    let targetKey = videoKey;
    if (sourceUrl) {
      const fileName = videoKey || sourceUrl.split('/').pop().split('?')[0] || `video_${Date.now()}.mp4`;
      targetKey = `URL|${sourceUrl}|${fileName}`;
    }

    if (!targetKey) {
      return NextResponse.json({ error: 'Video key or source URL is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Check if there is already an active job for this key
    const { data: existing } = await adminClient
      .from('compression_jobs')
      .select('id, status')
      .eq('video_key', targetKey)
      .in('status', ['pending', 'processing'])
      .maybeSingle();

    if (existing) {
      return NextResponse.json({
        success: true,
        jobId: existing.id,
        alreadyActive: true,
        message: 'A compression job is already queued or running for this video.',
      });
    }

    const { data: newJob, error: insertError } = await adminClient
      .from('compression_jobs')
      .insert({
        video_key: targetKey,
        status: 'pending',
        progress: 0,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      job: newJob,
      message: 'Video compression job queued successfully. The VPS will process it in the background.',
    });
  } catch (err) {
    console.error('Queue compression job error:', err);
    return NextResponse.json({ error: err.message || 'Failed to queue compression job' }, { status: 500 });
  }
}
