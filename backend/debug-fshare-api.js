#!/usr/bin/env node

/**
 * Debug Fshare API with different credential combinations
 */

require('dotenv').config();
const axios = require('axios');

async function debugFshareAPI() {
  console.log('🔍 Debugging Fshare API Credentials...\n');

  // Test different API endpoints and credential combinations
  const testConfigs = [
    {
      name: 'Current Config',
      endpoint: 'https://api.fshare.vn/api/user/login',
      credentials: {
        user_email: "trantrungtin300107@gmail.com",
        password: "Tin300107@",
        app_key: "dMnqMMZMUnN5YpvKENaEhdQQ5jxDqddt"
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    },
    {
      name: 'With Session Cookie',
      endpoint: 'https://api.fshare.vn/api/user/login',
      credentials: {
        user_email: "trantrungtin300107@gmail.com",
        password: "Tin300107@",
        app_key: "dMnqMMZMUnN5YpvKENaEhdQQ5jxDqddt"
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': 'session_id=ng4f35dvmu6rqc9tsdh9k0jfvs'
      }
    },
    {
      name: 'Alternative App Key',
      endpoint: 'https://api.fshare.vn/api/user/login',
      credentials: {
        user_email: "trantrungtin300107@gmail.com",
        password: "Tin300107@",
        app_key: "L2S7R6ZMagggC5wWkQhX2+aDi467PPuftWUMRFSn"
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    },
    {
      name: 'Different Endpoint',
      endpoint: 'https://www.fshare.vn/api/user/login',
      credentials: {
        user_email: "trantrungtin300107@gmail.com",
        password: "Tin300107@",
        app_key: "dMnqMMZMUnN5YpvKENaEhdQQ5jxDqddt"
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }
  ];

  for (let i = 0; i < testConfigs.length; i++) {
    const config = testConfigs[i];
    console.log(`${i + 1}️⃣ Testing: ${config.name}`);
    console.log(`   Endpoint: ${config.endpoint}`);
    console.log(`   App Key: ${config.credentials.app_key.substring(0, 10)}...`);
    
    try {
      const response = await axios.post(config.endpoint, config.credentials, {
        headers: config.headers,
        timeout: 15000
      });

      console.log(`   ✅ SUCCESS!`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response:`, JSON.stringify(response.data, null, 2));
      
      if (response.data && response.data.token) {
        console.log(`   🎉 TOKEN OBTAINED: ${response.data.token.substring(0, 20)}...`);
        
        // Test download API with this token
        console.log(`   🔗 Testing download API...`);
        try {
          const downloadResponse = await axios.post('https://api.fshare.vn/api/session/download', {
            zipflag: 0,
            url: "https://www.fshare.vn/file/ACNYKM94HTE8QOX",
            password: "",
            token: response.data.token
          }, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${response.data.token}`,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 15000
          });
          
          console.log(`   ✅ Download API Success:`, downloadResponse.data);
        } catch (downloadError) {
          console.log(`   ❌ Download API Failed:`, downloadError.message);
          if (downloadError.response) {
            console.log(`   Status: ${downloadError.response.status}`);
            console.log(`   Data:`, downloadError.response.data);
          }
        }
      }
      
      console.log('');
      break; // Stop on first success
      
    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}`);
      
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Headers:`, error.response.headers['content-type']);
        
        if (error.response.headers['content-type']?.includes('application/json')) {
          console.log(`   Data:`, error.response.data);
        } else {
          console.log(`   HTML Response (truncated):`, 
            error.response.data.substring(0, 200) + '...');
        }
      }
      console.log('');
    }
  }

  console.log('🔍 Additional Debugging:');
  
  // Test if Fshare API is accessible
  try {
    const healthCheck = await axios.get('https://api.fshare.vn', { timeout: 10000 });
    console.log('✅ Fshare API server is accessible');
  } catch (error) {
    console.log('❌ Fshare API server not accessible:', error.message);
  }

  // Test different user agents
  console.log('\n🔍 Testing different User Agents:');
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    'FshareApp/1.0',
    'curl/7.68.0'
  ];

  for (const ua of userAgents) {
    try {
      const response = await axios.post('https://api.fshare.vn/api/user/login', {
        user_email: "trantrungtin300107@gmail.com",
        password: "Tin300107@",
        app_key: "dMnqMMZMUnN5YpvKENaEhdQQ5jxDqddt"
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': ua
        },
        timeout: 10000
      });
      
      console.log(`✅ ${ua.substring(0, 30)}... - Success`);
      break;
    } catch (error) {
      console.log(`❌ ${ua.substring(0, 30)}... - ${error.response?.status || error.message}`);
    }
  }

  console.log('\n📝 Recommendations:');
  console.log('1. Check if Fshare account is still active');
  console.log('2. Verify password hasn\'t changed');
  console.log('3. Check if app_key is still valid');
  console.log('4. Try logging in manually on Fshare website');
  console.log('5. Check if IP is blocked or rate limited');
}

// Run the debug
if (require.main === module) {
  debugFshareAPI().catch(error => {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  });
}

module.exports = { debugFshareAPI };
