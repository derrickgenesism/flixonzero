'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getStorageClient } from '@/utils/storage';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export async function uploadUrlToR2(videoUrl, generatedKey, targetProvider = null) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
    return { error: 'Not authorized' };
  }

  try {
    const { client: s3, config } = await getStorageClient(targetProvider);

    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

    const upload = new Upload({
      client: s3,
      queueSize: 8,
      partSize: 50 * 1024 * 1024, // 50MB parts for fast multi-part upload
      leavePartsOnError: false,
      params: {
        Bucket: config.bucketName,
        Key: generatedKey,
        Body: Readable.fromWeb(response.body),
        ContentType: 'video/mp4',
      },
    });

    await upload.done();
    return { success: true, provider: config.provider, bucket: config.bucketName };
  } catch (err) {
    console.error('Direct URL Upload Error:', err);
    return { error: err.message };
  }
}

export async function queueCompressionJob(videoKey) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('email', user.email)
    .single();

  if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
    return { error: 'Not authorized' };
  }

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from('compression_jobs')
    .select('id, status')
    .eq('video_key', videoKey)
    .in('status', ['pending', 'processing'])
    .maybeSingle();

  if (existing) {
    return { success: true, message: 'Job already queued or running' };
  }

  const { data, error } = await adminClient
    .from('compression_jobs')
    .insert({
      video_key: videoKey,
      status: 'pending',
      progress: 0,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, job: data };
}
