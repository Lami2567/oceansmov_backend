const https = require('https');
const { URL } = require('url');

async function testVideoFile() {
  console.log('🎬 Testing Video File Accessibility');
  console.log('='.repeat(50));
  
  const videoUrl = 'https://s3.us-west-1.wasabisys.com/oceansmov-site-data/movies/3_1753655695914_Flutter Tutorial for Beginners _2 - Flutter Overview(720P_HD).mp4';
  
  console.log('📹 Video URL:', videoUrl);
  console.log('');
  
  try {
    const url = new URL(videoUrl);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'HEAD', // Just get headers, not the full file
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };
    
    console.log('🔍 Testing file accessibility...');
    
    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        resolve(res);
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.end();
    });
    
    console.log('✅ File is accessible!');
    console.log('📊 Response Status:', response.statusCode);
    console.log('📏 Content Length:', response.headers['content-length'] || 'Unknown');
    console.log('🎬 Content Type:', response.headers['content-type'] || 'Unknown');
    console.log('🌐 CORS Headers:', response.headers['access-control-allow-origin'] || 'Not set');
    
    if (response.statusCode === 200) {
      console.log('\n✅ Video file is accessible and should work');
      console.log('💡 If video still doesn\'t play, it might be a browser CORS issue');
    } else {
      console.log('\n❌ Video file is not accessible');
    }
    
  } catch (error) {
    console.error('❌ Error testing video file:', error.message);
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check Wasabi bucket permissions');
    console.log('2. Verify the file exists in the bucket');
    console.log('3. Configure CORS settings in Wasabi');
  }
}

testVideoFile(); 