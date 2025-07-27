const { getPool } = require('./db-neon');
require('dotenv').config();

async function checkUsers() {
  try {
    const pool = getPool();
    
    console.log('🔍 Checking all users in the database...');
    const result = await pool.query('SELECT * FROM users');
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in the database');
    } else {
      console.log(`✅ Found ${result.rows.length} user(s):`);
      console.log('');
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. User data:`, user);
        console.log('');
      });
    }
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error checking users:', error);
    const pool = getPool();
    await pool.end();
  }
}

checkUsers(); 