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

// Try to resolve the hostname to different IP addresses
async function resolveHostname() {
  const dns = require('dns');
  
  try {
    // Try to get all addresses
    const addresses = await new Promise((resolve, reject) => {
      dns.resolve4(hostname, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });
    
    console.log('Found IPv4 addresses:', addresses);
    return addresses;
  } catch (error) {
    console.log('Could not resolve IPv4 addresses:', error.message);
    return [];
  }
}

// Create connection with explicit IP
async function createConnectionWithIP(ipAddress) {
  console.log(`Trying connection with IP: ${ipAddress}`);
  
  const config = {
    host: ipAddress,
    port: port,
    database: database,
    user: username,
    password: password,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 10,
    min: 1
  };
  
  const pool = new Pool(config);
  await pool.query('SELECT 1');
  return pool;
}

// Try different connection approaches
async function createConnection() {
  // First, try to resolve the hostname
  const ipAddresses = await resolveHostname();
  
  // Try connecting with each IP address
  for (const ip of ipAddresses) {
    try {
      console.log(`\nTrying IP address: ${ip}`);
      const pool = await createConnectionWithIP(ip);
      console.log(`✅ SUCCESS with IP: ${ip}`);
      return pool;
    } catch (error) {
      console.log(`❌ FAILED with IP ${ip}:`, error.message);
      continue;
    }
  }
  
  // If no IP addresses work, try alternative approaches
  const alternativeStrategies = [
    {
      name: 'Connection string with sslmode=disable',
      config: {
        connectionString: process.env.DATABASE_URL + '&sslmode=disable',
        ssl: false,
        connectionTimeoutMillis: 30000
      }
    },
    {
      name: 'Connection string with sslmode=allow',
      config: {
        connectionString: process.env.DATABASE_URL + '&sslmode=allow',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      }
    },
    {
      name: 'Connection string with sslmode=prefer',
      config: {
        connectionString: process.env.DATABASE_URL + '&sslmode=prefer',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      }
    },
    {
      name: 'Connection string with sslmode=require',
      config: {
        connectionString: process.env.DATABASE_URL + '&sslmode=require',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      }
    },
    {
      name: 'Original connection string',
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 30000
      }
    }
  ];
  
  for (const strategy of alternativeStrategies) {
    try {
      console.log(`\nTrying strategy: ${strategy.name}`);
      const pool = new Pool(strategy.config);
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