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
    const body = await request.json();
    // Accept either movieId or token (for backward compatibility with un-refreshed clients)
    const movieId = body.movieId;
    const title = body.title;

    if (!movieId && !body.token) {
      return NextResponse.json({ error: 'Missing movieId. Please refresh the page and try again.' }, { status: 400 });
    }

    const supabase = await createClient();
    let videoUrl = null;
    let movie = null;

    // 1. Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch the movie
    if (movieId) {
      const { data: m, error: movieError } = await supabase
        .from('movies')
        .select('id, type, video_url, title')
        .eq('id', movieId)
        .single();

      if (movieError || !m) {
        return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
      }
      movie = m;

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

      videoUrl = movie.video_url;
      if (videoUrl && (videoUrl.includes('<video') || videoUrl.includes('<source'))) {
        const match = videoUrl.match(/src=["']([^"']+)['"]/);
        if (match?.[1]) videoUrl = match[1];
      }
    } else if (body.token) {
      // Fallback for older clients that haven't refreshed
      // We don't have the token store here, so we just tell them to refresh
      return NextResponse.json({ error: 'System updated. Please refresh the page to download.' }, { status: 400 });
    }

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video available for download' }, { status: 404 });
    }

    // 4. Get R2 credentials
    const { data: settings } = await supabase.from('admin_settings').select('*');
    const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
    const accessKey  = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
    const secretKey  = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
    const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;
    const customDomain = settings?.find(s => s.setting_key === 'r2_custom_domain')?.setting_value;

    // Determine if this is an external link not belonging to our primary bucket
    // If it is, we cannot presign it. We must fall back to direct download.
    let isExternal = true;
    try {
      const parsed = new URL(videoUrl);
      if (accountId && parsed.hostname.includes(accountId)) isExternal = false;
      if (customDomain && parsed.hostname.includes(customDomain)) isExternal = false;
      if (bucketName && parsed.pathname.includes(bucketName)) isExternal = false;
      // If it's a relative URL or internal, it's not external
      if (videoUrl.startsWith('/')) isExternal = false;
    } catch {
      // Invalid URL
    }

    if (!accountId || !accessKey || !secretKey || !bucketName || isExternal) {
      // No R2 credentials OR it's an external link from another source
      // Browsers prohibit forcing cross-origin downloads via JS, so we tell the frontend
      // to instruct the user to use the native video player's download button.
      return NextResponse.json({ isExternalInstruction: true });
    }

    // 5. Extract the R2 object key from the URL
    let objectKey;
    try {
      const parsed = new URL(videoUrl);

      if (parsed.hostname.endsWith('r2.cloudflarestorage.com')) {
        const parts = parsed.pathname.replace(/^\//, '').split('/');
        objectKey = parts.slice(1).join('/');
      } else {
        objectKey = parsed.pathname.replace(/^\//, '');
      }
      // Decode it because new URL() leaves it URL-encoded, and AWS SDK will encode it again
      objectKey = decodeURIComponent(objectKey);
    } catch {
      return NextResponse.json({ error: 'Invalid video URL format' }, { status: 500 });
    }

    if (!objectKey) {
      return NextResponse.json({ error: 'Could not determine R2 object key' }, { status: 500 });
    }

    // 6. Build presigned GET URL with Content-Disposition: attachment
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      forcePathStyle: true, // Prevents AWS SDK from putting the bucket name in the subdomain
    });

    const safeFilename = (title || movie?.title || 'flixon-video')
      .replace(/[^a-zA-Z0-9\s\-_]/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'flixon-video';

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ResponseContentDisposition: `attachment; filename="${safeFilename}.mp4"`,
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
