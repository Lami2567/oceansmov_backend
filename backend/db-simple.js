const { Pool } = require('pg');
require('dotenv').config();

console.log('Database URL found:', process.env.DATABASE_URL ? 'Yes' : 'No');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Parse the connection string
const url = new URL(process.env.DATABASE_URL);
const hostname = url.hostname;
const port = url.port || 5432;
const database = url.pathname.slice(1);
const username = url.username;
const password = url.password;

console.log('Connecting to:', hostname, 'Port:', port, 'Database:', database);

// Try different connection strategies
async function createConnection() {
  const strategies = [
    {
      name: 'Direct IPv4 with explicit IP',
      config: async () => {
        const dns = require('dns');
        const addresses = await new Promise((resolve, reject) => {
          dns.lookup(hostname, { family: 4 }, (err, address, family) => {
            if (err) reject(err);
            else resolve({ address, family });
          });
        });
        
        return {
          host: addresses.address,
          port: port,
          database: database,
          user: username,
          password: password,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 30000
        };
      }
    },
    {
      name: 'Connection string with sslmode=no-verify',
      config: () => ({
        connectionString: process.env.DATABASE_URL + '&sslmode=no-verify',
        ssl: false,
        connectionTimeoutMillis: 30000
      })
    },
    {
      name: 'Connection string with sslmode=require',
      config: () => ({
        connectionString: process.env.DATABASE_URL + '&sslmode=require',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      })
    },
    {
      name: 'Original connection string',
      config: () => ({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      })
    },
    {
      name: 'Connection string with sslmode=prefer',
      config: () => ({
        connectionString: process.env.DATABASE_URL + '&sslmode=prefer',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      })
    },
    {
      name: 'Connection string with sslmode=allow',
      config: () => ({
        connectionString: process.env.DATABASE_URL + '&sslmode=allow',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      })
    },
    {
      name: 'Connection string with sslmode=disable',
      config: () => ({
        connectionString: process.env.DATABASE_URL + '&sslmode=disable',
        ssl: false,
        connectionTimeoutMillis: 30000
      })
    }
  ];

  for (const strategy of strategies) {
    try {
      console.log(`\nTrying strategy: ${strategy.name}`);
      const config = await strategy.config();
      console.log('Config:', JSON.stringify(config, (key, value) => 
        key === 'password' ? '***' : value
      ));
      
      const pool = new Pool(config);
      await pool.query('SELECT 1');
      console.log(`✅ ${strategy.name} - SUCCESS!`);
      return pool;
    } catch (error) {
      console.log(`❌ ${strategy.name} - FAILED:`, error.message);
      continue;
    }
  }
  
  throw new Error('All connection strategies failed');
}

let pool;

// Initialize pool
createConnection()
  .then(createdPool => {
    pool = createdPool;
    console.log('Database connection established successfully');
  })
  .catch(error => {
    console.error('Failed to create database connection:', error);
    process.exit(1);
  });

// Export functions
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