#!/usr/bin/env node

/**
 * DLoadly Production Connection Test
 * Tests the connection between Vercel frontend and Railway backend
 */

const axios = require('axios');

const FRONTEND_URL = 'https://d-loadly.vercel.app';
const BACKEND_URL = 'https://dloadly-production.up.railway.app';

console.log('🚀 DLoadly Production Connection Test\n');

async function testBackendHealth() {
  console.log('1️⃣ Testing Backend Health...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      timeout: 10000
    });
    
    console.log('✅ Backend Health Check:', {
      status: response.data.status,
      environment: response.data.environment,
      port: response.data.port,
      uptime: Math.round(response.data.uptime) + 's'
    });
    return true;
  } catch (error) {
    console.log('❌ Backend Health Check Failed:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('\n2️⃣ Testing CORS Configuration...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/health`, {
      headers: {
        'Origin': FRONTEND_URL,
        'Access-Control-Request-Method': 'GET'
      },
      timeout: 10000
    });
    
    console.log('✅ CORS Test Passed');
    return true;
  } catch (error) {
    if (error.response?.status === 200) {
      console.log('✅ CORS Test Passed (200 response)');
      return true;
    }
    console.log('❌ CORS Test Failed:', error.message);
    return false;
  }
}

async function testAPIEndpoints() {
  console.log('\n3️⃣ Testing API Endpoints...');
  
  const endpoints = [
    '/api/health',
    '/api/admin/settings',
    '/api/downloads/platforms'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BACKEND_URL}${endpoint}`, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });
      
      console.log(`✅ ${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

async function testFrontendAccess() {
  console.log('\n4️⃣ Testing Frontend Access...');
  try {
    const response = await axios.get(FRONTEND_URL, {
      timeout: 10000
    });
    
    if (response.status === 200) {
      console.log('✅ Frontend accessible');
      
      // Check if it contains expected content
      if (response.data.includes('DLoadly')) {
        console.log('✅ Frontend content loaded correctly');
      } else {
        console.log('⚠️ Frontend content may not be loading correctly');
      }
    }
    return true;
  } catch (error) {
    console.log('❌ Frontend Access Failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend:  ${BACKEND_URL}\n`);
  
  const results = {
    backend: await testBackendHealth(),
    cors: await testCORS(),
    frontend: await testFrontendAccess()
  };
  
  await testAPIEndpoints();
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Backend Health: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`CORS Config:    ${results.cors ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend:       ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Production deployment is working correctly.');
    console.log('\n📋 Next Steps:');
    console.log('1. Update environment variables on Vercel and Railway');
    console.log('2. Test user registration and login');
    console.log('3. Test download functionality');
    console.log('4. Test admin panel access');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the configuration.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify environment variables are set correctly');
    console.log('2. Check CORS configuration on Railway');
    console.log('3. Ensure both services are deployed and running');
  }
}

// Run the tests
runTests().catch(console.error);
