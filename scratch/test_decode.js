const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const accountId = '8ccf9e8b6d2b8d87256960cf33144e9e';
const accessKey = '3d8358c9bcf085a042289a18aca7b38e';
const secretKey = '5d029e89336386547f487d58e2b4d81491d4fb8d4a13e46b563d621cb57efb83';
const bucketName = 'movies';

function fullyDecodeURI(str) {
  let decoded = str;
  try {
    while (decoded.includes('%')) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) break;
      decoded = next;
    }
  } catch {
    // Return last valid decoded string
  }
  return decoded;
}

async function test() {
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  });

  // Example double-encoded key from database:
  const dbPath = "1.111%2520A%2520Nice%2520Girl%2520Like%2520You%2520-%2520VJ%2520Junior.mp4";
  
  const singleDecoded = decodeURIComponent(dbPath);
  const fullyDecoded = fullyDecodeURI(dbPath);

  console.log("Single Decoded:", singleDecoded);
  console.log("Fully Decoded:  ", fullyDecoded);

  // Test single decoded
  const cmd1 = new GetObjectCommand({ Bucket: bucketName, Key: singleDecoded });
  const url1 = await getSignedUrl(s3, cmd1, { expiresIn: 900 });
  const res1 = await fetch(url1);
  console.log("Single Decoded Status:", res1.status); // Expected: 404

  // Test fully decoded
  const cmd2 = new GetObjectCommand({ Bucket: bucketName, Key: fullyDecoded });
  const url2 = await getSignedUrl(s3, cmd2, { expiresIn: 900 });
  const res2 = await fetch(url2);
  console.log("Fully Decoded Status: ", res2.status); // Expected: 200
}

test();
