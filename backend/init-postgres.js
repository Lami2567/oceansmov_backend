const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// PostgreSQL connection
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// SQLite connection
const sqliteDb = new sqlite3.Database(path.join(__dirname, 'movie_web.db'));

async function initPostgreSQL() {
  try {
    console.log('Initializing PostgreSQL database...');
    
    // Create tables
    const createTablesSQL = `
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE
      );

      -- Movies table
      CREATE TABLE IF NOT EXISTS movies (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        release_year INT,
        genre VARCHAR(100),
        poster_url TEXT,
        movie_file_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Reviews table
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        movie_id INT REFERENCES movies(id) ON DELETE CASCADE,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        approved BOOLEAN DEFAULT FALSE
      );
    `;
    
    await pgPool.query(createTablesSQL);
    console.log('PostgreSQL tables created successfully');
    
    // Check if we need to migrate data from SQLite
    const userCount = await pgPool.query('SELECT COUNT(*) FROM users');
    if (userCount.rows[0].count === '0') {
      console.log('No users found in PostgreSQL, migrating from SQLite...');
      await migrateDataFromSQLite();
    } else {
      console.log('PostgreSQL database already has data, skipping migration');
    }
    
  } catch (error) {
    console.error('Error initializing PostgreSQL:', error);
  } finally {
    await pgPool.end();
    sqliteDb.close();
  }
}

async function migrateDataFromSQLite() {
  return new Promise((resolve, reject) => {
    console.log('Starting data migration from SQLite to PostgreSQL...');
    
    // Migrate users
    sqliteDb.all('SELECT * FROM users', async (err, users) => {
      if (err) {
        console.error('Error reading users from SQLite:', err);
        return reject(err);
      }
      
      try {
        for (const user of users) {
          await pgPool.query(
            'INSERT INTO users (id, username, password, is_admin) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
            [user.id, user.username, user.password, user.is_admin ? true : false]
          );
        }
        console.log(`Migrated ${users.length} users`);
        
        // Migrate movies
        sqliteDb.all('SELECT * FROM movies', async (err, movies) => {
          if (err) {
            console.error('Error reading movies from SQLite:', err);
            return reject(err);
          }
          
          try {
            for (const movie of movies) {
              await pgPool.query(
                'INSERT INTO movies (id, title, description, release_year, genre, poster_url, movie_file_url, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING',
                [movie.id, movie.title, movie.description, movie.release_year, movie.genre, movie.poster_url, movie.movie_file_url, movie.created_at, movie.updated_at]
              );
            }
            console.log(`Migrated ${movies.length} movies`);
            
            // Migrate reviews
            sqliteDb.all('SELECT * FROM reviews', async (err, reviews) => {
              if (err) {
                console.error('Error reading reviews from SQLite:', err);
                return reject(err);
              }
              
              try {
                for (const review of reviews) {
                  await pgPool.query(
                    'INSERT INTO reviews (id, user_id, movie_id, rating, comment, created_at, approved) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
                    [review.id, review.user_id, review.movie_id, review.rating, review.comment, review.created_at, review.approved ? true : false]
                  );
                }
                console.log(`Migrated ${reviews.length} reviews`);
                console.log('Data migration completed successfully!');
                resolve();
              } catch (error) {
                console.error('Error migrating reviews:', error);
                reject(error);
              }
            });
          } catch (error) {
            console.error('Error migrating movies:', error);
            reject(error);
          }
        });
      } catch (error) {
        console.error('Error migrating users:', error);
        reject(error);
      }
    });
  });
}

// Run the initialization
initPostgreSQL().catch(console.error); 