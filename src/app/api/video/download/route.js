/**
 * POST /api/video/download
 *
 * Takes a video token, resolves the real R2 key, and returns a short-lived
 * presigned R2 GET URL with Content-Disposition: attachment so the browser
 * downloads the file instead of opening it in a new tab.
 *
 * This avoids proxying the file through Vercel — the download goes direct
 * from R2 to the user at full CDN speed.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { resolveVideoToken } from '@/lib/videoTokens';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request) {
  try {
    const { token, title } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    // Resolve the token to a real URL
    const resolved = resolveVideoToken(token);
    if (!resolved) {
      return NextResponse.json({ error: 'Token expired. Please refresh the page.' }, { status: 410 });
    }

    const { videoUrl } = resolved;

    // Extract the R2 object key from the URL
    // URL format: https://<accountId>.r2.cloudflarestorage.com/<bucket>/<key>
    // or a custom domain: https://<custom-domain>/<key>
    let objectKey = null;
    try {
      const parsedUrl = new URL(videoUrl);
      // Remove leading slash and bucket name if present in path
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      // If it's a direct R2 endpoint the path is /bucket/key or just /key
      objectKey = pathParts.join('/');
    } catch {
      return NextResponse.json({ error: 'Invalid video URL' }, { status: 500 });
    }

    // Get R2 credentials from admin settings
    const supabase = await createClient();
    const { data: settings } = await supabase.from('admin_settings').select('*');
    const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
    const accessKey = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
    const secretKey = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
    const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;
    const customDomain = settings?.find(s => s.setting_key === 'r2_custom_domain')?.setting_value;

    // If a custom domain is used, the objectKey includes the bucket name at the start — strip it
    if (customDomain && objectKey.startsWith(bucketName + '/')) {
      objectKey = objectKey.slice(bucketName.length + 1);
    }

    if (!accountId || !accessKey || !secretKey || !bucketName) {
      // Fallback: just redirect to the video URL (won't force download but at least plays)
      return NextResponse.json({ downloadUrl: videoUrl });
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    const safeTitle = (title || 'flixon-video')
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'flixon-video';

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${safeTitle}.mp4"`,
      ResponseContentType: 'video/mp4',
    });

    // Presigned URL valid for 15 minutes
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    return NextResponse.json({ downloadUrl });

  } catch (err) {
    console.error('[/api/video/download] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
