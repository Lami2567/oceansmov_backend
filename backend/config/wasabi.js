const AWS = require('aws-sdk');

const wasabiConfig = {
  accessKeyId: process.env.WASABI_ACCESS_KEY_ID,
  secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY,
  region: process.env.WASABI_REGION,
  endpoint: process.env.WASABI_ENDPOINT,
  s3ForcePathStyle: true
};

const s3 = new AWS.S3(wasabiConfig);

module.exports = { s3, wasabiConfig }; 