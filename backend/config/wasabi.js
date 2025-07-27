const { S3Client } = require('@aws-sdk/client-s3');

const wasabiConfig = {
  region: process.env.WASABI_REGION,
  endpoint: process.env.WASABI_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
  }
};

const s3Client = new S3Client(wasabiConfig);

module.exports = { s3Client, wasabiConfig }; 