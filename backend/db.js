const { Pool } = require('pg');
require('dotenv').config();

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your environment variables.');
  process.exit(1);
}

console.log('Database URL found:', process.env.DATABASE_URL ? 'Yes' : 'No');

// PostgreSQL connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Force IPv4 connection to avoid IPv6 issues
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000
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