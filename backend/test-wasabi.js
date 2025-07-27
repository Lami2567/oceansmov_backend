const { s3 } = require('./config/wasabi');
require('dotenv').config();

async function testWasabiConnection() {
  try {
    console.log('Testing Wasabi connection...');
    console.log('Bucket:', process.env.WASABI_BUCKET_NAME);
    console.log('Region:', process.env.WASABI_REGION);
    console.log('Endpoint:', process.env.WASABI_ENDPOINT);
    
    // Test bucket access
    const result = await s3.listBuckets().promise();
    console.log('✅ Successfully connected to Wasabi');
    console.log('Available buckets:', result.Buckets.map(b => b.Name));
    
    // Test bucket access
    if (process.env.WASABI_BUCKET_NAME) {
      try {
        await s3.headBucket({ Bucket: process.env.WASABI_BUCKET_NAME }).promise();
        console.log('✅ Bucket access confirmed');
      } catch (err) {
        console.log('❌ Bucket access failed:', err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Wasabi connection failed:', error.message);
    console.error('Please check your environment variables:');
    console.error('- WASABI_ACCESS_KEY_ID');
    console.error('- WASABI_SECRET_ACCESS_KEY');
    console.error('- WASABI_REGION');
    console.error('- WASABI_ENDPOINT');
    console.error('- WASABI_BUCKET_NAME');
  }
}

testWasabiConnection(); 