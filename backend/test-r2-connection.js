const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

// Test R2 connection and upload functionality
async function testR2Connection() {
  console.log('🧪 Testing R2 Connection and Upload');
  console.log('====================================');
  
  try {
    // Check environment variables
    console.log('🔍 Environment Variables Check:');
    console.log('- CLOUDFLARE_R2_ENDPOINT:', process.env.CLOUDFLARE_R2_ENDPOINT ? '✅ Set' : '❌ Not Set');
    console.log('- CLOUDFLARE_R2_BUCKET_NAME:', process.env.CLOUDFLARE_R2_BUCKET_NAME ? '✅ Set' : '❌ Not Set');
    console.log('- CLOUDFLARE_R2_ACCESS_KEY_ID:', process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ? '✅ Set' : '❌ Not Set');
    console.log('- CLOUDFLARE_R2_SECRET_ACCESS_KEY:', process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Not Set');
    console.log('- CLOUDFLARE_R2_PUBLIC_URL:', process.env.CLOUDFLARE_R2_PUBLIC_URL ? '✅ Set' : '❌ Not Set');
    
    if (!process.env.CLOUDFLARE_R2_ENDPOINT || !process.env.CLOUDFLARE_R2_BUCKET_NAME || 
        !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
      console.log('❌ Missing required environment variables');
      return;
    }
    
    // Create R2 client
    const r2Client = new S3Client({
      region: 'auto',
      endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
      }
    });
    
    console.log('🔗 R2 Client created successfully');
    
    // Test bucket access
    console.log('\n📦 Testing bucket access...');
    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        MaxKeys: 1
      });
      
      const listResult = await r2Client.send(listCommand);
      console.log('✅ Bucket access successful');
      console.log('📊 Bucket contains objects:', listResult.KeyCount || 0);
    } catch (error) {
      console.log('❌ Bucket access failed:', error.message);
      console.log('🔍 Error details:', error);
      return;
    }
    
    // Test file upload
    console.log('\n📤 Testing file upload...');
    try {
      const testContent = 'Hello R2! This is a test file.';
      const testKey = `test-${Date.now()}.txt`;
      
      const uploadCommand = new PutObjectCommand({
        Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
        ACL: 'public-read'
      });
      
      await r2Client.send(uploadCommand);
      console.log('✅ File upload successful');
      console.log('🔗 Test file key:', testKey);
      
      // Generate public URL
      const publicUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${testKey}`;
      console.log('🌐 Public URL:', publicUrl);
      
    } catch (error) {
      console.log('❌ File upload failed:', error.message);
      console.log('🔍 Error details:', error);
      return;
    }
    
    console.log('\n🎉 R2 connection and upload test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Full error:', error);
  }
}

// Run the test
testR2Connection().catch(console.error); 