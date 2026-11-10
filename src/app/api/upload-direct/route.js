import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  const generatedKey = searchParams.get('key');
  const requestedProvider = searchParams.get('provider');

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

      const { data: settings } = await createAdminClient().from('admin_settings').select('*');
      const getSetting = (k, fallback = '') => settings?.find(s => s.setting_key === k)?.setting_value || fallback;

      const defaultProvider = getSetting('storage_provider', 'b2');
      const provider = requestedProvider || defaultProvider;

      let s3;
      let bucketName;

      if (provider === 'b2') {
        const b2Endpoint = getSetting('b2_endpoint', 'https://s3.us-east-005.backblazeb2.com');
        const b2Region = getSetting('b2_region', 'us-east-005');
        bucketName = getSetting('b2_bucket_name', 'flixonvideos');
        const b2AccessKey = getSetting('b2_access_key', '005f55e2928c64f0000000001');
        const b2SecretKey = getSetting('b2_secret_key', 'K005hcUWnse5QGvejFWTgegbDRKjaD0');

        if (!b2AccessKey || !b2SecretKey || !bucketName) {
          throw new Error('Backblaze B2 settings missing in Admin');
        }

        s3 = new S3Client({
          region: b2Region,
          endpoint: b2Endpoint,
          credentials: { accessKeyId: b2AccessKey, secretAccessKey: b2SecretKey },
        });
      } else {
        const accountId = getSetting('r2_account_id');
        const accessKey = getSetting('r2_access_key');
        const secretKey = getSetting('r2_secret_key');
        bucketName = getSetting('r2_bucket_name', 'movies');

        if (!accountId || !accessKey || !secretKey || !bucketName) {
          throw new Error('Cloudflare R2 settings missing in Admin');
        }

        s3 = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
        });
      }

      writeMessage('progress', 0);
      writeMessage('status', 'Connecting to URL...');

      const response = await fetch(videoUrl);
      if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

      const contentLength = Number(response.headers.get('content-length')) || 0;
      writeMessage('status', `Streaming to ${provider === 'b2' ? 'Backblaze B2' : 'Cloudflare R2'} (${bucketName})...`);

      const upload = new Upload({
        client: s3,
        queueSize: 8,
        partSize: 50 * 1024 * 1024,
        leavePartsOnError: false,
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
          const percent = Math.min(100, Math.round((progress.loaded / contentLength) * 100));
          if (percent !== lastPercent) {
            lastPercent = percent;
            writeMessage('progress', percent);
          }
        }
      });

      await upload.done();

      let cdnDomain = getSetting('cdn_domain', 'cdn.flixon.net');
      if (cdnDomain && !cdnDomain.startsWith('http')) cdnDomain = `https://${cdnDomain}`;
      cdnDomain = cdnDomain.replace(/\/$/, '');

      const finalUrl = `${cdnDomain}/${encodeURIComponent(generatedKey)}`;
      writeMessage('status', 'Upload complete!');
      writeMessage('progress', 100);
      writeMessage('complete', { key: generatedKey, url: finalUrl, provider, bucket: bucketName });

    } catch (error) {
      console.error('[Upload Direct Error]:', error);
      writeMessage('error', error.message);
    } finally {
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
