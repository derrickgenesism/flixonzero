const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const accountId = '8ccf9e8b6d2b8d87256960cf33144e9e';
const accessKey = '3d8358c9bcf085a042289a18aca7b38e';
const secretKey = '5d029e89336386547f487d58e2b4d81491d4fb8d4a13e46b563d621cb57efb83';
const bucketName = 'movies';

async function test() {
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });

  // Example object key from user's earlier message
  // "watch What's Your Number. translated by vj junior in luganda free - vj junior movies - translated movies.mp4"
  // Let's use exactly what was in the URL:
  const originalKey = "watch%20What's%20Your%20Number.%20translated%20by%20vj%20junior%20in%20luganda%20free%20-%20vj%20junior%20movies%20-%20translated%20movies.mp4";
  const decodedKey = decodeURIComponent(originalKey);

  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: decodedKey,
    ResponseContentDisposition: `attachment; filename="test.mp4"`,
    ResponseContentType: 'video/mp4',
  });

  const downloadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
  console.log("Generated URL:", downloadUrl);

  const response = await fetch(downloadUrl);
  console.log("Response Status:", response.status);
  
  if (!response.ok) {
    const text = await response.text();
    console.log("Error Body:", text.substring(0, 300));
  }
}

test();
