import { NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getStorageClient } from '@/utils/storage';
import { PutObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const { client: s3, config } = await getStorageClient();

    // Fetch data to backup
    const { data: movies, error: moviesError } = await supabase.from('movies').select('*');
    if (moviesError) throw new Error(moviesError.message);

    const { data: profiles, error: profilesError } = await supabase.from('user_profiles').select('*');
    if (profilesError) console.error('Profiles backup notice:', profilesError.message);

    const backupData = {
      timestamp: new Date().toISOString(),
      provider: config.provider,
      bucket: config.bucketName,
      movies: movies || [],
      user_profiles: profiles || [],
    };

    const jsonString = JSON.stringify(backupData, null, 2);

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `backups/flixon_backup_${dateStr}_${Date.now()}.json`;

    await s3.send(
      new PutObjectCommand({
        Bucket: config.bucketName,
        Key: fileName,
        Body: jsonString,
        ContentType: 'application/json',
      })
    );

    return NextResponse.json({
      success: true,
      fileName,
      provider: config.provider,
      bucket: config.bucketName,
    });
  } catch (err) {
    console.error('Backup cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
