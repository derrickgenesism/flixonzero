'use server'
const { createAdminClient: _injectedAdminClient } = require('@/utils/supabase/admin');;

import { createClient } from '@/utils/supabase/server';
import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { revalidatePath } from 'next/cache';

async function getR2Client(supabase) {
  const { data: settings } = await _injectedAdminClient().from('admin_settings').select('*');
  const getSetting = (k, fallback = '') => settings?.find(s => s.setting_key === k)?.setting_value || fallback;
  const provider = getSetting('storage_provider', 'b2');

  if (provider === 'b2') {
    const b2Endpoint = getSetting('b2_endpoint', 'https://s3.us-east-005.backblazeb2.com');
    const b2Region = getSetting('b2_region', 'us-east-005');
    const bucketName = getSetting('b2_bucket_name', 'flixonvideos');
    const b2AccessKey = getSetting('b2_access_key', '005f55e2928c64f0000000001');
    const b2SecretKey = getSetting('b2_secret_key', 'K005hcUWnse5QGvejFWTgegbDRKjaD0');

    if (b2AccessKey && b2SecretKey && bucketName) {
      const s3 = new S3Client({
        region: b2Region,
        endpoint: b2Endpoint,
        credentials: { accessKeyId: b2AccessKey, secretAccessKey: b2SecretKey },
        forcePathStyle: true,
      });
      return { s3, bucketName, provider: 'b2' };
    }
  }

  // Fallback to Cloudflare R2
  const accountId = getSetting('r2_account_id');
  const accessKey = getSetting('r2_access_key');
  const secretKey = getSetting('r2_secret_key');
  const bucketName = getSetting('r2_bucket_name');

  if (!accountId || !accessKey || !secretKey || !bucketName) {
    throw new Error('Storage credentials (Backblaze B2 or Cloudflare R2) not fully configured in settings.');
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
    },
  });

  return { s3, bucketName, accountId, provider: 'r2' };
}

export async function listBackups() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { s3, bucketName } = await getR2Client(supabase);
    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'backups/',
    });

    const response = await s3.send(command);
    const files = response.Contents?.map(file => ({
      key: file.Key,
      size: file.Size,
      lastModified: file.LastModified,
    })).sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified)) || [];

    return { files };
  } catch (err) {
    return { error: err.message };
  }
}

export async function createManualBackup() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { s3, bucketName } = await getR2Client(supabase);

    // Fetch data to backup
    const { data: movies, error: moviesError } = await supabase.from('movies').select('*');
    if (moviesError) throw new Error(moviesError.message);

    const { data: profiles } = await supabase.from('user_profiles').select('*');

    const backupData = {
      timestamp: new Date().toISOString(),
      movies: movies || [],
      user_profiles: profiles || []
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `backups/flixon_backup_${dateStr}_${Date.now()}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: jsonString,
        ContentType: 'application/json',
      })
    );

    revalidatePath('/admin/backups');
    return { success: true, fileName };
  } catch (err) {
    return { error: err.message };
  }
}

export async function restoreMissingLinks(backupKey) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const { s3, bucketName } = await getR2Client(supabase);
    
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: backupKey,
    });
    
    const response = await s3.send(command);
    const jsonString = await response.Body.transformToString();
    const backupData = JSON.parse(jsonString);

    if (!backupData.movies || !Array.isArray(backupData.movies)) {
      throw new Error('Invalid backup format: no movies found');
    }

    let restoreCount = 0;
    // Iterate through backup and restore video_url and title where missing
    for (const m of backupData.movies) {
      if (m.video_url || m.title) {
        const updateObj = {};
        if (m.title) updateObj.title = m.title;
        if (m.video_url) updateObj.video_url = m.video_url;
        
        await supabase.from('movies').update(updateObj).eq('id', m.id);
        restoreCount++;
      }
    }

    return { success: true, restoreCount };
  } catch (err) {
    return { error: err.message };
  }
}

export async function uploadBackupFile(formData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  try {
    const file = formData.get('backup_file');
    if (!file) throw new Error('No file provided');

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { s3, bucketName } = await getR2Client(supabase);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `backups/manual_upload_${dateStr}_${Date.now()}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: buffer,
        ContentType: 'application/json',
      })
    );

    revalidatePath('/admin/backups');
    return { success: true, fileName };
  } catch (err) {
    return { error: err.message };
  }
}
