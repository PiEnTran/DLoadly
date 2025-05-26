#!/usr/bin/env node

/**
 * Test Fshare integration on production
 */

const axios = require('./backend/node_modules/axios');

async function testProductionFshare() {
  console.log('🧪 Testing Fshare Integration on Production...\n');

  const BACKEND_URL = 'https://dloadly-production.up.railway.app';

  // Test 1: Check Fshare service status
  console.log('1️⃣ Testing Fshare Service Status:');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/fshare/status`);
    console.log('✅ Status Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Status Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  console.log('');

  // Test 2: Test Fshare download via main endpoint
  console.log('2️⃣ Testing Fshare Download (Main Endpoint):');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/download`, {
      url: 'https://www.fshare.vn/file/ACNYKM94HTE8QOX',
      password: '',
      targetEmail: 'test@example.com'
    }, {
      timeout: 30000
    });

    console.log('✅ Download Response:', {
      title: response.data.title,
      platform: response.data.platform,
      type: response.data.type,
      isManualProcessing: response.data.isManualProcessing,
      processingReason: response.data.processingReason,
      hasInstructions: !!response.data.instructions
    });

    if (response.data.instructions) {
      console.log('📝 Instructions Preview:');
      console.log(response.data.instructions.split('\n').slice(0, 8).join('\n'));
      console.log('...');
    }
  } catch (error) {
    console.log('❌ Download Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  console.log('');

  // Test 3: Test Fshare dedicated endpoint
  console.log('3️⃣ Testing Fshare Dedicated Endpoint:');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/fshare/download`, {
      url: 'https://www.fshare.vn/file/ACNYKM94HTE8QOX',
      password: '',
      targetEmail: 'test@example.com'
    }, {
      timeout: 30000
    });

    console.log('✅ Dedicated Endpoint Response:', {
      title: response.data.title,
      platform: response.data.platform,
      type: response.data.type,
      requiresManualProcessing: response.data.requiresManualProcessing,
      hasInstructions: !!response.data.instructions
    });
  } catch (error) {
    console.log('❌ Dedicated Endpoint Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  console.log('');

  // Test 4: Test file info endpoint
  console.log('4️⃣ Testing Fshare File Info:');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/fshare/info`, {
      url: 'https://www.fshare.vn/file/ACNYKM94HTE8QOX'
    }, {
      timeout: 30000
    });

    console.log('✅ File Info Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ File Info Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  console.log('');

  // Test 5: Test invalid Fshare URL
  console.log('5️⃣ Testing Invalid Fshare URL:');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/download`, {
      url: 'https://www.fshare.vn/file/INVALIDFILE123'
    }, {
      timeout: 30000
    });

    console.log('✅ Invalid URL Response:', {
      title: response.data.title,
      platform: response.data.platform,
      isManualProcessing: response.data.isManualProcessing
    });
  } catch (error) {
    console.log('❌ Invalid URL Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
  console.log('');

  // Test 6: Test non-Fshare URL (should not be processed by Fshare)
  console.log('6️⃣ Testing Non-Fshare URL:');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/download`, {
      url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
    }, {
      timeout: 30000
    });

    console.log('✅ Non-Fshare URL Response:', {
      platform: response.data.platform || 'Not detected',
      title: response.data.title
    });
  } catch (error) {
    console.log('❌ Non-Fshare URL Error:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }

  console.log('\n📊 Production Test Summary:');
  console.log('✅ Fshare URL detection should work');
  console.log('✅ Manual processing fallback should work');
  console.log('✅ Instructions generation should work');
  console.log('✅ Error handling should work');
  console.log('⚠️ API integration depends on credentials');

  console.log('\n📝 Next Steps:');
  console.log('1. Verify environment variables are set in Railway');
  console.log('2. Check Railway logs for any errors');
  console.log('3. Test with frontend integration');
  console.log('4. Fix Fshare API credentials when available');
}

// Run the test
if (require.main === module) {
  testProductionFshare().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testProductionFshare };
