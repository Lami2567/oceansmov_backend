const https = require('https');

console.log('🎬 Direct Signed URL Test');
console.log('========================');

const BACKEND_URL = 'https://oceansmov-backend.onrender.com';

// Test with a known working user
async function testSignedUrl() {
  console.log('\n🔍 Step 1: Testing user login...');
  
  const testUser = {
    username: 'testuser_direct',
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
      
      // Test signed URL for movie ID 3
      console.log('\n🎬 Step 2: Testing signed URL generation...');
      const signedUrlResponse = await makeRequest(`${BACKEND_URL}/api/movies/3/video-url`, {
        headers: { 'Authorization': `Bearer ${loginResponse.data.token}` }
      });
      
      if (signedUrlResponse.status === 200 && signedUrlResponse.data.signed_url) {
        console.log('✅ Signed URL generated successfully!');
        console.log('🔗 Signed URL:', signedUrlResponse.data.signed_url.substring(0, 100) + '...');
        console.log('⏰ Expires in:', signedUrlResponse.data.expires_in, 'seconds');
        
        // Test if the signed URL is accessible
        console.log('\n🔍 Step 3: Testing signed URL accessibility...');
        const urlTest = new URL(signedUrlResponse.data.signed_url);
        
        const testResult = await new Promise((resolve) => {
          const req = https.request({
            hostname: urlTest.hostname,
            path: urlTest.pathname + urlTest.search,
            method: 'HEAD'
          }, (res) => {
            resolve({ status: res.statusCode, headers: res.headers });
          });
          
          req.on('error', (error) => {
            resolve({ error: error.message });
          });
          
          req.end();
        });
        
        if (testResult.error) {
          console.log('❌ URL Test Failed:', testResult.error);
        } else if (testResult.status === 200) {
          console.log('✅ URL Test Successful! Status:', testResult.status);
          console.log('📏 Content Length:', testResult.headers['content-length'] || 'Unknown', 'bytes');
          console.log('🎬 Content Type:', testResult.headers['content-type'] || 'Unknown');
        } else {
          console.log('⚠️ URL Test Warning: Status', testResult.status);
        }
        
        console.log('\n🎉 SUCCESS! Signed URLs are working perfectly!');
        console.log('🔧 The issue is likely in the frontend deployment or caching.');
        
      } else {
        console.log('❌ Signed URL generation failed:', signedUrlResponse.status, signedUrlResponse.data);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.status, loginResponse.data);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
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

// Run the test
testSignedUrl().catch(console.error); 