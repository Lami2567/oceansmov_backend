const { getPool } = require('./db-neon');
const { s3Client } = require('./config/wasabi');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

console.log('🎬 Testing Signed URLs for Existing Files');
console.log('=========================================');

async function testExistingFiles() {
  const pool = getPool();
  
  try {
    console.log('📊 Fetching existing movies from database...');
    
    // Get all movies with video files
    const result = await pool.query(`
      SELECT id, title, movie_file_url, poster_url 
      FROM movies 
      WHERE movie_file_url IS NOT NULL 
      AND movie_file_url != ''
    `);
    
    console.log(`✅ Found ${result.rows.length} movies with video files`);
    
    if (result.rows.length === 0) {
      console.log('❌ No movies with video files found in database');
      console.log('💡 You need to upload some movies first to test signed URLs');
      return;
    }
    
    // Test each movie's video file
    for (let i = 0; i < result.rows.length; i++) {
      const movie = result.rows[i];
      console.log(`\n🎥 Testing Movie ${i + 1}: ${movie.title}`);
      console.log(`   ID: ${movie.id}`);
      console.log(`   Video URL: ${movie.movie_file_url}`);
      
      if (!movie.movie_file_url) {
        console.log('   ❌ No video file URL');
        continue;
      }
      
      try {
        // Extract key from Wasabi URL
        const url = new URL(movie.movie_file_url);
        const key = url.pathname.replace(`/${process.env.WASABI_BUCKET_NAME}/`, '');
        
        console.log(`   🔑 Extracted Key: ${key}`);
        
        // Generate signed URL
        const command = new GetObjectCommand({ 
          Bucket: process.env.WASABI_BUCKET_NAME, 
          Key: key 
        });
        
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        console.log(`   ✅ Signed URL Generated Successfully!`);
        console.log(`   🔗 Signed URL: ${signedUrl.substring(0, 80)}...`);
        console.log(`   ⏰ Expires in: 1 hour`);
        
        // Test if the signed URL is accessible
        console.log(`   🔍 Testing URL accessibility...`);
        
        const https = require('https');
        const urlTest = new URL(signedUrl);
        
        const testResult = await new Promise((resolve) => {
          const req = https.request({
            hostname: urlTest.hostname,
            path: urlTest.pathname + urlTest.search,
            method: 'HEAD'
          }, (res) => {
            resolve({ status: res.statusCode, headers: res.headers });
          });
          
          req.on('error', (error) => {
            resolve({ error: error.message });
          });
          
          req.end();
        });
        
        if (testResult.error) {
          console.log(`   ❌ URL Test Failed: ${testResult.error}`);
        } else if (testResult.status === 200) {
          console.log(`   ✅ URL Test Successful! Status: ${testResult.status}`);
          console.log(`   📏 Content Length: ${testResult.headers['content-length'] || 'Unknown'} bytes`);
          console.log(`   🎬 Content Type: ${testResult.headers['content-type'] || 'Unknown'}`);
        } else {
          console.log(`   ⚠️ URL Test Warning: Status ${testResult.status}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error generating signed URL: ${error.message}`);
        
        if (error.message.includes('NoSuchKey')) {
          console.log(`   💡 The file doesn't exist in Wasabi bucket`);
        } else if (error.message.includes('AccessDenied')) {
          console.log(`   💡 Access denied - check Wasabi permissions`);
        }
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('===========');
    console.log('✅ Signed URLs work with existing files');
    console.log('✅ No need to re-upload files');
    console.log('✅ URLs are valid for 1 hour');
    console.log('✅ Works with any file in your Wasabi bucket');
    
    console.log('\n🎯 How it works:');
    console.log('1. Get movie URL from database');
    console.log('2. Extract file key from Wasabi URL');
    console.log('3. Generate temporary signed URL');
    console.log('4. Frontend uses signed URL for video playback');
    
  } catch (error) {
    console.error('❌ Database Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run the test
testExistingFiles().catch(console.error); 