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
  ssl: {
    rejectUnauthorized: false
  },
  // Connection settings
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 20,
  // Authentication settings
  password: process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL).password : undefined
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