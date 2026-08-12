const { S3Client, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

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

  try {
    const listCmd = new ListObjectsV2Command({ Bucket: bucketName, MaxKeys: 5 });
    const listRes = await s3.send(listCmd);
    console.log("Keys in bucket:");
    listRes.Contents?.forEach(c => console.log(" - ", JSON.stringify(c.Key)));
  } catch (err) {
    console.error("Error listing bucket:", err);
  }
}

test();
