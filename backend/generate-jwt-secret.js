const crypto = require('crypto');

function generateJWTSecret() {
  // Generate a secure random string
  const secret = crypto.randomBytes(64).toString('hex');
  
  console.log('🔐 Generated JWT Secret:');
  console.log('='.repeat(50));
  console.log(secret);
  console.log('='.repeat(50));
  console.log('\n📋 Add this to your Render environment variables:');
  console.log('JWT_SECRET=' + secret);
  console.log('\n💡 Copy the entire line above and paste it in your Render dashboard');
  console.log('📍 Location: Render Dashboard → Your Service → Environment → Environment Variables');
}

generateJWTSecret(); 