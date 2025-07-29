const { S3Client } = require('@aws-sdk/client-s3');

const cloudflareR2Config = {
  region: 'auto', // Cloudflare R2 uses 'auto' region
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT, // https://<account-id>.r2.cloudflarestorage.com
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  }
};

const r2Client = new S3Client(cloudflareR2Config);

module.exports = { r2Client, cloudflareR2Config }; 