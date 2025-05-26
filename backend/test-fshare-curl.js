#!/usr/bin/env node

/**
 * Test Fshare API directly with exact cURL parameters
 */

require('dotenv').config();
const axios = require('axios');

async function testFshareDirectAPI() {
  console.log('🧪 Testing Fshare API with exact cURL parameters...\n');

  // Test 1: Direct API call matching cURL
  console.log('1️⃣ Testing Login API (exact cURL match):');
  
  try {
    const response = await axios.post('https://api.fshare.vn/api/user/login', {
      user_email: "trantrungtin300107@gmail.com",
      password: "Tin300107@",
      app_key: "dMnqMMZMUnN5YpvKENaEhdQQ5jxDqddt"
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_id=ng4f35dvmu6rqc9tsdh9k0jfvs'
      },
      timeout: 30000
    });

    console.log('✅ Login successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.token) {
      console.log('\n2️⃣ Testing Download API:');
      
      // Test download API
      const downloadResponse = await axios.post('https://api.fshare.vn/api/session/download', {
        zipflag: 0,
        url: "https://www.fshare.vn/file/ACNYKM94HTE8QOX",
        password: "",
        token: response.data.token
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36',
          'Authorization': `Bearer ${response.data.token}`,
          'Cookie': 'session_id=ng4f35dvmu6rqc9tsdh9k0jfvs'
        },
        timeout: 30000
      });

      console.log('✅ Download API response:');
      console.log('Status:', downloadResponse.status);
      console.log('Data:', JSON.stringify(downloadResponse.data, null, 2));
    }

  } catch (error) {
    console.log('❌ API call failed:');
    console.log('Error message:', error.message);
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', error.response.headers);
      
      // Check if response is HTML (error page)
      const contentType = error.response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.log('Response is HTML error page (truncated):');
        console.log(error.response.data.substring(0, 500) + '...');
      } else {
        console.log('Response data:', error.response.data);
      }
    }
  }

  console.log('\n3️⃣ Testing alternative endpoints:');
  
  // Test if the API endpoint exists
  try {
    const healthCheck = await axios.get('https://api.fshare.vn', {
      timeout: 10000
    });
    console.log('✅ Fshare API server is reachable');
  } catch (error) {
    console.log('❌ Fshare API server check failed:', error.message);
  }

  // Test different login endpoint variations
  const endpoints = [
    'https://api.fshare.vn/api/user/login',
    'https://www.fshare.vn/api/user/login',
    'https://api.fshare.vn/api/v3/user/login'
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing endpoint: ${endpoint}`);
    try {
      const response = await axios.post(endpoint, {
        user_email: "trantrungtin300107@gmail.com",
        password: "Tin300107@",
        app_key: "dMnqMMZMUnN5YpvKENaEhdQQ5jxDqddt"
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      if (response.data) {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
      }
    }
  }

  console.log('\n📝 Summary:');
  console.log('- Check if Fshare credentials are correct');
  console.log('- Verify API endpoint is still valid');
  console.log('- Check if session_id cookie is required');
  console.log('- Consider rate limiting or IP restrictions');
}

// Run the test
if (require.main === module) {
  testFshareDirectAPI().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testFshareDirectAPI };
