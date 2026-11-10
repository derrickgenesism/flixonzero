const fs = require('fs');
const path = require('path');

// Robustly load env file across VPS releases, shared folder, or local dev
const possibleEnvPaths = [
  path.resolve(__dirname, '..', '.env.local'),
  path.resolve(__dirname, '..', '.env'),
  '/var/www/flixon/.env.local',
  '/var/www/flixon-releases/.shared.env.local',
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env'),
];
for (const p of possibleEnvPaths) {
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p });
  }
}

const { createClient } = require('@supabase/supabase-js');
const { S3Client, GetObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const ffmpeg = require('fluent-ffmpeg');
const { pipeline } = require('stream/promises');

// Set ffmpeg path (prefer system ffmpeg on VPS, fallback to installed binary)
try {
  const which = require('child_process').execSync('which ffmpeg 2>/dev/null || where ffmpeg 2>nul').toString().trim();
  if (which) {
    ffmpeg.setFfmpegPath(which.split('\n')[0].trim());
    console.log(`[FFmpeg] Using system binary: ${which.split('\n')[0].trim()}`);
  } else {
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log(`[FFmpeg] Using bundled binary: ${ffmpegPath}`);
  }
} catch (_) {
  try {
    const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
    ffmpeg.setFfmpegPath(ffmpegPath);
    console.log(`[FFmpeg] Using bundled binary: ${ffmpegPath}`);
  } catch (err) {
    console.warn('[FFmpeg] Could not auto-detect FFmpeg path; using default command.');
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let isRunning = true;
process.on('SIGINT', () => {
  console.log('\n[FlixOn Compressor] Received SIGINT. Shutting down gracefully...');
  isRunning = false;
});
process.on('SIGTERM', () => {
  console.log('\n[FlixOn Compressor] Received SIGTERM. Shutting down gracefully...');
  isRunning = false;
});

/**
 * Fetch storage credentials for Backblaze B2 or Cloudflare R2
 */
async function getStorageCredentials(preferredProvider = null) {
  const { data: settings, error } = await supabase.from('admin_settings').select('*');
  if (error || !settings) throw new Error('Could not fetch admin settings from Supabase');

  const find = (key) => settings.find(s => s.setting_key === key)?.setting_value || '';
  const defaultProvider = find('storage_provider') || 'b2';
  const provider = (preferredProvider || defaultProvider).toLowerCase();

  if (provider === 'b2') {
    const endpoint = find('b2_endpoint') || 'https://s3.us-east-005.backblazeb2.com';
    const region = find('b2_region') || 'us-east-005';
    const bucketName = find('b2_bucket_name') || 'flixonvideos';
    const accessKeyId = find('b2_access_key');
    const secretAccessKey = find('b2_secret_key');

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('Backblaze B2 credentials (b2_access_key / b2_secret_key) not found in admin settings');
    }

    return {
      provider: 'b2',
      endpoint,
      region,
      bucketName,
      accessKeyId,
      secretAccessKey,
      publicUrlPrefix: 'https://cdn.flixon.net',
    };
  } else {
    // Cloudflare R2
    const accountId = find('r2_account_id');
    const accessKeyId = find('r2_access_key');
    const secretAccessKey = find('r2_secret_key');
    const bucketName = find('r2_bucket_name') || 'movies';
    const endpoint = accountId ? `https://${accountId}.r2.cloudflarestorage.com` : '';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error('Cloudflare R2 credentials (r2_account_id / r2_access_key / r2_secret_key) not found in admin settings');
    }

    return {
      provider: 'r2',
      endpoint,
      region: 'auto',
      bucketName,
      accessKeyId,
      secretAccessKey,
      publicUrlPrefix: 'https://cdn.flixon.net',
    };
  }
}

/**
 * Advanced Squeeze compression ladder:
 * - Codec: libx264 (universal compatibility across 100% of devices)
 * - CRF: 28 (Balanced - saves 60-80% space without visible quality loss)
 * - Scale filter: scale=-2:'min(720,ih)' (smart downscaling: maintains aspect ratio, prevents odd dimensions)
 * - Audio: aac 128k
 * - Faststart: -movflags +faststart (instant playback streaming)
 */
function compressVideo(inputPath, outputPath, job, totalFramesGuess) {
  return new Promise((resolve, reject) => {
    let lastLogTime = 0;
    let isCancelled = false;

    const command = ffmpeg(inputPath)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '28',
        '-vf', "scale=-2:'min(720,ih)'",
        '-c:a', 'aac',
        '-b:a', '128k',
        '-map_metadata', '-1',
        '-movflags', '+faststart',
        '-threads', '0',
        '-f', 'mp4',
      ])
      .on('start', (commandLine) => {
        console.log(`[Job ${job.id}] Started FFmpeg: ${commandLine}`);
      })
      .on('progress', async (progress) => {
        const now = Date.now();
        if (now - lastLogTime > 2500) {
          lastLogTime = now;

          // Check if user cancelled this job in the admin dashboard
          const { data: currentJob } = await supabase
            .from('compression_jobs')
            .select('status')
            .eq('id', job.id)
            .maybeSingle();

          if (currentJob?.status === 'cancelled') {
            isCancelled = true;
            try { command.kill('SIGKILL'); } catch (_) {}
            reject(new Error('Job cancelled by administrator'));
            return;
          }

          let percent = progress.percent;
          if ((!percent || percent <= 0) && progress.frames && totalFramesGuess) {
            percent = (progress.frames / totalFramesGuess) * 100;
          }

          if (percent && percent > 0) {
            const rounded = Math.min(99, Math.max(1, Math.round(percent)));
            console.log(`[Job ${job.id}] Compression progress: ${rounded}%`);
            await supabase
              .from('compression_jobs')
              .update({ progress: rounded })
              .eq('id', job.id);
          } else {
            console.log(`[Job ${job.id}] Compressing (fps: ${progress.currentFps || '?'}, frame: ${progress.frames || '?'})...`);
          }
        }
      })
      .on('end', () => {
        if (!isCancelled) {
          console.log(`[Job ${job.id}] Squeeze compression finished successfully!`);
          resolve();
        }
      })
      .on('error', (err) => {
        if (!isCancelled) {
          console.error(`[Job ${job.id}] FFmpeg error:`, err.message);
          reject(err);
        }
      });

    command.save(outputPath);
  });
}

/**
 * Process a single queued compression job
 */
async function processNextJob() {
  const { data: jobs, error } = await supabase
    .from('compression_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('[Queue Error]', error.message);
    return false;
  }

  if (!jobs || jobs.length === 0) {
    return false;
  }

  const job = jobs[0];
  console.log(`\n======================================================`);
  console.log(`[Job ${job.id}] Picked up job for video: ${job.video_key}`);
  console.log(`======================================================`);

  const inputPath = path.join(TEMP_DIR, `raw_${job.id}.mp4`);
  const outputPath = path.join(TEMP_DIR, `compressed_${job.id}.mp4`);

  try {
    // 1. Mark as processing
    await supabase.from('compression_jobs')
      .update({ status: 'processing', progress: 0 })
      .eq('id', job.id);

    // 2. Determine storage credentials & locate file
    let creds = await getStorageCredentials();
    let s3 = new S3Client({
      region: creds.region,
      endpoint: creds.endpoint,
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
      },
    });

    let actualKey = job.video_key;
    let totalBytes = 0;

    // 3. Obtain raw video file (from remote URL or from Storage Bucket)
    if (job.video_key.startsWith('URL|')) {
      const parts = job.video_key.split('|');
      const downloadUrl = parts[1];
      actualKey = parts[2] || `video_${Date.now()}.mp4`;

      console.log(`[Job ${job.id}] Downloading remote video from: ${downloadUrl}`);
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to fetch source URL: HTTP ${response.status}`);
      totalBytes = Number(response.headers.get('content-length')) || 0;

      const fileStream = fs.createWriteStream(inputPath);
      await pipeline(response.body, fileStream);
      totalBytes = fs.statSync(inputPath).size;
      console.log(`[Job ${job.id}] Download complete. Raw size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

      await supabase.from('compression_jobs')
        .update({ video_key: actualKey, original_size: totalBytes })
        .eq('id', job.id);
    } else {
      // Check if file is in current provider; if not, check alternate provider
      try {
        const head = await s3.send(new HeadObjectCommand({ Bucket: creds.bucketName, Key: actualKey }));
        totalBytes = head.ContentLength || 0;
      } catch (headErr) {
        const altProvider = creds.provider === 'b2' ? 'r2' : 'b2';
        try {
          const altCreds = await getStorageCredentials(altProvider);
          const altS3 = new S3Client({
            region: altCreds.region,
            endpoint: altCreds.endpoint,
            credentials: {
              accessKeyId: altCreds.accessKeyId,
              secretAccessKey: altCreds.secretAccessKey,
            },
          });
          const altHead = await altS3.send(new HeadObjectCommand({ Bucket: altCreds.bucketName, Key: actualKey }));
          totalBytes = altHead.ContentLength || 0;
          creds = altCreds;
          s3 = altS3;
          console.log(`[Job ${job.id}] Video located in alternate bucket: ${altCreds.provider.toUpperCase()} (${altCreds.bucketName})`);
        } catch (_) {}
      }

      console.log(`[Job ${job.id}] Downloading raw video from ${creds.provider.toUpperCase()} (${creds.bucketName}): ${actualKey}`);
      const getCommand = new GetObjectCommand({
        Bucket: creds.bucketName,
        Key: actualKey,
      });

      const response = await s3.send(getCommand);
      totalBytes = response.ContentLength || totalBytes;
      await pipeline(response.Body, fs.createWriteStream(inputPath));
      totalBytes = fs.statSync(inputPath).size;
      console.log(`[Job ${job.id}] Downloaded from bucket. Raw size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

      await supabase.from('compression_jobs')
        .update({ original_size: totalBytes })
        .eq('id', job.id);
    }

    // 4. Compress video using Squeeze algorithm
    const totalFramesGuess = Math.max(24, Math.floor((totalBytes / (1024 * 1024)) * 24));
    console.log(`[Job ${job.id}] Starting Squeeze compression (CRF 28, 720p smart scale, faststart)...`);
    await compressVideo(inputPath, outputPath, job, totalFramesGuess);

    const compressedStats = fs.statSync(outputPath);
    const compressedSize = compressedStats.size;
    const savedBytes = Math.max(0, totalBytes - compressedSize);
    const savedPct = totalBytes > 0 ? ((savedBytes / totalBytes) * 100).toFixed(1) : '0';

    console.log(`[Job ${job.id}] Squeeze finished! Raw: ${(totalBytes / 1024 / 1024).toFixed(2)} MB -> Compressed: ${(compressedSize / 1024 / 1024).toFixed(2)} MB (Saved ${savedPct}%)`);

    // 5. Upload compressed video to storage bucket (B2 or R2) with Squeeze Metadata Tag
    console.log(`[Job ${job.id}] Uploading compressed video to ${creds.provider.toUpperCase()} (${creds.bucketName}) with Squeeze tag...`);
    const uploadStream = fs.createReadStream(outputPath);
    const upload = new Upload({
      client: s3,
      queueSize: 8,
      partSize: 20 * 1024 * 1024,
      params: {
        Bucket: creds.bucketName,
        Key: actualKey,
        Body: uploadStream,
        ContentType: 'video/mp4',
        Metadata: {
          squeeze: '1',
          compressed: 'true',
          'compressed-at': new Date().toISOString(),
        },
      },
    });

    upload.on('httpUploadProgress', (progress) => {
      const pct = Math.round((progress.loaded / (progress.total || compressedSize)) * 100);
      if (pct % 25 === 0) {
        console.log(`[Job ${job.id}] Uploading back to storage: ${pct}%`);
      }
    });

    await upload.done();
    console.log(`[Job ${job.id}] Upload complete!`);

    // 6. Update matching movie record if linked
    try {
      const publicCdnUrl = `${creds.publicUrlPrefix}/${encodeURIComponent(actualKey).replace(/%2F/g, '/')}`;
      const { data: matchingMovies } = await supabase
        .from('movies')
        .select('id, title, video_url')
        .ilike('video_url', `%${actualKey}%`)
        .limit(1);

      if (matchingMovies && matchingMovies.length > 0) {
        const movie = matchingMovies[0];
        console.log(`[Job ${job.id}] Updating movie record "${movie.title}" with new CDN URL: ${publicCdnUrl}`);
        await supabase
          .from('movies')
          .update({ video_url: publicCdnUrl })
          .eq('id', movie.id);
      }
    } catch (movieErr) {
      console.warn(`[Job ${job.id}] Movie table update note:`, movieErr.message);
    }

    // 7. Mark job as completed
    await supabase.from('compression_jobs')
      .update({
        status: 'completed',
        progress: 100,
        original_size: totalBytes,
        compressed_size: compressedSize,
      })
      .eq('id', job.id);

    console.log(`[Job ${job.id}] 🎉 Fully processed and marked as completed.`);

    // 8. Cleanup temp files
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    return true;
  } catch (err) {
    console.error(`[Job ${job.id}] Failed:`, err.message);

    // If already cancelled, do not overwrite status with failed
    const { data: checkJob } = await supabase
      .from('compression_jobs')
      .select('status')
      .eq('id', job.id)
      .maybeSingle();

    if (checkJob?.status !== 'cancelled') {
      await supabase.from('compression_jobs')
        .update({
          status: 'failed',
          error_message: err.message || 'Unknown compression failure',
        })
        .eq('id', job.id);
    }

    // Cleanup on failure
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    return false;
  }
}

async function pingHeartbeat() {
  try {
    const { error } = await supabase.from('admin_settings').upsert({
      setting_key: 'compressor_worker_last_ping',
      setting_value: Date.now().toString(),
    }, { onConflict: 'setting_key' });
    if (error) console.error('[Heartbeat Error]', error.message);
  } catch (err) {
    console.error('[Heartbeat Exception]', err.message);
  }
}

async function recoverStaleJobs() {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    await supabase
      .from('compression_jobs')
      .update({ status: 'pending', error_message: 'Auto-recovered from interrupted processing' })
      .eq('status', 'processing')
      .lt('created_at', fifteenMinsAgo);
  } catch (_) {}
}

/**
 * Main 24/7 worker loop
 */
async function startWorker() {
  console.log('====================================================');
  console.log('   FlixOn Squeeze 24/7 Background Compression Engine ');
  console.log('   Storage: Backblaze B2 & Cloudflare R2             ');
  console.log('   Codec: H.264 (CRF 28, FastStart, Smart 720p Scale)');
  console.log('====================================================\n');
  console.log('Worker running in background. Monitoring queue for new jobs...');
  await recoverStaleJobs();
  let loopCount = 0;

  while (isRunning) {
    try {
      await pingHeartbeat();
      loopCount++;
      if (loopCount % 50 === 0) {
        await recoverStaleJobs();
      }
      const processed = await processNextJob();
      if (!processed) {
        // Sleep 4 seconds before checking again
        await new Promise(r => setTimeout(r, 4000));
      }
    } catch (loopErr) {
      console.error('[Worker Loop Error]', loopErr.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log('[FlixOn Compressor] Worker stopped cleanly.');
  process.exit(0);
}

startWorker();
