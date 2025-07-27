const { s3Client } = require('./config/wasabi');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function generateSignedUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: process.env.WASABI_BUCKET_NAME,
      Key: key
    });
    
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

async function testSignedUrl() {
  console.log('🔐 Testing Signed URL Generation');
  console.log('='.repeat(50));
  
  const videoKey = 'movies/3_1753655695914_Flutter Tutorial for Beginners _2 - Flutter Overview(720P_HD).mp4';
  
  console.log('📹 Video Key:', videoKey);
  console.log('');
  
  try {
    const signedUrl = await generateSignedUrl(videoKey, 3600); // 1 hour expiry
    
    if (signedUrl) {
      console.log('✅ Signed URL generated successfully!');
      console.log('🔗 URL:', signedUrl);
      console.log('⏰ Expires in: 1 hour');
      console.log('');
      console.log('💡 This URL can be used for video playback');
      console.log('📝 Add this to your video player component');
    } else {
      console.log('❌ Failed to generate signed URL');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Export for use in other files
module.exports = { generateSignedUrl };

// Run test if called directly
if (require.main === module) {
  testSignedUrl();
} 