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
// Create pool with IPv4 fallback strategy
let pool;

async function createPool() {
  const baseConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
      ca: undefined,
      key: undefined,
      cert: undefined,
      checkServerIdentity: () => undefined
    },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 20,
    min: 1,
    application_name: 'movie-web-backend'
  };

  // Try IPv6 first, then fallback to IPv4
  try {
    console.log('Attempting IPv6 connection...');
    pool = new Pool({
      ...baseConfig,
      family: 6, // Force IPv6
      connectionTimeoutMillis: 10000, // Shorter timeout for IPv6 test
      lookup: (hostname, options, callback) => {
        const dns = require('dns');
        dns.lookup(hostname, { family: 6, all: true }, (err, addresses) => {
          if (err) {
            callback(err);
          } else if (addresses && addresses.length > 0) {
            callback(null, addresses[0].address, addresses[0].family);
          } else {
            dns.lookup(hostname, options, callback);
          }
        });
      }
    });

    // Test the connection
    await pool.query('SELECT 1');
    console.log('✅ IPv6 connection successful');
    return pool;
  } catch (error) {
    console.log('❌ IPv6 connection failed:', error.message);
    console.log('Falling back to IPv4...');
    
    // Close the failed pool
    if (pool) {
      await pool.end();
    }

    // Try IPv4
    try {
      pool = new Pool({
        ...baseConfig,
        family: 4, // Force IPv4
        connectionTimeoutMillis: 30000
      });

      // Test the connection
      await pool.query('SELECT 1');
      console.log('✅ IPv4 connection successful');
      return pool;
    } catch (ipv4Error) {
      console.log('❌ IPv4 connection also failed:', ipv4Error.message);
      throw ipv4Error;
    }
  }
}

// Initialize pool
createPool().catch(error => {
  console.error('Failed to create database pool:', error);
  process.exit(1);
});

// Export functions that work with the pool
module.exports = {
  getPool: () => pool,
  query: async (text, params) => {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    return pool.query(text, params);
  },
  getClient: async () => {
    if (!pool) {
      throw new Error('Database pool not initialized');
    }
    return pool.connect();
  }
}; 