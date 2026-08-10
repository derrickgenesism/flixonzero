'use server';

import { createClient } from '@/utils/supabase/server';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { queueCompressionJob } from '../upload/actions';

export async function listR2Videos(prefix = '') {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: settings } = await supabase.from('admin_settings').select('*');
  const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
  const accessKey = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
  const secretKey = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
  const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;

  if (!accountId || !accessKey || !secretKey || !bucketName) {
    return { error: 'R2 Settings missing in Admin' };
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  try {
    const allVideos = [];
    let continuationToken = undefined;

    // R2 returns max 1000 per page — loop until we have everything
    do {
      const command = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });

      const response = await s3.send(command);

      const page = (response.Contents || [])
        .filter(obj => {
          const key = obj.Key.toLowerCase();
          return key.endsWith('.mp4') || key.endsWith('.mkv') || key.endsWith('.webm') || key.endsWith('.mov') || key.endsWith('.avi');
        })
        .map(obj => ({
          key: obj.Key,
          size: obj.Size,
          lastModified: obj.LastModified,
        }));

      allVideos.push(...page);
      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return { videos: allVideos };
  } catch (err) {
    console.error('S3 List Error:', err);
    return { error: err.message };
  }
}

export async function queueExistingJob(videoKey) {
  return await queueCompressionJob(videoKey);
}
