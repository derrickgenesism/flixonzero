import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function POST(request) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('email', user.email)
      .single();

    if (profile?.role !== 'administrator' && profile?.role !== 'editor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { filename, contentType, provider: requestedProvider } = await request.json();
    if (!filename) return NextResponse.json({ error: 'Filename is required' }, { status: 400 });

    // Get Storage Settings
    const { data: settings } = await createAdminClient().from('admin_settings').select('*');
    const getSetting = (k, fallback = '') => settings?.find(s => s.setting_key === k)?.setting_value || fallback;

    const defaultProvider = getSetting('storage_provider', 'b2');
    const provider = requestedProvider || defaultProvider;

    let s3;
    let bucketName;
    const cleanFilename = filename.split(/[/\\]/).pop().replace(/\s+/g, '-');

    if (provider === 'b2') {
      const b2Endpoint = getSetting('b2_endpoint', 'https://s3.us-east-005.backblazeb2.com');
      const b2Region = getSetting('b2_region', 'us-east-005');
      bucketName = getSetting('b2_bucket_name', 'flixonvideos');
      const b2AccessKey = getSetting('b2_access_key', '005f55e2928c64f0000000001');
      const b2SecretKey = getSetting('b2_secret_key', 'K005hcUWnse5QGvejFWTgegbDRKjaD0');

      if (!b2AccessKey || !b2SecretKey || !bucketName) {
        return NextResponse.json({ error: 'Backblaze B2 settings missing in Admin' }, { status: 500 });
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
      const accountId = getSetting('r2_account_id');
      const accessKey = getSetting('r2_access_key');
      const secretKey = getSetting('r2_secret_key');
      bucketName = getSetting('r2_bucket_name', 'movies');

      if (!accountId || !accessKey || !secretKey || !bucketName) {
        return NextResponse.json({ error: 'Cloudflare R2 settings missing in Admin' }, { status: 500 });
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

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanFilename,
      ContentType: contentType || 'video/mp4'
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

    let cdnDomain = getSetting('cdn_domain', 'cdn.flixon.net');
    if (cdnDomain && !cdnDomain.startsWith('http')) cdnDomain = `https://${cdnDomain}`;
    cdnDomain = cdnDomain.replace(/\/$/, '');
    const cdnUrl = `${cdnDomain}/${encodeURIComponent(cleanFilename)}`;

    return NextResponse.json({
      url: signedUrl,
      key: cleanFilename,
      provider,
      bucket: bucketName,
      cdnUrl
    });

  } catch (error) {
    console.error('Presign Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
