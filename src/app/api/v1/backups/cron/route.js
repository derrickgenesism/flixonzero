import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get credentials
    const { data: settings } = await supabase.from('admin_settings').select('*');
    const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
    const accessKey = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
    const secretKey = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
    const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;

    if (!accountId || !accessKey || !secretKey || !bucketName) {
      return NextResponse.json({ error: 'R2 credentials not fully configured in settings.' }, { status: 400 });
    }

    // 2. Fetch data to backup
    const { data: movies, error: moviesError } = await supabase.from('movies').select('*');
    if (moviesError) throw new Error(moviesError.message);

    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError && usersError.code !== '42P01') { 
      // ignore table not found if 'users' is actually 'user_profiles'
      console.error(usersError);
    }
    
    // Let's also fetch user_profiles just in case
    const { data: profiles, error: profilesError } = await supabase.from('user_profiles').select('*');

    const backupData = {
      timestamp: new Date().toISOString(),
      movies: movies || [],
      users: users || [],
      user_profiles: profiles || []
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    // 3. Upload to R2
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

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

    return NextResponse.json({ success: true, fileName });
  } catch (err) {
    console.error('Backup cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
