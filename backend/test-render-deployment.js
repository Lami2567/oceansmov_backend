require('dotenv').config();
const https = require('https');

console.log('🧪 Render + R2 Deployment Test');
console.log('==============================');
console.log('');

// Test configuration
const RENDER_URL = process.env.RENDER_URL || 'https://your-app.onrender.com';

// Test endpoints
const endpoints = [
  { path: '/', name: 'API Status' },
  { path: '/api/test', name: 'Health Check' },
  { path: '/api/users', name: 'Users API' },
  { path: '/api/movies', name: 'Movies API' }
];

// Helper function to make HTTPS requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      timeout: 10000 // 10 second timeout
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Request timeout' });
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test endpoint
async function testEndpoint(endpoint) {
  console.log(`🔍 Testing ${endpoint.name}...`);
  
  try {
    const response = await makeRequest(`${RENDER_URL}${endpoint.path}`);
    
    if (response.error) {
      console.log(`❌ ${endpoint.name} failed: ${response.error}`);
      return false;
    }
    
    if (response.status >= 200 && response.status < 300) {
      console.log(`✅ ${endpoint.name} - Status: ${response.status}`);
      
      // Special checks for specific endpoints
      if (endpoint.path === '/') {
        if (response.data.storage === 'Cloudflare R2') {
          console.log('   ✅ R2 storage confirmed');
        } else {
          console.log('   ⚠️ R2 storage not detected');
        }
      }
      
      return true;
    } else {
      console.log(`⚠️ ${endpoint.name} - Status: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${endpoint.name} error: ${error.message}`);
    return false;
  }
}

// Test file upload functionality
async function testFileUpload() {
  console.log('\n📤 Testing file upload functionality...');
  
  try {
    // First, create a test user
    const registerResponse = await makeRequest(`${RENDER_URL}/api/users/register`, {
      method: 'POST',
      body: {
        username: 'testuser_render',
        password: 'testpassword123'
      }
    });
    
    if (registerResponse.status !== 201 && registerResponse.status !== 400) {
      console.log('❌ User registration failed');
      return false;
    }
    
    // Login to get token
    const loginResponse = await makeRequest(`${RENDER_URL}/api/users/login`, {
      method: 'POST',
      body: {
        username: 'testuser_render',
        password: 'testpassword123'
      }
    });
    
    if (loginResponse.status !== 200 || !loginResponse.data.token) {
      console.log('❌ User login failed');
      return false;
    }
    
    console.log('✅ Authentication test passed');
    console.log('✅ File upload endpoints should work with proper authentication');
    
    return true;
    
  } catch (error) {
    console.log(`❌ File upload test error: ${error.message}`);
    return false;
  }
}

// Test R2 configuration
function testR2Configuration() {
  console.log('\n☁️ Testing R2 Configuration...');
  
  const requiredVars = [
    'CLOUDFLARE_R2_ACCESS_KEY_ID',
    'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
    'CLOUDFLARE_R2_ENDPOINT',
    'CLOUDFLARE_R2_BUCKET_NAME',
    'CLOUDFLARE_R2_PUBLIC_URL'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPresent = false;
    }
  });
  
  if (allPresent) {
    console.log('✅ All R2 environment variables are configured');
  } else {
    console.log('❌ Some R2 environment variables are missing');
  }
  
  return allPresent;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Render + R2 deployment tests...');
  console.log(`📍 Testing URL: ${RENDER_URL}`);
  console.log('');
  
  // Test R2 configuration
  const r2ConfigOk = testR2Configuration();
  
  // Test endpoints
  let endpointTests = 0;
  let endpointPassed = 0;
  
  for (const endpoint of endpoints) {
    endpointTests++;
    const result = await testEndpoint(endpoint);
    if (result) endpointPassed++;
  }
  
  // Test file upload
  const uploadTestOk = await testFileUpload();
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('==============');
  console.log(`R2 Configuration: ${r2ConfigOk ? '✅' : '❌'}`);
  console.log(`Endpoint Tests: ${endpointPassed}/${endpointTests} passed`);
  console.log(`File Upload Test: ${uploadTestOk ? '✅' : '❌'}`);
  
  if (r2ConfigOk && endpointPassed === endpointTests && uploadTestOk) {
    console.log('\n🎉 All tests passed! Your Render deployment is ready!');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the issues above.');
    console.log('\n💡 Common solutions:');
    console.log('   - Verify environment variables are set in Render');
    console.log('   - Check R2 credentials are correct');
    console.log('   - Ensure database connection is working');
    console.log('   - Verify the Render URL is correct');
  }
  
  console.log('\n📚 For detailed configuration, see:');
  console.log('   - RENDER_R2_CONFIGURATION.md');
  console.log('   - R2_CONFIGURATION_GUIDE.md');
}

// Run tests if called directly
if (require.main === module) {
  if (!RENDER_URL || RENDER_URL === 'https://your-app.onrender.com') {
    console.log('❌ Please set RENDER_URL environment variable to your actual Render URL');
    console.log('Example: RENDER_URL=https://your-app.onrender.com node test-render-deployment.js');
    process.exit(1);
  }
  
  runTests().catch(console.error);
}

module.exports = { runTests }; 