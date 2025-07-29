const https = require('https');

console.log('🔍 Debugging Signed URL Generation');
console.log('==================================');

const BACKEND_URL = 'https://oceansmov-backend.onrender.com';

// Test user login first
async function testLogin() {
  console.log('\n👤 Testing user login...');
  
  const testUser = {
    username: 'testuser_debug',
    password: 'testpassword123'
  };
  
  try {
    // Register user first
    const registerResponse = await makeRequest(`${BACKEND_URL}/api/users/register`, {
      method: 'POST',
      body: testUser
    });
    
    if (registerResponse.status === 201) {
      console.log('✅ User registered successfully');
    } else if (registerResponse.status === 400) {
      console.log('ℹ️ User already exists');
    }
    
    // Login
    const loginResponse = await makeRequest(`${BACKEND_URL}/api/users/login`, {
      method: 'POST',
      body: testUser
    });
    
    if (loginResponse.status === 200 && loginResponse.data.token) {
      console.log('✅ Login successful');
      console.log('🔑 Token received');
      return loginResponse.data.token;
    } else {
      console.log('❌ Login failed:', loginResponse.status, loginResponse.data);
      return null;
    }
  } catch (error) {
    console.log('❌ Login error:', error.message);
    return null;
  }
}

// Test signed URL generation
async function testSignedUrl(token, movieId) {
  console.log(`\n🎬 Testing signed URL for movie ${movieId}...`);
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/movies/${movieId}/video-url`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data.signed_url) {
      console.log('✅ Signed URL generated successfully!');
      console.log(`🔗 URL: ${response.data.signed_url.substring(0, 100)}...`);
      return response.data.signed_url;
    } else {
      console.log('❌ Signed URL generation failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Signed URL error:', error.message);
    return null;
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
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Main test function
async function runDebug() {
  console.log('🚀 Starting signed URL debug...\n');
  
  // Step 1: Login
  const token = await testLogin();
  if (!token) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  // Step 2: Test signed URL for movie ID 3 (Aladdin)
  const signedUrl = await testSignedUrl(token, 3);
  
  if (signedUrl) {
    console.log('\n🎉 Success! Signed URL is working.');
    console.log('🔧 The issue might be in the frontend implementation.');
  } else {
    console.log('\n❌ Signed URL generation failed on backend.');
    console.log('🔧 Check Render logs for backend errors.');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Check Render logs: https://dashboard.render.com');
  console.log('2. Verify Wasabi environment variables are set');
  console.log('3. Test the signed URL manually in browser');
}

// Run the debug
runDebug().catch(console.error); 