require('dotenv').config();
const { setupR2 } = require('./setup-r2');

console.log('🧪 Quick R2 Setup Test');
console.log('======================');
console.log('');

async function quickTest() {
  try {
    await setupR2();
    
    console.log('');
    console.log('🎯 Quick Test Summary:');
    console.log('======================');
    console.log('✅ If all tests passed above, R2 is ready!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('   1. Add environment variables to Render');
    console.log('   2. Deploy your backend');
    console.log('   3. Test from your frontend');
    console.log('');
    console.log('🔗 Your app will now use Cloudflare R2 for all file storage!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('');
    console.log('💡 Check the setup guide: R2_CONFIGURATION_GUIDE.md');
  }
}

quickTest(); 