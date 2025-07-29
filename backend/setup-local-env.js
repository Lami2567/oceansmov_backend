const fs = require('fs');
const path = require('path');

console.log('🔧 Local Environment Setup Guide');
console.log('================================');

const envTemplate = `# Database Configuration
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-polished-unit-a2w6q3p3-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
JWT_SECRET=your_jwt_secret_here

# Wasabi Configuration
WASABI_ACCESS_KEY_ID=your_wasabi_access_key
WASABI_SECRET_ACCESS_KEY=your_wasabi_secret_key
WASABI_BUCKET_NAME=oceansmov-site-data
WASABI_REGION=us-west-1
WASABI_ENDPOINT=https://s3.us-west-1.wasabisys.com

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('✅ .env file already exists');
  console.log('📝 Current .env contents:');
  console.log(fs.readFileSync(envPath, 'utf8'));
} else {
  console.log('📝 Creating .env file...');
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ .env file created successfully!');
}

console.log('\n🔑 Required Environment Variables:');
console.log('==================================');
console.log('1. DATABASE_URL - Your Neon PostgreSQL connection string');
console.log('2. JWT_SECRET - A secure random string for JWT tokens');
console.log('3. WASABI_ACCESS_KEY_ID - Your Wasabi access key');
console.log('4. WASABI_SECRET_ACCESS_KEY - Your Wasabi secret key');
console.log('5. WASABI_BUCKET_NAME - Your Wasabi bucket name (oceansmov-site-data)');
console.log('6. WASABI_REGION - Wasabi region (us-west-1)');
console.log('7. WASABI_ENDPOINT - Wasabi endpoint URL');

console.log('\n🚀 Next Steps:');
console.log('1. Edit the .env file with your actual values');
console.log('2. Run: node test-final-config.js');
console.log('3. Start the server: npm start');
console.log('4. Test the application at: http://localhost:5000');

console.log('\n💡 For Render deployment, add these same variables to your Render environment variables!'); 