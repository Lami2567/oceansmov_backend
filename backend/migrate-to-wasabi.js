const { s3 } = require('./config/wasabi');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function migrateToWasabi() {
  try {
    console.log('Starting migration to Wasabi...');
    
    // Get all movies with local file URLs
    const result = await pool.query(`
      SELECT id, title, poster_url, movie_file_url 
      FROM movies 
      WHERE poster_url LIKE '/%' OR movie_file_url LIKE '/%'
    `);
    
    console.log(`Found ${result.rows.length} movies to migrate`);
    
    for (const movie of result.rows) {
      console.log(`\nProcessing movie: ${movie.title}`);
      
      // Migrate poster
      if (movie.poster_url && movie.poster_url.startsWith('/')) {
        try {
          const posterPath = path.join(__dirname, 'public', movie.poster_url);
          if (fs.existsSync(posterPath)) {
            const fileBuffer = fs.readFileSync(posterPath);
            const key = `posters/${movie.id}_${Date.now()}_${path.basename(movie.poster_url)}`;
            
            await s3.upload({
              Bucket: process.env.WASABI_BUCKET_NAME,
              Key: key,
              Body: fileBuffer,
              ContentType: 'image/jpeg',
              ACL: 'public-read'
            }).promise();
            
            const wasabiUrl = `https://${process.env.WASABI_BUCKET_NAME}.s3.${process.env.WASABI_REGION}.wasabisys.com/${key}`;
            
            await pool.query(
              'UPDATE movies SET poster_url = $1 WHERE id = $2',
              [wasabiUrl, movie.id]
            );
            
            console.log(`✅ Migrated poster: ${movie.poster_url} → ${wasabiUrl}`);
          }
        } catch (err) {
          console.error(`❌ Failed to migrate poster for movie ${movie.id}:`, err.message);
        }
      }
      
      // Migrate movie file
      if (movie.movie_file_url && movie.movie_file_url.startsWith('/')) {
        try {
          const moviePath = path.join(__dirname, 'public', movie.movie_file_url);
          if (fs.existsSync(moviePath)) {
            console.log(`📁 Uploading large movie file: ${path.basename(movie.movie_file_url)}`);
            
            const key = `movies/${movie.id}_${Date.now()}_${path.basename(movie.movie_file_url)}`;
            
            await s3.upload({
              Bucket: process.env.WASABI_BUCKET_NAME,
              Key: key,
              Body: fs.createReadStream(moviePath),
              ContentType: 'video/mp4',
              ACL: 'public-read'
            }).promise();
            
            const wasabiUrl = `https://${process.env.WASABI_BUCKET_NAME}.s3.${process.env.WASABI_REGION}.wasabisys.com/${key}`;
            
            await pool.query(
              'UPDATE movies SET movie_file_url = $1 WHERE id = $2',
              [wasabiUrl, movie.id]
            );
            
            console.log(`✅ Migrated movie: ${movie.movie_file_url} → ${wasabiUrl}`);
          }
        } catch (err) {
          console.error(`❌ Failed to migrate movie file for movie ${movie.id}:`, err.message);
        }
      }
    }
    
    console.log('\n🎉 Migration completed!');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateToWasabi(); 