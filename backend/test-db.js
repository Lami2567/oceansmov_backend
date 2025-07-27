const pool = require('./db');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables found:', tablesResult.rows.map(row => row.table_name));
    
    // Check if movies table has data
    const moviesResult = await client.query('SELECT COUNT(*) FROM movies');
    console.log('Movies count:', moviesResult.rows[0].count);
    
    // If no movies, add a sample movie
    if (parseInt(moviesResult.rows[0].count) === 0) {
      console.log('Adding sample movie...');
      await client.query(`
        INSERT INTO movies (title, description, release_year, genre, poster_url, movie_file_url)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'Sample Movie',
        'This is a sample movie for testing',
        2024,
        'Action',
        '/posters/sample_poster.jpg',
        '/movies/sample_movie.mp4'
      ]);
      console.log('✅ Sample movie added!');
    }
    
    // Check if users table has data
    const usersResult = await client.query('SELECT COUNT(*) FROM users');
    console.log('Users count:', usersResult.rows[0].count);
    
    client.release();
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase(); 