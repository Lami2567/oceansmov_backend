require('dotenv').config();
const https = require('https');
const http = require('http');

const RENDER_URL = process.env.RENDER_URL || 'https://oceansmov-backend.onrender.com';

console.log('🔍 Testing Render Backend Deployment...');
console.log('📍 Target URL:', RENDER_URL);
console.log('');

// Test 1: Basic connectivity
async function testBasicConnectivity() {
  console.log('🧪 Test 1: Basic Connectivity');
  console.log('==============================');
  
  try {
    const response = await makeRequest(`${RENDER_URL}/`);
    console.log('✅ Root endpoint response:', response.statusCode);
    console.log('📄 Response body:', response.body);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Root endpoint failed:', error.message);
    console.log('');
    return false;
  }
}

// Test 2: API status
async function testAPIStatus() {
  console.log('🧪 Test 2: API Status');
  console.log('======================');
  
  try {
    const response = await makeRequest(`${RENDER_URL}/api`);
    console.log('✅ API endpoint response:', response.statusCode);
    console.log('📄 Response body:', response.body);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ API endpoint failed:', error.message);
    console.log('');
    return false;
  }
}

// Test 3: Movies endpoint
async function testMoviesEndpoint() {
  console.log('🧪 Test 3: Movies Endpoint');
  console.log('===========================');
  
  try {
    const response = await makeRequest(`${RENDER_URL}/api/movies`);
    console.log('✅ Movies endpoint response:', response.statusCode);
    console.log('📄 Response body:', response.body);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Movies endpoint failed:', error.message);
    console.log('');
    return false;
  }
}

// Test 4: Users endpoint
async function testUsersEndpoint() {
  console.log('🧪 Test 4: Users Endpoint');
  console.log('==========================');
  
  try {
    const response = await makeRequest(`${RENDER_URL}/api/users`);
    console.log('✅ Users endpoint response:', response.statusCode);
    console.log('📄 Response body:', response.body);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Users endpoint failed:', error.message);
    console.log('');
    return false;
  }
}

// Test 5: Test endpoint
async function testTestEndpoint() {
  console.log('🧪 Test 5: Test Endpoint');
  console.log('=========================');
  
  try {
    const response = await makeRequest(`${RENDER_URL}/api/test`);
    console.log('✅ Test endpoint response:', response.statusCode);
    console.log('📄 Response body:', response.body);
    console.log('');
    return true;
  } catch (error) {
    console.log('❌ Test endpoint failed:', error.message);
    console.log('');
    return false;
  }
}

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'MovieWeb-Test/1.0'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Render Backend Tests...');
  console.log('====================================');
  console.log('');
  
  const tests = [
    { name: 'Basic Connectivity', fn: testBasicConnectivity },
    { name: 'API Status', fn: testAPIStatus },
    { name: 'Movies Endpoint', fn: testMoviesEndpoint },
    { name: 'Users Endpoint', fn: testUsersEndpoint },
    { name: 'Test Endpoint', fn: testTestEndpoint }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, success: result });
    } catch (error) {
      console.log(`❌ ${test.name} failed with error:`, error.message);
      results.push({ name: test.name, success: false, error: error.message });
    }
  }
  
  // Summary
  console.log('📊 Test Summary');
  console.log('===============');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  console.log('');
  console.log(`🎯 Results: ${successCount}/${totalCount} tests passed`);
  
  if (successCount === totalCount) {
    console.log('🎉 All tests passed! Your backend is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check your Render deployment configuration.');
    console.log('');
    console.log('🔧 Troubleshooting Steps:');
    console.log('1. Check Render dashboard for deployment status');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Check Render logs for error messages');
    console.log('4. Ensure database connection is working');
    console.log('5. Verify CORS configuration');
  }
}

// Run the tests
runAllTests().catch(console.error); 