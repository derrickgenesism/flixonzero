const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const fs = require('fs');

// Environment variables with fallbacks
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '8ccf9e8b6d2b8d87256960cf33144e9e';
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY || '308b3991b375f959f2fa1f3f089129c1';
const R2_SECRET_KEY = process.env.R2_SECRET_KEY || '1077d3909325d7a963768bb6b58c8f8ebe68627f68f23f4eec76d1d6228fb7ca';
const R2_BUCKET = process.env.R2_BUCKET || 'movies';

const B2_ENDPOINT = process.env.B2_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const B2_REGION = process.env.B2_REGION || 'us-east-005';
const B2_ACCESS_KEY = process.env.B2_ACCESS_KEY || '005f55e2928c64f0000000001';
const B2_SECRET_KEY = process.env.B2_SECRET_KEY || 'K005hcUWnse5QGvejFWTgegbDRKjaD0';
const B2_BUCKET = process.env.B2_BUCKET || 'flixonvideos';

const CONCURRENCY = parseInt(process.env.CONCURRENCY || '6', 10); // 6 parallel transfers for 1Gbps cloud link

// 1. Configure Cloudflare R2 Client (Source)
const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY,
    secretAccessKey: R2_SECRET_KEY,
  },
  forcePathStyle: true,
});

// 2. Configure Backblaze B2 Client (Destination)
const b2 = new S3Client({
  region: B2_REGION,
  endpoint: B2_ENDPOINT,
  credentials: {
    accessKeyId: B2_ACCESS_KEY,
    secretAccessKey: B2_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function listAllObjects(client, bucket) {
  let isTruncated = true;
  let continuationToken = undefined;
  const objects = new Map(); // key -> size

  while (isTruncated) {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    );

    if (res.Contents) {
      for (const item of res.Contents) {
        objects.set(item.Key, item.Size);
      }
    }

    isTruncated = res.IsTruncated;
    continuationToken = res.NextContinuationToken;
  }

  return objects;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function transferFile(key, size, workerId) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const getRes = await r2.send(
        new GetObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
        })
      );

      const upload = new Upload({
        client: b2,
        params: {
          Bucket: B2_BUCKET,
          Key: key,
          Body: getRes.Body,
          ContentType: getRes.ContentType || 'video/mp4',
        },
        queueSize: 4,
        partSize: 10 * 1024 * 1024, // 10MB chunk
      });

      await upload.done();
      return { success: true };
    } catch (err) {
      if (attempts >= maxAttempts) {
        return { success: false, error: err.message };
      }
      console.warn(`[W${workerId}] ⚠️ Retry ${attempts}/${maxAttempts} on ${key}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
}

async function run() {
  console.log('========================================================================');
  console.log('🚀 FLIXON CLOUD-TO-CLOUD STORAGE MIGRATION: R2 -> BACKBLAZE B2');
  console.log('========================================================================');
  console.log(`Source:      Cloudflare R2 [Bucket: ${R2_BUCKET}]`);
  console.log(`Destination: Backblaze B2  [Bucket: ${B2_BUCKET}]`);
  console.log(`Concurrency: ${CONCURRENCY} parallel streams on 1,000 Mbps Cloud Network`);
  console.log('========================================================================\n');

  console.log('🔍 [1/3] Scanning Cloudflare R2 bucket for all files...');
  const r2Objects = await listAllObjects(r2, R2_BUCKET);
  console.log(`   Found ${r2Objects.size} total items in Cloudflare R2.`);

  console.log('\n🔍 [2/3] Scanning Backblaze B2 bucket for existing files...');
  const b2Objects = await listAllObjects(b2, B2_BUCKET);
  console.log(`   Found ${b2Objects.size} already in Backblaze B2.`);

  // Filter out files that already exist in B2 with matching size
  const pending = [];
  let alreadyTransferredBytes = 0;
  let remainingBytes = 0;

  for (const [key, size] of r2Objects.entries()) {
    if (b2Objects.has(key) && b2Objects.get(key) === size) {
      alreadyTransferredBytes += size;
    } else {
      pending.push({ key, size });
      remainingBytes += size;
    }
  }

  const totalBytes = alreadyTransferredBytes + remainingBytes;
  const alreadyCount = r2Objects.size - pending.length;
  const initialPercent = totalBytes > 0 ? ((alreadyTransferredBytes / totalBytes) * 100).toFixed(1) : 0;

  console.log(`\n📊 MIGRATION PLAN:`);
  console.log(`   • Total Items:       ${r2Objects.size} files (${formatBytes(totalBytes)})`);
  console.log(`   • Already in B2:     ${alreadyCount} files (${formatBytes(alreadyTransferredBytes)}) [${initialPercent}%]`);
  console.log(`   • Pending Transfer:  ${pending.length} files (${formatBytes(remainingBytes)})\n`);

  if (pending.length === 0) {
    console.log('🎉 100% COMPLETE! All files are already migrated to Backblaze B2.');
    return;
  }

  console.log(`🚀 [3/3] Transferring ${pending.length} files across ${CONCURRENCY} workers...\n`);

  let completedCount = alreadyCount;
  let completedBytes = alreadyTransferredBytes;
  const startTime = Date.now();
  const errors = [];
  let currentIndex = 0;

  async function worker(workerId) {
    while (currentIndex < pending.length) {
      const itemIndex = currentIndex++;
      const item = pending[itemIndex];

      console.log(`[W${workerId}] ⏳ (${completedCount + 1}/${r2Objects.size}) Starting: ${item.key} [${formatBytes(item.size)}]`);
      const fileStart = Date.now();

      const result = await transferFile(item.key, item.size, workerId);

      if (result.success) {
        completedCount++;
        completedBytes += item.size;
        const durationSec = Math.max(0.1, (Date.now() - fileStart) / 1000);
        const speedMBps = (item.size / (1024 * 1024) / durationSec).toFixed(1);
        const elapsedMin = ((Date.now() - startTime) / 60000).toFixed(1);
        const percent = ((completedBytes / totalBytes) * 100).toFixed(1);

        console.log(`[W${workerId}] ✅ Done: ${item.key} (${durationSec.toFixed(1)}s @ ${speedMBps} MB/s) | Total: ${completedCount}/${r2Objects.size} (${percent}%) [${elapsedMin}m elapsed]`);
      } else {
        console.error(`[W${workerId}] ❌ Failed: ${item.key}: ${result.error}`);
        errors.push({ key: item.key, error: result.error });
      }
    }
  }

  const workers = [];
  for (let i = 1; i <= CONCURRENCY; i++) {
    workers.push(worker(i));
  }

  await Promise.all(workers);

  const totalMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log('\n========================================================================');
  console.log(`🎉 CLOUD MIGRATION COMPLETED in ${totalMin} minutes!`);
  console.log(`   Transferred: ${completedCount} / ${r2Objects.size} files`);
  console.log(`   Total Volume: ${formatBytes(completedBytes)} / ${formatBytes(totalBytes)}`);
  if (errors.length > 0) {
    console.warn(`   ⚠️ Warning: ${errors.length} file(s) had errors. Re-run to retry them.`);
  } else {
    console.log('   ✅ 100% SUCCESS with zero errors!');
  }
  console.log('========================================================================');
}

run().catch((err) => {
  console.error('Fatal Migration Error:', err);
  process.exit(1);
});
