import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, contentType, provider: requestedProvider = 'b2', appKey = 'app' } = body || {};

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: settings } = await admin.from('admin_settings').select('*');
    const findSetting = (key, fallback = '') => settings?.find(s => s.setting_key === key)?.setting_value || fallback;

    const provider = requestedProvider || findSetting('storage_provider', 'b2');

    let s3;
    let bucketName;

    // Clean filename: remove unsafe chars, keep extension
    const baseName = filename.split(/[/\\]/).pop().replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
    const timestamp = Date.now();
    const storageKey = `apps/${cleanSlug(appKey)}-${timestamp}-${baseName}`;

    if (provider === 'b2') {
      const b2Endpoint = findSetting('b2_endpoint', 'https://s3.us-east-005.backblazeb2.com');
      const b2Region = findSetting('b2_region', 'us-east-005');
      bucketName = findSetting('b2_bucket_name', 'flixonvideos');
      const b2AccessKey = findSetting('b2_access_key', '005f55e2928c64f0000000001');
      const b2SecretKey = findSetting('b2_secret_key', 'K005hcUWnse5QGvejFWTgegbDRKjaD0');

      if (!b2AccessKey || !b2SecretKey || !bucketName) {
        return NextResponse.json({ error: 'Backblaze B2 credentials missing in admin_settings' }, { status: 500 });
      }

      s3 = new S3Client({
        region: b2Region,
        endpoint: b2Endpoint,
        credentials: {
          accessKeyId: b2AccessKey,
          secretAccessKey: b2SecretKey,
        },
      });
    } else {
      // Cloudflare R2
      const accountId = findSetting('r2_account_id');
      const accessKey = findSetting('r2_access_key');
      const secretKey = findSetting('r2_secret_key');
      bucketName = findSetting('r2_bucket_name', 'movies');

      if (!accountId || !accessKey || !secretKey || !bucketName) {
        return NextResponse.json({ error: 'Cloudflare R2 credentials missing in admin_settings' }, { status: 500 });
      }

      s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      });
    }

    const resolvedContentType = contentType || (
      filename.endsWith('.apk') ? 'application/vnd.android.package-archive' :
      filename.endsWith('.zip') ? 'application/zip' :
      'application/octet-stream'
    );

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: storageKey,
      ContentType: resolvedContentType
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

    let cdnDomain = findSetting('cdn_domain', 'cdn.flixon.net');
    if (cdnDomain && !cdnDomain.startsWith('http')) cdnDomain = `https://${cdnDomain}`;
    cdnDomain = cdnDomain.replace(/\/$/, '');

    const fileUrl = `${cdnDomain}/${encodeURI(storageKey)}`;

    return NextResponse.json({
      success: true,
      uploadUrl,
      fileUrl,
      storageKey,
      bucketName,
      provider,
      filename: baseName
    });

  } catch (error) {
    console.error('Shared apps presign error:', error);
    return NextResponse.json({ error: error.message || 'Presign failed' }, { status: 500 });
  }
}

function cleanSlug(str) {
  return String(str || 'app').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
