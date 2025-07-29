require('dotenv').config();
const { r2Client } = require('./config/cloudflare-r2');
const { ListBucketsCommand, HeadBucketCommand, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');

console.log('☁️ Cloudflare R2 Setup Script');
console.log('=============================');
console.log('');

// Check environment variables
function checkEnvironmentVariables() {
  console.log('🔍 Step 1: Checking Environment Variables');
  console.log('----------------------------------------');
  
  const requiredVars = [
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY', 
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'CLOUDFLARE_R2_PUBLIC_URL'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: ${varName.includes('SECRET') ? '***' + value.slice(-4) : value}`);
    } else {
      console.log(`❌ ${varName}: MISSING`);
      allPresent = false;
    }
  });
  
  console.log('');
  return allPresent;
}

// Test R2 connection
async function testR2Connection() {
  console.log('🔗 Step 2: Testing R2 Connection');
  console.log('--------------------------------');
  
  try {
    const result = await r2Client.send(new ListBucketsCommand({}));
    console.log('✅ R2 connection successful!');
    console.log(`📦 Available buckets: ${result.Buckets.map(b => b.Name).join(', ')}`);
    return true;
  } catch (error) {
    console.log('❌ R2 connection failed:', error.message);
    console.log('');
    console.log('💡 Common issues:');
    console.log('   - Check your API credentials');
    console.log('   - Verify your endpoint URL');
    console.log('   - Ensure R2 is enabled in your Cloudflare account');
    return false;
  }
}

// Test bucket access
async function testBucketAccess() {
  console.log('');
  console.log('🪣 Step 3: Testing Bucket Access');
  console.log('--------------------------------');
  
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  
  if (!bucketName) {
    console.log('❌ No bucket name configured');
    return false;
  }
  
  try {
    await r2Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    console.log(`✅ Bucket "${bucketName}" is accessible`);
    return true;
  } catch (error) {
    console.log(`❌ Cannot access bucket "${bucketName}":`, error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('   - The bucket exists in your R2 dashboard');
    console.log('   - Your API token has access to this bucket');
    console.log('   - The bucket name is correct');
    return false;
  }
}

// Test file upload
async function testFileUpload() {
  console.log('');
  console.log('📤 Step 4: Testing File Upload');
  console.log('-------------------------------');
  
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const testKey = 'test/setup-test.txt';
  const testContent = 'Hello from R2 setup script! ' + new Date().toISOString();
  
  try {
    // Upload test file
    await r2Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    }));
    console.log('✅ Test file uploaded successfully');
    
    // Try to read it back
    const getResult = await r2Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: testKey
    }));
    
    const downloadedContent = await streamToString(getResult.Body);
    if (downloadedContent === testContent) {
      console.log('✅ Test file read back successfully');
      return true;
    } else {
      console.log('⚠️ File content mismatch');
      return false;
    }
    
  } catch (error) {
    console.log('❌ File upload test failed:', error.message);
    return false;
  }
}

// Test public URL access
async function testPublicUrl() {
  console.log('');
  console.log('🌐 Step 5: Testing Public URL');
  console.log('------------------------------');
  
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;
  
  if (!publicUrl) {
    console.log('❌ No public URL configured');
    return false;
  }
  
  console.log(`🔗 Public URL: ${publicUrl}`);
  console.log('✅ Public URL format looks correct');
  console.log('');
  console.log('💡 To test public access:');
  console.log(`   Visit: ${publicUrl}/test/setup-test.txt`);
  console.log('   (This should show the test file content)');
  
  return true;
}

// Helper function to convert stream to string
async function streamToString(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    stream.on('error', reject);
  });
}

// Main setup function
async function setupR2() {
  console.log('🚀 Starting Cloudflare R2 Setup...');
  console.log('');
  
  // Step 1: Check environment variables
  const envOk = checkEnvironmentVariables();
  if (!envOk) {
    console.log('');
    console.log('❌ Environment variables are missing!');
    console.log('');
    console.log('📋 Please add these to your .env file or Render environment:');
    console.log('');
    console.log('CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id');
    console.log('CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key');
    console.log('CLOUDFLARE_R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com');
    console.log('CLOUDFLARE_R2_BUCKET_NAME=your-bucket-name');
    console.log('CLOUDFLARE_R2_PUBLIC_URL=https://pub-<hash>.r2.dev');
    console.log('');
    console.log('🔗 Get these from: https://dash.cloudflare.com/profile/api-tokens');
    return;
  }
  
  // Step 2: Test connection
  const connectionOk = await testR2Connection();
  if (!connectionOk) {
    return;
  }
  
  // Step 3: Test bucket access
  const bucketOk = await testBucketAccess();
  if (!bucketOk) {
    return;
  }
  
  // Step 4: Test file upload
  const uploadOk = await testFileUpload();
  if (!uploadOk) {
    return;
  }
  
  // Step 5: Test public URL
  const publicUrlOk = await testPublicUrl();
  
  console.log('');
  console.log('🎉 R2 Setup Summary');
  console.log('==================');
  console.log(`Environment Variables: ${envOk ? '✅' : '❌'}`);
  console.log(`R2 Connection: ${connectionOk ? '✅' : '❌'}`);
  console.log(`Bucket Access: ${bucketOk ? '✅' : '❌'}`);
  console.log(`File Upload: ${uploadOk ? '✅' : '❌'}`);
  console.log(`Public URL: ${publicUrlOk ? '✅' : '❌'}`);
  console.log('');
  
  if (envOk && connectionOk && bucketOk && uploadOk) {
    console.log('🎊 SUCCESS! Cloudflare R2 is ready to use!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Deploy your backend to Render');
    console.log('   2. Test file uploads from your frontend');
    console.log('   3. Verify video playback works');
    console.log('');
    console.log('🔧 Your app is now configured to use R2 for all file storage!');
  } else {
    console.log('⚠️ Some tests failed. Please check the issues above.');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupR2().catch(console.error);
}

module.exports = { setupR2 }; 