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

    const { filename, contentType } = await request.json();
    if (!filename) return NextResponse.json({ error: 'Filename is required' }, { status: 400 });

    // Get R2 Settings
    const { data: settings } = await supabase.from('admin_settings').select('*');
    const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
    const accessKey = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
    const secretKey = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
    const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;

    if (!accountId || !accessKey || !secretKey || !bucketName) {
      return NextResponse.json({ error: 'R2 Settings missing in Admin' }, { status: 500 });
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    // Use the exact filename provided by the user
    // Clean it up just in case (remove paths) and replace spaces with hyphens
    const cleanFilename = filename.split(/[/\\]/).pop().replace(/\s+/g, '-');

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: cleanFilename,
      ContentType: contentType || 'video/mp4'
    });

    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour

    return NextResponse.json({ url: signedUrl, key: cleanFilename });

  } catch (error) {
    console.error('Presign Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
