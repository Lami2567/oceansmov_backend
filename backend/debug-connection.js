const { Pool } = require('pg');
require('dotenv').config();

console.log('=== Database Connection Debug ===');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

// Parse and display connection info
const url = new URL(process.env.DATABASE_URL);
console.log('Connection String Analysis:');
console.log('- Host:', url.hostname);
console.log('- Port:', url.port);
console.log('- Database:', url.pathname.slice(1));
console.log('- User:', url.username);
console.log('- Password length:', url.password ? url.password.length : 0);
console.log('- SSL mode:', url.searchParams.get('sslmode'));

// Test different connection configurations
async function testConnections() {
  const configs = [
    {
      name: 'Original connection string',
      config: {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Explicit parameters',
      config: {
        host: url.hostname,
        port: url.port || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Without SSL',
      config: {
        host: url.hostname,
        port: url.port || 5432,
        user: url.username,
        password: url.password,
        database: url.pathname.slice(1),
        ssl: false
      }
    }
  ];

  for (const { name, config } of configs) {
    try {
      console.log(`\n--- Testing: ${name} ---`);
      const pool = new Pool(config);
      const result = await pool.query('SELECT NOW() as current_time');
      console.log('✅ SUCCESS:', result.rows[0].current_time);
      await pool.end();
      return; // Stop on first success
    } catch (error) {
      console.log('❌ FAILED:', error.message);
    }
  }
  
  console.log('\n🔧 All connection attempts failed. Suggestions:');
  console.log('1. Check if password is correct');
  console.log('2. Verify Supabase database is running');
  console.log('3. Try different SSL modes');
  console.log('4. Check if pooler is accessible');
}

testConnections(); 