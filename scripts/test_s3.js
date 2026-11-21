const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: 'ap-southeast-1',
  endpoint: 'https://br-broad-cherry-bihvh46n.storage.c-5.ap-southeast-1.aws.neon.tech',
  credentials: {
    accessKeyId: 'nak_live_bd68d9ce37564d7ca59ebb9eebfa98da',
    secretAccessKey: 'nsk_live_dab86101b50ea218b16f18c64e87ed877dd1269148ba25fb046e29077c3ea547'
  },
  forcePathStyle: true
});

async function run() {
  console.log('Testing Neon Object Storage (S3)...');
  const bucket = 'uploads';
  const key = 'test-connection.txt';
  const body = 'GradeCraft S3 storage active: ' + new Date().toISOString();

  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: 'text/plain'
  }));
  console.log('Successfully uploaded test object to Neon S3 bucket:', bucket);

  const list = await client.send(new ListObjectsV2Command({ Bucket: bucket }));
  console.log('Objects in bucket:', (list.Contents || []).map(o => o.Key));
}

run().catch(console.error);
