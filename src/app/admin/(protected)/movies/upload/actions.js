'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

export async function uploadUrlToR2(videoUrl, generatedKey) {
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

  // Get credentials
  const { data: settings } = await supabase.from('admin_settings').select('*');
  const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
  const accessKey = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
  const secretKey = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
  const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;

  if (!accountId || !accessKey || !secretKey || !bucketName) {
    return { error: 'R2 Settings missing in Admin' };
  }

  try {
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    const response = await fetch(videoUrl);
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucketName,
        Key: generatedKey,
        Body: response.body, // Stream it directly
        ContentType: 'video/mp4'
      }
    });

    await upload.done();
    return { success: true };
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

  const { error } = await supabase
    .from('compression_jobs')
    .insert({ video_key: videoKey, status: 'pending', progress: 0 });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/movies/upload');
  return { success: true };
}
