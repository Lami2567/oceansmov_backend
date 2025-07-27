const { Pool } = require('pg');
require('dotenv').config();

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
  console.error('Please set DATABASE_URL in your environment variables.');
  process.exit(1);
}

console.log('Database URL found:', process.env.DATABASE_URL ? 'Yes' : 'No');

// PostgreSQL connection configuration with IPv6 support
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
    ca: undefined,
    key: undefined,
    cert: undefined,
    checkServerIdentity: () => undefined
  },
  // Connection settings with IPv6 support
  connectionTimeoutMillis: 60000, // Increased timeout for IPv6
  idleTimeoutMillis: 30000,
  max: 20,
  min: 1,
  // Application settings
  application_name: 'movie-web-backend',
  // IPv6 specific settings
  family: 6, // Force IPv6
  lookup: (hostname, options, callback) => {
    // Custom DNS lookup to prefer IPv6
    const dns = require('dns');
    dns.lookup(hostname, { family: 6, all: true }, (err, addresses) => {
      if (err) {
        callback(err);
      } else if (addresses && addresses.length > 0) {
        // Use first IPv6 address
        callback(null, addresses[0].address, addresses[0].family);
      } else {
        // Fallback to default lookup
        dns.lookup(hostname, options, callback);
      }
    });
  }
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