const bcrypt = require('bcryptjs');
const { getPool } = require('./db-neon');
require('dotenv').config();

async function createAdminUser() {
  try {
    const pool = getPool();
    const username = 'admin';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (existingUser.rows.length > 0) {
      // Update existing user to admin
      await pool.query(
        'UPDATE users SET is_admin = TRUE, password = $1 WHERE username = $2',
        [hashedPassword, username]
      );
      console.log('✅ Admin user updated successfully!');
    } else {
      // Create new admin user
      await pool.query(
        'INSERT INTO users (username, password, is_admin) VALUES ($1, $2, TRUE)',
        [username, hashedPassword]
      );
      console.log('✅ Admin user created successfully!');
    }

    console.log('\n📋 Admin Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n🔗 Login at your frontend URL');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    const pool = getPool();
    await pool.end();
  }
}

async function makeUserAdmin(targetUsername) {
  try {
    const pool = getPool();
    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [targetUsername]);
    
    if (existingUser.rows.length === 0) {
      console.log(`❌ User '${targetUsername}' not found!`);
      return;
    }

    // Update user to admin
    await pool.query(
      'UPDATE users SET is_admin = TRUE WHERE username = $1',
      [targetUsername]
    );
    
    console.log(`✅ User '${targetUsername}' is now an admin!`);
    console.log('\n🔗 Login at your frontend URL');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error making user admin:', error);
    const pool = getPool();
    await pool.end();
  }
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.length > 0) {
  const targetUsername = args[0];
  console.log(`🎯 Making user '${targetUsername}' an admin...`);
  makeUserAdmin(targetUsername);
} else {
  console.log('🔧 Creating default admin user...');
  createAdminUser();
} 