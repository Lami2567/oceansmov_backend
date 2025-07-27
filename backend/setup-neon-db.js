const { Pool } = require('pg');
require('dotenv').config();

console.log('🗄️  Setting up Neon database tables...');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  process.exit(1);
}

async function setupDatabase() {
  let pool;
  
  try {
    // Create connection pool
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    console.log('🔗 Connecting to Neon database...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to Neon successfully!');

    // Create users table
    console.log('👥 Creating users table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created!');

    // Create movies table
    console.log('🎬 Creating movies table...');
    await pool.query(`
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
    console.log('✅ Movies table created!');

    // Create reviews table
    console.log('💬 Creating reviews table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        approved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Reviews table created!');

    // Create admin user
    console.log('👑 Creating admin user...');
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await pool.query(`
      INSERT INTO users (username, password, is_admin) 
      VALUES ('admin', $1, true) 
      ON CONFLICT (username) DO NOTHING
    `, [hashedPassword]);
    console.log('✅ Admin user created! (username: admin, password: admin123)');

    // Add some sample movies
    console.log('🎭 Adding sample movies...');
    await pool.query(`
      INSERT INTO movies (title, description, release_year, genre) VALUES
      ('The Matrix', 'A computer hacker learns from mysterious rebels about the true nature of his reality.', 1999, 'Sci-Fi'),
      ('Inception', 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 2010, 'Sci-Fi'),
      ('The Dark Knight', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 2008, 'Action')
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Sample movies added!');

    console.log('\n🎉 Database setup completed successfully!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - movies');
    console.log('   - reviews');
    console.log('\n👤 Admin credentials:');
    console.log('   - Username: admin');
    console.log('   - Password: admin123');

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('🔍 Error details:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run setup
setupDatabase(); 