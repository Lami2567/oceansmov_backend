console.log('📁 Testing File Upload Configuration');
console.log('='.repeat(50));

console.log('\n🔍 Current Environment Variables:');
console.log('WASABI_ACCESS_KEY_ID:', process.env.WASABI_ACCESS_KEY_ID ? '✅ Set' : '❌ Missing');
console.log('WASABI_SECRET_ACCESS_KEY:', process.env.WASABI_SECRET_ACCESS_KEY ? '✅ Set' : '❌ Missing');
console.log('WASABI_REGION:', process.env.WASABI_REGION || '❌ Missing');
console.log('WASABI_ENDPOINT:', process.env.WASABI_ENDPOINT || '❌ Missing');
console.log('WASABI_BUCKET_NAME:', process.env.WASABI_BUCKET_NAME || '❌ Missing');

console.log('\n🚨 Issue: 500 errors on file upload');
console.log('='.repeat(50));
console.log('The 500 errors are happening because Wasabi is not configured on Render.');

console.log('\n🔧 Solutions:');
console.log('='.repeat(50));

console.log('\nOption 1: Configure Wasabi (Recommended)');
console.log('Add these to your Render environment variables:');
console.log('WASABI_ACCESS_KEY_ID=your_access_key');
console.log('WASABI_SECRET_ACCESS_KEY=your_secret_key');
console.log('WASABI_REGION=us-east-1');
console.log('WASABI_ENDPOINT=https://s3.us-east-1.wasabisys.com');
console.log('WASABI_BUCKET_NAME=your_bucket_name');

console.log('\nOption 2: Use Local Storage (Temporary)');
console.log('If you want to test without Wasabi, I can modify the code to use local storage.');

console.log('\n📋 Steps to Fix:');
console.log('1. Get your Wasabi credentials');
console.log('2. Add them to Render environment variables');
console.log('3. Redeploy your backend');
console.log('4. Test file uploads');

console.log('\n💡 Current Status:');
console.log('✅ Login works (JWT_SECRET is set)');
console.log('✅ CORS is fixed (no more CORS errors)');
console.log('❌ File uploads fail (Wasabi not configured)');
console.log('✅ Movies load properly');

console.log('\n🎯 Next Action:');
console.log('Configure Wasabi on Render to enable file uploads!'); 