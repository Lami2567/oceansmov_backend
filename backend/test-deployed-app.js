const https = require('https');
const http = require('http');

console.log('🚀 Testing Deployed Movie Web Application');
console.log('==========================================');

const BACKEND_URL = 'https://oceansmov-backend.onrender.com';
const FRONTEND_URL = 'https://oceansmov.vercel.app';

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
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

async function testBackendHealth() {
  console.log('\n🔍 Testing Backend Health...');
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/movies`);
    console.log(`✅ Backend Status: ${response.status}`);
    console.log(`📊 Movies in database: ${response.data.length || 0}`);
    return true;
  } catch (error) {
    console.log(`❌ Backend Error: ${error.message}`);
    return false;
  }
}

async function testUserAuthentication() {
  console.log('\n👤 Testing User Authentication...');
  
  // Test user registration
  try {
    const testUser = {
      username: `testuser_${Date.now()}`,
      password: 'testpassword123'
    };
    
    const registerResponse = await makeRequest(`${BACKEND_URL}/api/users/register`, {
      method: 'POST',
      body: testUser
    });
    
    if (registerResponse.status === 201) {
      console.log('✅ User registration working');
      
      // Test user login
      const loginResponse = await makeRequest(`${BACKEND_URL}/api/users/login`, {
        method: 'POST',
        body: testUser
      });
      
      if (loginResponse.status === 200 && loginResponse.data.token) {
        console.log('✅ User login working');
        console.log('🔑 JWT token generated successfully');
        return loginResponse.data.token;
      } else {
        console.log('❌ User login failed');
        return null;
      }
    } else {
      console.log('❌ User registration failed');
      return null;
    }
  } catch (error) {
    console.log(`❌ Authentication Error: ${error.message}`);
    return null;
  }
}

async function testAdminFeatures(token) {
  if (!token) {
    console.log('\n👑 Skipping Admin Features (no token)');
    return;
  }
  
  console.log('\n👑 Testing Admin Features...');
  
  try {
    // Test admin movie creation
    const testMovie = {
      title: `Test Movie ${Date.now()}`,
      description: 'A test movie for testing purposes',
      genre: 'Test',
      release_year: 2024,
      director: 'Test Director',
      poster_url: 'https://via.placeholder.com/300x450',
      movie_file_url: 'https://via.placeholder.com/1920x1080'
    };
    
    const movieResponse = await makeRequest(`${BACKEND_URL}/api/movies`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: testMovie
    });
    
    if (movieResponse.status === 201) {
      console.log('✅ Admin movie creation working');
      return movieResponse.data.id;
    } else {
      console.log('❌ Admin movie creation failed');
      return null;
    }
  } catch (error) {
    console.log(`❌ Admin Features Error: ${error.message}`);
    return null;
  }
}

async function testVideoPlayback(movieId, token) {
  if (!movieId || !token) {
    console.log('\n🎥 Skipping Video Playback Test (no movie ID or token)');
    return;
  }
  
  console.log('\n🎥 Testing Video Playback...');
  
  try {
    // Test signed URL generation
    const videoUrlResponse = await makeRequest(`${BACKEND_URL}/api/movies/${movieId}/video-url`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (videoUrlResponse.status === 200 && videoUrlResponse.data.signed_url) {
      console.log('✅ Signed URL generation working');
      console.log(`🔗 Signed URL: ${videoUrlResponse.data.signed_url.substring(0, 50)}...`);
      return true;
    } else {
      console.log('❌ Signed URL generation failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Video Playback Error: ${error.message}`);
    return false;
  }
}

async function testFrontendAccess() {
  console.log('\n🌐 Testing Frontend Access...');
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    if (response.status === 200) {
      console.log('✅ Frontend accessible');
      return true;
    } else {
      console.log(`❌ Frontend Error: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Frontend Error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive application test...\n');
  
  // Test 1: Backend Health
  const backendHealthy = await testBackendHealth();
  
  // Test 2: Frontend Access
  const frontendAccessible = await testFrontendAccess();
  
  // Test 3: User Authentication
  const token = await testUserAuthentication();
  
  // Test 4: Admin Features
  const movieId = await testAdminFeatures(token);
  
  // Test 5: Video Playback
  const videoWorking = await testVideoPlayback(movieId, token);
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log(`Backend Health: ${backendHealthy ? '✅' : '❌'}`);
  console.log(`Frontend Access: ${frontendAccessible ? '✅' : '❌'}`);
  console.log(`Authentication: ${token ? '✅' : '❌'}`);
  console.log(`Admin Features: ${movieId ? '✅' : '❌'}`);
  console.log(`Video Playback: ${videoWorking ? '✅' : '❌'}`);
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Visit: https://oceansmov.vercel.app');
  console.log('2. Test user registration and login');
  console.log('3. Test movie upload (as admin)');
  console.log('4. Test video playback');
  console.log('5. Test all frontend features');
  
  console.log('\n🔧 If any tests failed:');
  console.log('- Check Render logs: https://dashboard.render.com');
  console.log('- Check Vercel logs: https://vercel.com/dashboard');
  console.log('- Verify environment variables are set correctly');
}

// Run the tests
runAllTests().catch(console.error); 