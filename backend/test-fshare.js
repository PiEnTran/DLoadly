#!/usr/bin/env node

/**
 * Test script for Fshare integration
 * Run with: node test-fshare.js
 */

require('dotenv').config();
const fshareService = require('./services/fshareService');

async function testFshareIntegration() {
  console.log('🧪 Testing Fshare Integration...\n');

  // Test 1: Service Configuration
  console.log('1️⃣ Testing Service Configuration:');
  console.log('   - Enabled:', fshareService.isEnabled);
  console.log('   - Configured:', fshareService.isConfigured());
  console.log('   - Credentials:', {
    hasEmail: !!process.env.FSHARE_EMAIL,
    hasPassword: !!process.env.FSHARE_PASSWORD,
    hasAppKey: !!process.env.FSHARE_APP_KEY
  });
  console.log('');

  if (!fshareService.isConfigured()) {
    console.log('❌ Fshare service is not configured. Please set environment variables:');
    console.log('   FSHARE_ENABLED=true');
    console.log('   FSHARE_EMAIL=your_email');
    console.log('   FSHARE_PASSWORD=your_password');
    console.log('   FSHARE_APP_KEY=your_app_key');
    return;
  }

  // Test 2: URL Validation
  console.log('2️⃣ Testing URL Validation:');
  const testUrls = [
    'https://www.fshare.vn/file/ACNYKM94HTE8QOX',
    'https://fshare.vn/file/ACNYKM94HTE8QOX',
    'http://www.fshare.vn/file/ACNYKM94HTE8QOX',
    'https://youtube.com/watch?v=123',
    'invalid-url'
  ];

  testUrls.forEach(url => {
    const isValid = fshareService.isFshareUrl(url);
    const fileCode = fshareService.extractFileCode(url);
    console.log(`   ${url} -> Valid: ${isValid}, Code: ${fileCode || 'N/A'}`);
  });
  console.log('');

  // Test 3: Login
  console.log('3️⃣ Testing Fshare Login:');
  try {
    const loginResult = await fshareService.login();
    console.log('   ✅ Login successful:', {
      hasToken: !!loginResult.token,
      tokenLength: loginResult.token ? loginResult.token.length : 0
    });
  } catch (error) {
    console.log('   ❌ Login failed:', error.message);
    return;
  }
  console.log('');

  // Test 4: Quota Info
  console.log('4️⃣ Testing Quota Information:');
  try {
    const quotaInfo = await fshareService.getQuotaInfo();
    console.log('   Quota Info:', {
      enabled: quotaInfo.enabled,
      dailyLimit: `${(quotaInfo.dailyLimit / (1024 * 1024 * 1024)).toFixed(0)}GB`,
      dailyUsed: `${(quotaInfo.dailyUsed / (1024 * 1024 * 1024)).toFixed(2)}GB`,
      dailyRemaining: `${(quotaInfo.dailyRemaining / (1024 * 1024 * 1024)).toFixed(2)}GB`,
      percentUsed: `${quotaInfo.percentUsed.toFixed(1)}%`
    });
  } catch (error) {
    console.log('   ❌ Quota check failed:', error.message);
  }
  console.log('');

  // Test 5: Service Status
  console.log('5️⃣ Testing Service Status:');
  const status = fshareService.getServiceStatus();
  console.log('   Service Status:', {
    enabled: status.enabled,
    configured: status.configured,
    sessionValid: status.sessionValid,
    quotaPercent: `${status.quotaInfo.percentUsed.toFixed(1)}%`
  });
  console.log('');

  // Test 6: File Info (if test URL is provided)
  const testFileUrl = process.env.FSHARE_TEST_URL || 'https://www.fshare.vn/file/ACNYKM94HTE8QOX';
  console.log('6️⃣ Testing File Info:');
  console.log(`   Test URL: ${testFileUrl}`);
  
  try {
    const fileInfo = await fshareService.getFileInfo(testFileUrl);
    console.log('   ✅ File info retrieved:', {
      name: fileInfo.name,
      size: fileInfo.size,
      type: fileInfo.type,
      isFolder: fileInfo.isFolder
    });
  } catch (error) {
    console.log('   ❌ File info failed:', error.message);
    console.log('   (This might be expected if the test URL is invalid or file doesn\'t exist)');
  }
  console.log('');

  // Test 7: Download Link (careful - this uses quota)
  console.log('7️⃣ Testing Download Link (WARNING: Uses quota):');
  const shouldTestDownload = process.env.FSHARE_TEST_DOWNLOAD === 'true';
  
  if (shouldTestDownload) {
    try {
      const downloadInfo = await fshareService.getDownloadLink(testFileUrl);
      console.log('   ✅ Download link obtained:', {
        hasUrl: !!downloadInfo.downloadUrl,
        filename: downloadInfo.filename,
        fileSize: downloadInfo.fileSize
      });
    } catch (error) {
      console.log('   ❌ Download link failed:', error.message);
    }
  } else {
    console.log('   ⏭️  Skipped (set FSHARE_TEST_DOWNLOAD=true to enable)');
  }
  console.log('');

  console.log('🎉 Fshare integration test completed!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Add environment variables to Railway');
  console.log('   2. Test with real Fshare URLs');
  console.log('   3. Integrate with frontend');
  console.log('   4. Test Google Drive upload integration');
}

// Run the test
if (require.main === module) {
  testFshareIntegration().catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testFshareIntegration };
