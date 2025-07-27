const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing database connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

// Parse the connection string
const url = new URL(process.env.DATABASE_URL);
console.log('Host:', url.hostname);
console.log('Port:', url.port);
console.log('Database:', url.pathname.slice(1));
console.log('User:', url.username);

// Try different connection methods
async function testConnection() {
  try {
    // Method 1: Direct connection parameters
    console.log('\n--- Testing Method 1: Direct Parameters ---');
    const pool1 = new Pool({
      host: url.hostname,
      port: url.port || 5432,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    const result1 = await pool1.query('SELECT NOW()');
    console.log('✅ Method 1 successful:', result1.rows[0]);
    await pool1.end();

  } catch (error1) {
    console.log('❌ Method 1 failed:', error1.message);
    
    try {
      // Method 2: Connection string
      console.log('\n--- Testing Method 2: Connection String ---');
      const pool2 = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      const result2 = await pool2.query('SELECT NOW()');
      console.log('✅ Method 2 successful:', result2.rows[0]);
      await pool2.end();

    } catch (error2) {
      console.log('❌ Method 2 failed:', error2.message);
      console.log('\n🔧 Suggested fixes:');
      console.log('1. Check if Supabase database is running');
      console.log('2. Verify DATABASE_URL format');
      console.log('3. Check network connectivity');
      console.log('4. Try using IPv4 connection string');
    }
  }
}

testConnection(); 