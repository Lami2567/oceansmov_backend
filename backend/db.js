const { Pool } = require('pg');
require('dotenv').config();

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your environment variables.');
  process.exit(1);
}

console.log('Database URL found:', process.env.DATABASE_URL ? 'Yes' : 'No');

// PostgreSQL connection configuration for Supabase pooler
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Connection settings optimized for pooler
  connectionTimeoutMillis: 60000,
  idleTimeoutMillis: 30000,
  max: 10, // Lower max connections for pooler
  min: 1,
  // Pooler-specific settings
  application_name: 'movie-web-backend',
  // Keep connections alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Test the connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
    console.error('Please check your DATABASE_URL and database connection.');
  } else {
    console.log('Connected to PostgreSQL database successfully');
  }
});

module.exports = pool; 