const { s3Client } = require('./config/wasabi');

async function testWasabiForRender() {
  console.log('🧪 Testing Wasabi configuration for Render deployment...');
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('WASABI_ACCESS_KEY_ID:', process.env.WASABI_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('WASABI_SECRET_ACCESS_KEY:', process.env.WASABI_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
  console.log('WASABI_REGION:', process.env.WASABI_REGION || '❌ Missing');
  console.log('WASABI_ENDPOINT:', process.env.WASABI_ENDPOINT || '❌ Missing');
  console.log('WASABI_BUCKET_NAME:', process.env.WASABI_BUCKET_NAME || '❌ Missing');
  
  // Test connection
  try {
    const { ListBucketsCommand } = require('@aws-sdk/client-s3');
    const result = await s3Client.send(new ListBucketsCommand({}));
    console.log('\n✅ Wasabi connection successful!');
    console.log('📦 Available buckets:', result.Buckets.map(b => b.Name));
    
    // Test bucket access
    if (process.env.WASABI_BUCKET_NAME) {
      const { HeadBucketCommand } = require('@aws-sdk/client-s3');
      await s3Client.send(new HeadBucketCommand({ Bucket: process.env.WASABI_BUCKET_NAME }));
      console.log('✅ Bucket access confirmed!');
    }
    
  } catch (error) {
    console.log('\n❌ Wasabi connection failed:', error.message);
    console.log('\n🔧 To fix this:');
    console.log('1. Add Wasabi credentials to Render environment variables');
    console.log('2. Make sure your bucket exists');
    console.log('3. Check your region and endpoint settings');
  }
}

testWasabiForRender(); 