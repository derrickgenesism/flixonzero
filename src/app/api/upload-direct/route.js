import { createClient } from '@/utils/supabase/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  const generatedKey = searchParams.get('key');

  if (!videoUrl || !generatedKey) {
    return new Response('Missing parameters', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeMessage = (type, data) => {
    writer.write(encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`));
  };

  const processUpload = async () => {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase.from('user_profiles').select('role').eq('email', user.email).single();
      if (profile?.role !== 'administrator' && profile?.role !== 'editor') throw new Error('Not authorized');

      const { data: settings } = await supabase.from('admin_settings').select('*');
      const accountId = settings?.find(s => s.setting_key === 'r2_account_id')?.setting_value;
      const accessKey = settings?.find(s => s.setting_key === 'r2_access_key')?.setting_value;
      const secretKey = settings?.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
      const bucketName = settings?.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;

      if (!accountId || !accessKey || !secretKey || !bucketName) {
        throw new Error('R2 Settings missing in Admin');
      }

      writeMessage('progress', 0);
      writeMessage('status', 'Connecting to URL...');

      const s3 = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
      });

      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

      const contentLength = Number(response.headers.get('content-length')) || 0;
      writeMessage('status', 'Streaming to R2 bucket...');

      const upload = new Upload({
        client: s3,
        params: {
          Bucket: bucketName,
          Key: generatedKey,
          Body: Readable.fromWeb(response.body),
          ContentType: 'video/mp4'
        }
      });

      let lastPercent = -1;
      upload.on('httpUploadProgress', (progress) => {
        if (progress.loaded && contentLength > 0) {
          const percent = Math.floor((progress.loaded / contentLength) * 100);
          if (percent > lastPercent) {
            lastPercent = percent;
            writeMessage('progress', percent);
          }
        }
      });

      await upload.done();
      writeMessage('progress', 100);
      writeMessage('status', 'Upload complete!');
      writeMessage('done', true);
      writer.close();

    } catch (error) {
      console.error('SSE Upload Error:', error);
      writeMessage('error', error.message);
      writer.close();
    }
  };

  processUpload();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
