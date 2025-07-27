const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateMovieUrls() {
  try {
    console.log('Updating movie file URLs...');
    
    // Update existing movie file URLs from /movies/ to /movie-files/
    const result = await pool.query(`
      UPDATE movies 
      SET movie_file_url = REPLACE(movie_file_url, '/movies/', '/movie-files/')
      WHERE movie_file_url LIKE '/movies/%'
    `);
    
    console.log(`Updated ${result.rowCount} movie file URLs`);
    
    // Show the updated records
    const movies = await pool.query('SELECT id, title, movie_file_url FROM movies WHERE movie_file_url IS NOT NULL');
    console.log('Updated movie URLs:');
    movies.rows.forEach(movie => {
      console.log(`ID: ${movie.id}, Title: ${movie.title}, URL: ${movie.movie_file_url}`);
    });
    
  } catch (error) {
    console.error('Error updating movie URLs:', error);
  } finally {
    await pool.end();
  }
}

updateMovieUrls(); 