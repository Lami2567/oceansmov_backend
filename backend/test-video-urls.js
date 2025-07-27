const { getPool } = require('./db-neon');
require('dotenv').config();

async function testVideoUrls() {
  console.log('🎬 Testing Video URLs and Formats');
  console.log('='.repeat(50));
  
  try {
    const pool = getPool();
    
    // Get all movies with video files
    const result = await pool.query(`
      SELECT id, title, movie_file_url, poster_url 
      FROM movies 
      WHERE movie_file_url IS NOT NULL 
      ORDER BY created_at DESC
    `);
    
    if (result.rows.length === 0) {
      console.log('❌ No movies with video files found');
      return;
    }
    
    console.log(`✅ Found ${result.rows.length} movies with video files:`);
    console.log('');
    
    result.rows.forEach((movie, index) => {
      console.log(`${index + 1}. ${movie.title}`);
      console.log(`   ID: ${movie.id}`);
      console.log(`   Video URL: ${movie.movie_file_url}`);
      console.log(`   Poster URL: ${movie.poster_url}`);
      
      // Check video format
      const videoUrl = movie.movie_file_url;
      if (videoUrl) {
        const url = videoUrl.toLowerCase();
        let format = 'Unknown';
        
        if (url.includes('.mp4')) format = 'MP4';
        else if (url.includes('.webm')) format = 'WebM';
        else if (url.includes('.ogg')) format = 'OGG';
        else if (url.includes('.avi')) format = 'AVI';
        else if (url.includes('.mov')) format = 'QuickTime';
        else if (url.includes('.mkv')) format = 'MKV';
        
        console.log(`   Format: ${format}`);
        console.log(`   Supported: ${['MP4', 'WebM', 'OGG'].includes(format) ? '✅ Yes' : '❌ Limited'}`);
      }
      
      console.log('');
    });
    
    console.log('🔧 Common Video Issues and Solutions:');
    console.log('='.repeat(50));
    console.log('1. Format not supported by browser');
    console.log('   - Solution: Convert to MP4 or WebM');
    console.log('');
    console.log('2. CORS issues with video files');
    console.log('   - Solution: Ensure Wasabi bucket has proper CORS settings');
    console.log('');
    console.log('3. Video file corrupted or incomplete');
    console.log('   - Solution: Re-upload the video file');
    console.log('');
    console.log('4. Video URL is inaccessible');
    console.log('   - Solution: Check Wasabi bucket permissions');
    
    await pool.end();
    
  } catch (error) {
    console.error('❌ Error testing video URLs:', error.message);
  }
}

testVideoUrls(); 