import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getStorageClient } from '@/utils/storage';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { provider = 'b2', key } = body;

    if (!key) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }

    const { client, config } = await getStorageClient(provider);

    const command = new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    });

    await client.send(command);

    return NextResponse.json({
      success: true,
      deletedKey: key,
      provider: config.provider,
      bucket: config.bucketName,
    });
  } catch (err) {
    console.error('Storage delete error:', err);
    return NextResponse.json({ error: err.message || 'Failed to delete file from storage' }, { status: 500 });
  }
}
