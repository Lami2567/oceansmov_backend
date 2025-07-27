const jwt = require('jsonwebtoken');
const { getPool } = require('./db-neon');
require('dotenv').config();

async function testAuthDebug() {
  console.log('🔐 Testing Authentication & Authorization...');
  
  // Check JWT_SECRET
  console.log('\n📋 JWT_SECRET Status:');
  if (process.env.JWT_SECRET) {
    console.log('✅ JWT_SECRET is set');
    console.log('Length:', process.env.JWT_SECRET.length, 'characters');
  } else {
    console.log('❌ JWT_SECRET is missing');
    return;
  }
  
  // Test JWT token creation
  console.log('\n🎫 Testing JWT Token Creation:');
  try {
    const testUser = {
      id: 2,
      username: 'katosuraiman41@gmail.com',
      is_admin: true
    };
    
    const token = jwt.sign(testUser, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ JWT token created successfully');
    console.log('Token length:', token.length, 'characters');
    
    // Test token verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token verified successfully');
    console.log('Decoded user:', decoded);
    
  } catch (error) {
    console.log('❌ JWT token test failed:', error.message);
  }
  
  // Test database admin check
  console.log('\n👑 Testing Admin User Check:');
  try {
    const pool = getPool();
    const result = await pool.query('SELECT id, username, is_admin FROM users WHERE username = $1', ['katosuraiman41@gmail.com']);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User found in database');
      console.log('User ID:', user.id);
      console.log('Username:', user.username);
      console.log('Is Admin:', user.is_admin ? '✅ Yes' : '❌ No');
    } else {
      console.log('❌ User not found in database');
    }
    
    await pool.end();
  } catch (error) {
    console.log('❌ Database check failed:', error.message);
  }
  
  console.log('\n🔧 Debugging Tips:');
  console.log('1. Make sure you\'re logged in as admin user');
  console.log('2. Check if JWT token is being sent in Authorization header');
  console.log('3. Verify the token hasn\'t expired');
  console.log('4. Ensure the user has admin privileges');
  
  console.log('\n📝 Expected Authorization Header:');
  console.log('Authorization: Bearer YOUR_JWT_TOKEN_HERE');
}

testAuthDebug(); 