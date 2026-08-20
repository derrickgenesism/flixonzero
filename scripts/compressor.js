require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { pipeline } = require('stream/promises');

ffmpeg.setFfmpegPath(ffmpegPath);

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

let isRunning = true;
process.on('SIGINT', () => {
  console.log('Stopping compressor gracefully...');
  isRunning = false;
});

async function getR2Credentials() {
  const { data: settings, error } = await supabase.from('admin_settings').select('*');
  if (error || !settings) throw new Error('Could not fetch admin settings');

  const accountId = settings.find(s => s.setting_key === 'r2_account_id')?.setting_value;
  const accessKey = settings.find(s => s.setting_key === 'r2_access_key')?.setting_value;
  const secretKey = settings.find(s => s.setting_key === 'r2_secret_key')?.setting_value;
  const bucketName = settings.find(s => s.setting_key === 'r2_bucket_name')?.setting_value;

  if (!accountId || !accessKey || !secretKey || !bucketName) {
    throw new Error('R2 credentials are not fully configured in admin settings');
  }

  return { accountId, accessKey, secretKey, bucketName };
}

function compressVideo(inputPath, outputPath, job, totalFramesGuess) {
  return new Promise((resolve, reject) => {
    let lastLogTime = 0;
    
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .outputOptions([
        '-crf 28',         // Heavy compression, acceptable quality
        '-preset fast',    // Speed vs compression ratio trade-off
        '-movflags +faststart' // Web streaming optimization
      ])
      .on('start', (commandLine) => {
        console.log(`Started FFmpeg with command: ${commandLine}`);
      })
      .on('progress', async (progress) => {
        const now = Date.now();
        if (now - lastLogTime > 3000) { // Update Supabase every 3 seconds
          lastLogTime = now;
          let percent = progress.percent;
          if (!percent && progress.frames && totalFramesGuess) {
            percent = (progress.frames / totalFramesGuess) * 100;
          }
          if (percent && percent > 0 && percent <= 100) {
            console.log(`[Job ${job.id}] Compression progress: ${percent.toFixed(1)}%`);
            await supabase.from('compression_jobs')
              .update({ progress: Math.round(percent) })
              .eq('id', job.id);
          } else {
             console.log(`[Job ${job.id}] Compression processing...`);
          }
        }
      })
      .on('end', () => {
        console.log(`[Job ${job.id}] Compression finished!`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`[Job ${job.id}] FFmpeg error:`, err);
        reject(err);
      })
      .save(outputPath);
  });
}

async function processNextJob() {
  const { data: jobs, error } = await supabase
    .from('compression_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Error fetching jobs:', error.message);
    return false;
  }

  if (!jobs || jobs.length === 0) {
    return false; // No jobs found
  }

  const job = jobs[0];
  console.log(`\nFound pending job ${job.id} for video: ${job.video_key}`);

  try {
    // 1. Mark as processing
    await supabase.from('compression_jobs')
      .update({ status: 'processing', progress: 0 })
      .eq('id', job.id);

    // 2. Get R2 credentials
    const { accountId, accessKey, secretKey, bucketName } = await getR2Credentials();
    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });

    const inputPath = path.join(TEMP_DIR, `raw_${job.id}.mp4`);
    const outputPath = path.join(TEMP_DIR, `compressed_${job.id}.mp4`);

    // 3. Download the raw file
    let downloadUrl = null;
    let actualKey = job.video_key;
    if (job.video_key.startsWith('URL|')) {
      const parts = job.video_key.split('|');
      downloadUrl = parts[1];
      actualKey = parts[2] || `imported_${Date.now()}.mp4`;
      
      // Update job to reflect the actual key so that the UI can find it later
      await supabase.from('compression_jobs')
        .update({ video_key: actualKey })
        .eq('id', job.id);
    }

    let totalBytes = 0;
    if (downloadUrl) {
      console.log(`[Job ${job.id}] Downloading raw video from URL: ${downloadUrl}...`);
      // using dynamic import for fetch if needed, but node 18+ has fetch
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error(`Failed to fetch from URL: ${response.statusText}`);
      totalBytes = Number(response.headers.get('content-length')) || 0;
      await pipeline(response.body, fs.createWriteStream(inputPath));
    } else {
      console.log(`[Job ${job.id}] Downloading raw video from R2...`);
      const getCommand = new GetObjectCommand({ Bucket: bucketName, Key: actualKey });
      const response = await s3.send(getCommand);
      totalBytes = response.ContentLength || 0;
      await pipeline(response.Body, fs.createWriteStream(inputPath));
    }
    console.log(`[Job ${job.id}] Download complete. Raw size: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

    // Guesstimate frames for progress tracking if percent is unavailable
    // Assuming 24fps and 1MB per second roughly (very rough fallback)
    const totalFramesGuess = Math.max(24, Math.floor((totalBytes / (1024 * 1024)) * 24));

    let uploadPath = outputPath;
    let outputStats;

    if (downloadUrl) {
      console.log(`[Job ${job.id}] Skipping compression for URL upload...`);
      uploadPath = inputPath;
      outputStats = fs.statSync(uploadPath);
    } else {
      // 4. Compress the video
      console.log(`[Job ${job.id}] Starting compression...`);
      await compressVideo(inputPath, outputPath, job, totalFramesGuess);
      outputStats = fs.statSync(outputPath);
    }

    // 5. Upload the video to R2
    console.log(`[Job ${job.id}] Uploading video back to R2...`);
    
    const uploadStream = fs.createReadStream(uploadPath);
    
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucketName,
        Key: actualKey, // Overwrite original
        Body: uploadStream,
        ContentType: 'video/mp4'
      }
    });

    upload.on('httpUploadProgress', (progress) => {
      if (progress.loaded && progress.total) {
        // Just log, we don't need to update Supabase for upload progress, 
        // or we could say progress is 100% and it's finalizing.
      }
    });

    await upload.done();
    console.log(`[Job ${job.id}] Upload complete!`);

    // 6. Mark as completed
    await supabase.from('compression_jobs')
      .update({ 
        status: 'completed', 
        progress: 100,
        original_size: totalBytes,
        compressed_size: outputStats.size
      })
      .eq('id', job.id);

    console.log(`[Job ${job.id}] Successfully completed. Saved ${((totalBytes - outputStats.size) / 1024 / 1024).toFixed(2)} MB`);

    // 7. Cleanup
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    return true; // Successfully processed a job

  } catch (err) {
    console.error(`[Job ${job.id}] Failed:`, err);
    await supabase.from('compression_jobs')
      .update({ status: 'failed', error_message: err.message || 'Unknown error' })
      .eq('id', job.id);
    
    // Cleanup on failure
    const inputPath = path.join(TEMP_DIR, `raw_${job.id}.mp4`);
    const outputPath = path.join(TEMP_DIR, `compressed_${job.id}.mp4`);
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    return false; // Job failed
  }
}

async function startWorker() {
  console.log("=========================================");
  console.log("   FlixOn Background Compression Worker   ");
  console.log("=========================================\n");
  console.log("Worker started. Monitoring queue...");

  while (isRunning) {
    try {
      const processedSomething = await processNextJob();
      if (!processedSomething) {
        // Sleep for 5 seconds if no jobs
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    } catch (err) {
      console.error("Worker loop error:", err);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  console.log("Worker stopped.");
  process.exit(0);
}

startWorker();
