/**
 * POST /api/video/download
 *
 * Self-contained download endpoint. Takes a movieId, verifies auth and
 * subscription directly, then generates a short-lived R2 presigned GET URL
 * with Content-Disposition: attachment so the browser downloads the file.
 *
 * Does NOT use the in-memory token store — avoids cross-instance failures on Vercel.
 * The file is served direct from R2 at full CDN speed, never proxied through Vercel.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request) {
  try {
    const { movieId, title } = await request.json();

    if (!movieId) {
      return NextResponse.json({ error: 'Missing movieId' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the movie
    const { data: movie, error: movieError } = await supabase
      .from('movies')
      .select('id, type, video_url, title')
      .eq('id', movieId)
      .single();

    if (movieError || !movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // 3. Verify subscription access
    if (movie.type !== 'genesis_free_movie') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('subscription_end_date')
        .eq('email', user.email)
        .single();

      const hasActiveSub = profile?.subscription_end_date &&
        new Date(profile.subscription_end_date) > new Date();

      if (!hasActiveSub) {
        // Also check PPV access
        const { data: ppvData } = await supabase
          .from('ppv_purchases')
          .select('expires_at')
          .eq('user_id', user.id)
          .eq('movie_id', movie.id)
          .eq('status', 'success')
          .maybeSingle();

        const hasPpv = ppvData?.expires_at && new Date(ppvData.expires_at) > new Date();
        if (!hasPpv) {
          return NextResponse.json({ error: 'Subscription required' }, { status: 403 });
        }
      }
    }

    // 4. Extract the real video URL
    let videoUrl = movie.video_url;
    if (videoUrl && (videoUrl.includes('<video') || videoUrl.includes('<source'))) {
      const match = videoUrl.match(/src=["']([^"']+)['"]/);
      if (match?.[1]) videoUrl = match[1];
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video available for download' }, { status: 404 });
    }

    // 5. Get R2 credentials
    const { data: settings } = await supabase.from('admin_settings').select('*');
    const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
    const accessKey  = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
    const secretKey  = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
    const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;

    if (!accountId || !accessKey || !secretKey || !bucketName) {
      // No R2 credentials — fall back to direct URL (browser will open in tab, but at least it works)
      return NextResponse.json({ downloadUrl: videoUrl });
    }

    // 6. Extract the R2 object key from the URL
    let objectKey;
    try {
      const parsed = new URL(videoUrl);

      if (parsed.hostname.endsWith('r2.cloudflarestorage.com')) {
        // Direct R2 URL: https://<accountId>.r2.cloudflarestorage.com/<bucket>/<key>
        // pathname = /<bucket>/<key>  → strip leading slash and bucket name
        const parts = parsed.pathname.replace(/^\//, '').split('/');
        // parts[0] is the bucket name, everything after is the key
        objectKey = parts.slice(1).join('/');
      } else {
        // Custom domain or CDN URL: https://<domain>/<key>
        // pathname = /<key> → just strip the leading slash
        objectKey = parsed.pathname.replace(/^\//, '');
      }
    } catch {
      return NextResponse.json({ error: 'Invalid video URL format' }, { status: 500 });
    }

    if (!objectKey) {
      return NextResponse.json({ error: 'Could not determine R2 object key' }, { status: 500 });
    }

    // 7. Build presigned GET URL with Content-Disposition: attachment
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    const safeFilename = (title || movie.title || 'flixon-video')
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'flixon-video';

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${safeFilename}.mp4"`,
      ResponseContentType: 'video/mp4',
    });

    // Presigned URL valid for 15 minutes — plenty of time for download to start
    const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    return NextResponse.json({ downloadUrl });

  } catch (err) {
    console.error('[/api/video/download] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
