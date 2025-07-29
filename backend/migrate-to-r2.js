const { s3Client: wasabiClient } = require('./config/wasabi');
const { r2Client } = require('./config/cloudflare-r2');
const { getPool } = require('./db-neon');
const { ListObjectsV2Command, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

async function migrateToR2() {
  console.log('🚀 Starting Migration from Wasabi to Cloudflare R2');
  console.log('='.repeat(60));
  
  try {
    const pool = getPool();
    
    // Get all movies with files
    const moviesResult = await pool.query(`
      SELECT id, title, poster_url, movie_file_url 
      FROM movies 
      WHERE poster_url IS NOT NULL OR movie_file_url IS NOT NULL
      ORDER BY created_at DESC
    `);
    
    console.log(`📋 Found ${moviesResult.rows.length} movies to migrate`);
    console.log('');
    
    for (const movie of moviesResult.rows) {
      console.log(`🎬 Migrating: ${movie.title}`);
      
      // Migrate poster
      if (movie.poster_url && movie.poster_url.includes('wasabisys.com')) {
        await migrateFile(movie.poster_url, 'posters', movie.id, pool, 'poster_url');
      }
      
      // Migrate movie file
      if (movie.movie_file_url && movie.movie_file_url.includes('wasabisys.com')) {
        await migrateFile(movie.movie_file_url, 'movies', movie.id, pool, 'movie_file_url');
      }
      
      console.log('');
    }
    
    console.log('✅ Migration completed successfully!');
    await pool.end();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  }
}

async function migrateFile(fileUrl, folder, movieId, pool, field) {
  try {
    console.log(`  📁 Migrating ${field}: ${fileUrl}`);
    
    // Extract key from Wasabi URL
    const url = new URL(fileUrl);
    const wasabiKey = url.pathname.replace(`/${process.env.WASABI_BUCKET_NAME}/`, '');
    
    // Download from Wasabi
    const getCommand = new GetObjectCommand({
      Bucket: process.env.WASABI_BUCKET_NAME,
      Key: wasabiKey
    });
    
    const wasabiResponse = await wasabiClient.send(getCommand);
    const fileBuffer = await streamToBuffer(wasabiResponse.Body);
    
    // Generate new key for R2
    const fileName = wasabiKey.split('/').pop();
    const r2Key = `${folder}/${movieId}_${Date.now()}_${fileName}`;
    
    // Upload to R2
    const putCommand = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: wasabiResponse.ContentType,
      ACL: 'public-read'
    });
    
    await r2Client.send(putCommand);
    
    // Generate new R2 URL
    const newUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${r2Key}`;
    
    // Update database
    await pool.query(
      `UPDATE movies SET ${field} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [newUrl, movieId]
    );
    
    console.log(`  ✅ Migrated to: ${newUrl}`);
    
  } catch (error) {
    console.error(`  ❌ Failed to migrate ${field}:`, error.message);
  }
}

async function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// Test R2 connection
async function testR2Connection() {
  console.log('🧪 Testing Cloudflare R2 Connection');
  console.log('='.repeat(50));
  
  try {
    const { ListBucketsCommand } = require('@aws-sdk/client-s3');
    const result = await r2Client.send(new ListBucketsCommand({}));
    
    console.log('✅ R2 connection successful!');
    console.log('📦 Available buckets:', result.Buckets.map(b => b.Name));
    
    if (process.env.CLOUDFLARE_R2_BUCKET_NAME) {
      const { HeadBucketCommand } = require('@aws-sdk/client-s3');
      await r2Client.send(new HeadBucketCommand({ Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME }));
      console.log('✅ R2 bucket access confirmed!');
    }
    
  } catch (error) {
    console.log('❌ R2 connection failed:', error.message);
    console.log('\n💡 Make sure R2 environment variables are set:');
    console.log('- CLOUDFLARE_R2_ACCESS_KEY_ID');
    console.log('- CLOUDFLARE_R2_SECRET_ACCESS_KEY');
    console.log('- CLOUDFLARE_R2_ENDPOINT');
    console.log('- CLOUDFLARE_R2_BUCKET_NAME');
    console.log('- CLOUDFLARE_R2_PUBLIC_URL');
  }
}

// Export functions
module.exports = { migrateToR2, testR2Connection };

// Run test if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testR2Connection();
  } else {
    console.log('🚀 To test R2 connection: node migrate-to-r2.js --test');
    console.log('🚀 To migrate files: node migrate-to-r2.js');
  }
} 