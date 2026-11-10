'use server';

import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getStorageClient, getStoragePublicUrl } from '@/utils/storage';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function listStorageVideos(provider = 'b2', prefix = '') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { client, config } = await getStorageClient(provider);
    const allVideos = [];
    let continuationToken = undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: config.bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });

      const response = await client.send(command);

      const page = (response.Contents || [])
        .filter(obj => {
          const key = (obj.Key || '').toLowerCase();
          return key.endsWith('.mp4') || key.endsWith('.mkv') || key.endsWith('.webm') || key.endsWith('.mov') || key.endsWith('.avi');
        })
        .map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
          url: getStoragePublicUrl(obj.Key, config.provider),
        }));

      allVideos.push(...page);
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return { videos: allVideos, provider: config.provider, bucket: config.bucketName };
  } catch (err) {
    console.error('Storage List Error:', err);
    return { error: err.message };
  }
}

// Backwards-compatible alias
export async function listR2Videos(prefix = '') {
  return await listStorageVideos('r2', prefix);
}

export async function queueExistingJob(videoKey, sourceUrl = null, provider = 'b2') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  let targetKey = videoKey;
  if (sourceUrl) {
    const fileName = videoKey || sourceUrl.split('/').pop().split('?')[0] || `video_${Date.now()}.mp4`;
    targetKey = `URL|${sourceUrl}|${fileName}`;
  }

  if (!targetKey) return { error: 'Missing video key or source URL' };

  const adminClient = createAdminClient();

  const { data: existing } = await adminClient
    .from('compression_jobs')
    .select('id, status')
    .eq('video_key', targetKey)
    .in('status', ['pending', 'processing'])
    .maybeSingle();

  if (existing) {
    return { success: true, message: 'Job already queued or running' };
  }

  const { data, error } = await adminClient
    .from('compression_jobs')
    .insert({
      video_key: targetKey,
      status: 'pending',
      progress: 0,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  return { success: true, job: data };
}
