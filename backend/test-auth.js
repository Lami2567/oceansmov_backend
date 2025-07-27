const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing database authentication...');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

// Parse connection string
const url = new URL(process.env.DATABASE_URL);
console.log('Host:', url.hostname);
console.log('Port:', url.port);
console.log('Database:', url.pathname.slice(1));
console.log('User:', url.username);
console.log('Password length:', url.password ? url.password.length : 0);

// Test different connection methods
async function testAuth() {
  try {
    console.log('\n--- Testing with SSL and explicit password ---');
    const pool = new Pool({
      host: url.hostname,
      port: url.port || 5432,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });

    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Authentication successful!');
    console.log('Current time:', result.rows[0].current_time);
    await pool.end();
    
  } catch (error) {
    console.log('❌ Authentication failed:', error.message);
    console.log('\n🔧 Suggested fixes:');
    console.log('1. Check if password is correct in DATABASE_URL');
    console.log('2. Try direct connection string (not pooler)');
    console.log('3. Verify Supabase database credentials');
    console.log('4. Check if database is accessible from Render');
  }
}

testAuth(); 