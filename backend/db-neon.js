const { Pool } = require('pg');
require('dotenv').config();

console.log('🌙 Neon Database Connection Starting...');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  process.exit(1);
}

// Parse connection string - handle both direct URLs and psql command format
let hostname, port, database, username, password;

if (process.env.DATABASE_URL.startsWith('psql')) {
  // Handle psql command format - extract the actual connection string
  const connectionStringMatch = process.env.DATABASE_URL.match(/postgresql:\/\/[^']+/);
  if (connectionStringMatch) {
    const connectionString = connectionStringMatch[0];
    const url = new URL(connectionString);
    hostname = url.hostname;
    port = url.port || 5432;
    database = url.pathname.slice(1);
    username = url.username;
    password = url.password;
  } else {
    throw new Error('Invalid psql connection string format');
  }
} else {
  // Handle direct URL format
  const url = new URL(process.env.DATABASE_URL);
  hostname = url.hostname;
  port = url.port || 5432;
  database = url.pathname.slice(1);
  username = url.username;
  password = url.password;
}

console.log('📍 Connecting to Neon:', hostname, 'Port:', port, 'Database:', database);

// Neon-optimized connection configuration
const createPool = () => {
  const config = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    // Neon-specific optimizations
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 10, // Neon recommends lower connection limits
    min: 1,
    // Application name for monitoring
    application_name: 'movie-web-backend'
  };

  console.log('🔧 Creating Neon connection pool...');
  return new Pool(config);
};

let pool;

// Initialize pool with error handling
const initializePool = async () => {
  try {
    pool = createPool();
    
    // Test the connection
    console.log('🧪 Testing Neon connection...');
    const result = await pool.query('SELECT NOW() as connected_at, version() as db_version');
    
    console.log('✅ Neon connection successful!');
    console.log('📅 Connected at:', result.rows[0].connected_at);
    console.log('🗄️  Database version:', result.rows[0].db_version.split(' ')[0]);
    
    return pool;
  } catch (error) {
    console.error('❌ Neon connection failed:', error.message);
    console.error('🔍 Error details:', error);
    process.exit(1);
  }
};

// Initialize immediately
initializePool();

// Export functions
module.exports = {
  getPool: () => pool,
  query: async (text, params) => {
    if (!pool) {
      throw new Error('Neon database pool not initialized');
    }
    return pool.query(text, params);
  },
  getClient: async () => {
    if (!pool) {
      throw new Error('Neon database pool not initialized');
    }
    return pool.connect();
  }
}; 