const { getPool } = require('./db-neon');
const { s3Client } = require('./config/wasabi');
require('dotenv').config();

async function testDeployment() {
  console.log('🧪 Testing deployment configuration...');
  
  // Check environment variables
  console.log('\n📋 Environment Variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('PORT:', process.env.PORT || '5000');
  
  // Test database connection
  console.log('\n🗄️ Testing Database Connection...');
  try {
    const pool = getPool();
    const result = await pool.query('SELECT COUNT(*) as user_count FROM users');
    console.log('✅ Database connected successfully!');
    console.log(`📊 Users in database: ${result.rows[0].user_count}`);
    
    // Check admin users
    const adminResult = await pool.query('SELECT username, is_admin FROM users WHERE is_admin = true');
    console.log(`👑 Admin users: ${adminResult.rows.length}`);
    adminResult.rows.forEach(user => {
      console.log(`   - ${user.username} (Admin: ${user.is_admin})`);
    });
    
    await pool.end();
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
  
  // Test Wasabi connection
  console.log('\n☁️ Testing Wasabi Connection...');
  try {
    const { ListBucketsCommand } = require('@aws-sdk/client-s3');
    const result = await s3Client.send(new ListBucketsCommand({}));
    console.log('✅ Wasabi connected successfully!');
    console.log('📦 Available buckets:', result.Buckets.map(b => b.Name));
    
    if (process.env.WASABI_BUCKET_NAME) {
      const { HeadBucketCommand } = require('@aws-sdk/client-s3');
      await s3Client.send(new HeadBucketCommand({ Bucket: process.env.WASABI_BUCKET_NAME }));
      console.log('✅ Bucket access confirmed!');
    }
  } catch (error) {
    console.log('❌ Wasabi connection failed:', error.message);
    console.log('💡 This will cause file uploads to fail');
  }
  
  console.log('\n🎯 Summary:');
  console.log('- Database: ' + (process.env.DATABASE_URL ? '✅ Configured' : '❌ Missing'));
  console.log('- JWT Secret: ' + (process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'));
  console.log('- Wasabi: ' + (process.env.WASABI_ACCESS_KEY_ID ? '✅ Configured' : '❌ Missing'));
}

testDeployment(); 