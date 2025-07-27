const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing simple database connection...');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

// Test connection without SSL
async function testConnection() {
  try {
    console.log('Attempting connection without SSL...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
      connectionTimeoutMillis: 10000
    });

    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connection successful!');
    console.log('Current time:', result.rows[0].current_time);
    await pool.end();
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    // Try with SSL but no verification
    try {
      console.log('\nAttempting connection with SSL (no verification)...');
      const pool2 = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000
      });

      const result2 = await pool2.query('SELECT NOW() as current_time');
      console.log('✅ Connection successful with SSL!');
      console.log('Current time:', result2.rows[0].current_time);
      await pool2.end();
      
    } catch (error2) {
      console.log('❌ SSL connection also failed:', error2.message);
      console.log('\n🔧 Suggested fixes:');
      console.log('1. Check if DATABASE_URL is correct');
      console.log('2. Verify Supabase database is running');
      console.log('3. Try different SSL modes in connection string');
      console.log('4. Check network connectivity');
    }
  }
}

testConnection(); 