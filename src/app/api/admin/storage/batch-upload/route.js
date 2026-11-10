import { createClient } from '@/utils/supabase/server';
import { getStorageClient, getStoragePublicUrl } from '@/utils/storage';
import { Upload } from '@aws-sdk/lib-storage';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow 5 minutes on server for streaming

export async function POST(request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 });
  }

  const { videoUrl, fileName, provider = 'b2' } = body;
  if (!videoUrl) {
    return new Response(JSON.stringify({ error: 'Missing videoUrl' }), { status: 400 });
  }

  let storage;
  try {
    storage = await getStorageClient(provider);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
        } catch (_) {}
      };

      const urlToFetch = videoUrl.startsWith('http') ? videoUrl : `https://${videoUrl}`;

      try {
        const fetchResponse = await fetch(urlToFetch, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': '*/*',
            'Referer': 'https://google.com/',
          },
        });

        if (!fetchResponse.ok) {
          sendEvent({ type: 'error', error: `Source server returned HTTP ${fetchResponse.status}: ${fetchResponse.statusText}` });
          controller.close();
          return;
        }

        if (!fetchResponse.body) {
          sendEvent({ type: 'error', error: 'No readable stream available from source URL' });
          controller.close();
          return;
        }

        const cl = fetchResponse.headers.get('content-length');
        const sourceTotal = cl ? parseInt(cl, 10) : undefined;

        let finalFileName = fileName ? fileName.trim() : '';
        if (!finalFileName) {
          try {
            const parsed = new URL(urlToFetch);
            finalFileName = parsed.pathname.split('/').pop() || '';
          } catch (_) {
            finalFileName = '';
          }
        }
        if (!finalFileName || !finalFileName.includes('.')) {
          finalFileName = `video_${Date.now()}.mp4`;
        }

        const upload = new Upload({
          client: storage.client,
          queueSize: 8,
          partSize: 20 * 1024 * 1024, // 20 MB parts
          leavePartsOnError: false,
          params: {
            Bucket: storage.config.bucketName,
            Key: finalFileName,
            Body: fetchResponse.body,
            ContentType: 'video/mp4',
          },
        });

        let lastEmitTime = 0;
        upload.on('httpUploadProgress', (progress) => {
          const now = Date.now();
          if (now - lastEmitTime >= 500 || progress.loaded === progress.total) {
            sendEvent({
              type: 'progress',
              loaded: progress.loaded,
              total: progress.total || sourceTotal,
            });
            lastEmitTime = now;
          }
        });

        const heartbeat = setInterval(() => {
          sendEvent({ type: 'ping' });
        }, 2000);

        try {
          await upload.done();
        } finally {
          clearInterval(heartbeat);
        }

        const publicUrl = getStoragePublicUrl(finalFileName, storage.config.provider);
        sendEvent({
          type: 'done',
          fileName: finalFileName,
          provider: storage.config.provider,
          bucket: storage.config.bucketName,
          publicUrl,
        });
        try {
          controller.close();
        } catch (_) {}
      } catch (err) {
        console.error('Batch upload error:', err);
        sendEvent({ type: 'error', error: err.message || 'Streaming upload failed' });
        try {
          controller.close();
        } catch (_) {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
