require('dotenv').config({ path: '.env.local' });
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function test() {
  const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_ID;
  const accessKey = process.env.CLOUDFLARE_ACCESS_KEY_ID;
  const secretKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;
  const bucketName = 'flixon';

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  });

  console.log('Listing objects in R2...');
  try {
    const cmd = new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 10 });
    const res = await s3.send(cmd);
    console.log(res.Contents.map(c => ({ Key: c.Key, Size: c.Size })));
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
