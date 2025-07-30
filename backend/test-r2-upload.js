const https = require('https');

const RENDER_URL = 'https://oceansmov-backend.onrender.com';

// Test R2 configuration
async function testR2Config() {
  console.log('🧪 Testing R2 Configuration on Deployed Backend');
  console.log('==============================================');
  
  try {
    // Test the test endpoint to check environment variables
    const testResponse = await makeRequest(`${RENDER_URL}/api/test`);
    console.log('✅ Test endpoint response:', testResponse.status);
    console.log('📄 Environment info:', testResponse.data.environment);
    
    // Check if R2 variables are set
    if (testResponse.data.environment) {
      console.log('🔍 R2 Environment Check:');
      console.log('- CLOUDFLARE_R2_ENDPOINT:', testResponse.data.environment.cloudflareR2Endpoint ? 'set' : 'not set');
      console.log('- CLOUDFLARE_R2_BUCKET_NAME:', testResponse.data.environment.cloudflareR2Bucket ? 'set' : 'not set');
      console.log('- CLOUDFLARE_R2_ACCESS_KEY_ID:', testResponse.data.environment.cloudflareR2AccessKey ? 'set' : 'not set');
      console.log('- CLOUDFLARE_R2_SECRET_ACCESS_KEY:', testResponse.data.environment.cloudflareR2SecretKey ? 'set' : 'not set');
      console.log('- CLOUDFLARE_R2_PUBLIC_URL:', testResponse.data.environment.cloudflareR2PublicUrl ? 'set' : 'not set');
    }
    
  } catch (error) {
    console.error('❌ Error testing R2 config:', error.message);
  }
}

// Test poster upload endpoint (without actual file)
async function testPosterUploadEndpoint() {
  console.log('\n🧪 Testing Poster Upload Endpoint');
  console.log('==================================');
  
  try {
    // Test with invalid request (no auth, no file) to see error handling
    const response = await makeRequest(`${RENDER_URL}/api/movies/6/poster`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📄 Response data:', response.data);
    
  } catch (error) {
    console.log('📡 Expected error (no auth):', error.response?.status);
    console.log('📄 Error message:', error.response?.data);
  }
}

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Run tests
async function runTests() {
  await testR2Config();
  await testPosterUploadEndpoint();
  console.log('\n🎯 Test completed!');
}

runTests().catch(console.error); 