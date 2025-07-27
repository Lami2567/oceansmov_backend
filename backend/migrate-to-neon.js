const { Pool } = require('pg');
require('dotenv').config();

console.log('🔄 Supabase to Neon Migration Script');

// You'll need both connection strings
const SUPABASE_URL = process.env.SUPABASE_URL; // Old Supabase connection
const NEON_URL = process.env.DATABASE_URL; // New Neon connection

if (!SUPABASE_URL || !NEON_URL) {
  console.error('❌ Please set both SUPABASE_URL and DATABASE_URL environment variables');
  console.error('SUPABASE_URL: Your old Supabase connection string');
  console.error('DATABASE_URL: Your new Neon connection string');
  process.exit(1);
}

async function migrateData() {
  let sourcePool, targetPool;
  
  try {
    console.log('🔗 Connecting to Supabase (source)...');
    sourcePool = new Pool({
      connectionString: SUPABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('🔗 Connecting to Neon (target)...');
    targetPool = new Pool({
      connectionString: NEON_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    // Test connections
    await sourcePool.query('SELECT 1');
    await targetPool.query('SELECT 1');
    console.log('✅ Both connections successful!');
    
    // Create tables in Neon (if they don't exist)
    console.log('📋 Creating tables in Neon...');
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        release_year INTEGER,
        genre VARCHAR(100),
        poster_url TEXT,
        movie_file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await targetPool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        movie_id INTEGER REFERENCES movies(id),
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('✅ Tables created in Neon');
    
    // Migrate users
    console.log('👥 Migrating users...');
    const users = await sourcePool.query('SELECT * FROM users');
    if (users.rows.length > 0) {
      for (const user of users.rows) {
        await targetPool.query(
          'INSERT INTO users (id, username, password, is_admin, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
          [user.id, user.username, user.password, user.is_admin, user.created_at, user.updated_at]
        );
      }
      console.log(`✅ Migrated ${users.rows.length} users`);
    }
    
    // Migrate movies
    console.log('🎬 Migrating movies...');
    const movies = await sourcePool.query('SELECT * FROM movies');
    if (movies.rows.length > 0) {
      for (const movie of movies.rows) {
        await targetPool.query(
          'INSERT INTO movies (id, title, description, release_year, genre, poster_url, movie_file_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
          [movie.id, movie.title, movie.description, movie.release_year, movie.genre, movie.poster_url, movie.movie_file_url, movie.created_at, movie.updated_at]
        );
      }
      console.log(`✅ Migrated ${movies.rows.length} movies`);
    }
    
    // Migrate reviews
    console.log('💬 Migrating reviews...');
    const reviews = await sourcePool.query('SELECT * FROM reviews');
    if (reviews.rows.length > 0) {
      for (const review of reviews.rows) {
        await targetPool.query(
          'INSERT INTO reviews (id, user_id, movie_id, rating, comment, approved, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO NOTHING',
          [review.id, review.user_id, review.movie_id, review.rating, review.comment, review.approved, review.created_at, review.updated_at]
        );
      }
      console.log(`✅ Migrated ${reviews.rows.length} reviews`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${users.rows.length}`);
    console.log(`   - Movies: ${movies.rows.length}`);
    console.log(`   - Reviews: ${reviews.rows.length}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    if (sourcePool) await sourcePool.end();
    if (targetPool) await targetPool.end();
  }
}

// Run migration
migrateData(); 