const express = require('express');
const router = express.Router();

// Test route to verify router is working
router.get('/test', (req, res) => {
  res.json({
    message: 'Download routes are working!',
    timestamp: new Date().toISOString(),
    routes: ['POST /download', 'GET /test']
  });
});

// Import dependencies with error handling
let downloadYouTube, downloadTikTok, downloadInstagram, downloadFacebook, downloadTwitter, downloadFshare;
let downloadManager;

try {
  const mediaDownloader = require('../utils/mediaDownloader');
  downloadYouTube = mediaDownloader.downloadYouTube;
  downloadTikTok = mediaDownloader.downloadTikTok;
  downloadInstagram = mediaDownloader.downloadInstagram;
  downloadFacebook = mediaDownloader.downloadFacebook;
  downloadTwitter = mediaDownloader.downloadTwitter;
  downloadFshare = mediaDownloader.downloadFshare;
  console.log('✅ Media downloader loaded successfully');
} catch (error) {
  console.error('❌ Error loading media downloader:', error.message);
}

try {
  downloadManager = require('../services/downloadManager');
  console.log('✅ Download manager loaded successfully');
} catch (error) {
  console.error('❌ Error loading download manager:', error.message);
}

// Determine platform from URL
const getPlatform = (url) => {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

  if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    return 'youtube';
  } else if (hostname.includes('tiktok.com')) {
    return 'tiktok';
  } else if (hostname.includes('instagram.com')) {
    return 'instagram';
  } else if (hostname.includes('facebook.com') || hostname.includes('fb.com')) {
    return 'facebook';
  } else if (hostname.includes('twitter.com') || hostname.includes('x.com')) {
    return 'twitter';
  } else if (hostname.includes('fshare.vn')) {
    return 'fshare';
  } else {
    return 'unknown';
  }
};

// Main download endpoint
router.post('/download', async (req, res) => {
  try {
    console.log('🎯 Download endpoint called');
    console.log('Request body:', req.body);

    // Check if required dependencies are loaded
    if (!downloadYouTube || !downloadManager) {
      console.error('❌ Required dependencies not loaded');
      return res.status(500).json({
        message: 'Server configuration error - dependencies not loaded',
        error: 'DEPENDENCIES_NOT_LOADED'
      });
    }

    const { url, quality } = req.body;

    console.log('Received download request for URL:', url);
    console.log('Requested quality:', quality || 'default');

    if (!url) {
      console.log('Error: URL is required');
      return res.status(400).json({ message: 'URL is required' });
    }

    // Check if this URL was downloaded before
    const existingDownload = await downloadManager.findExistingDownload(url);
    if (existingDownload) {
      console.log('Found existing download for URL:', url);
      return res.status(200).json({
        ...existingDownload.toObject(),
        title: existingDownload.title,
        thumbnail: existingDownload.thumbnail,
        source: existingDownload.platform,
        type: existingDownload.type,
        downloadUrl: existingDownload.downloadUrl,
        filename: existingDownload.originalFilename,
        alternativeDownloads: existingDownload.alternativeDownloads,
        originalUrl: existingDownload.url,
        actualQuality: existingDownload.actualQuality,
        watermarkFree: existingDownload.watermarkFree,
        fromHistory: true
      });
    }

    const platform = getPlatform(url);
    console.log('Detected platform:', platform);

    if (platform === 'unknown') {
      console.log('Error: Unsupported platform for URL:', url);
      return res.status(400).json({
        message: 'Nền tảng không được hỗ trợ. Hiện tại chúng tôi hỗ trợ YouTube, TikTok, Instagram, Facebook, Twitter, và Fshare.'
      });
    }

    // Fshare is now supported in main download endpoint

    let result;
    console.log(`Attempting to download from ${platform} with quality: ${quality || 'default'}`);

    try {
      switch (platform) {
        case 'youtube':
          console.log('Downloading from YouTube...');
          result = await downloadYouTube(url, quality);
          break;
        case 'tiktok':
          console.log('Downloading from TikTok...');
          result = await downloadTikTok(url, quality);
          break;
        case 'instagram':
          console.log('Downloading from Instagram...');
          result = await downloadInstagram(url, quality);
          break;
        case 'facebook':
          console.log('Downloading from Facebook...');
          result = await downloadFacebook(url, quality);
          break;
        case 'twitter':
          console.log('Downloading from Twitter...');
          result = await downloadTwitter(url, quality);
          break;
        case 'fshare':
          console.log('Processing Fshare file...');
          // Extract password and targetEmail from request body
          const { password = '', targetEmail = '' } = req.body;
          result = await downloadFshare(url, password, targetEmail);
          break;
        default:
          console.log('Error: Unsupported platform:', platform);
          return res.status(400).json({ message: 'Nền tảng không được hỗ trợ' });
      }
      console.log(`Successfully downloaded from ${platform}:`, result?.title || 'Unknown title');
    } catch (downloadError) {
      console.error(`Error downloading from ${platform}:`, downloadError.message);
      console.error('Error stack:', downloadError.stack);
      throw new Error(`Failed to download from ${platform}: ${downloadError.message}`);
    }

    // Add filename to downloadUrl if it exists
    if (result.downloadUrl && result.downloadUrl.startsWith('/temp/') && result.filename) {
      // Add query parameter with filename for Content-Disposition
      const fileId = result.downloadUrl.split('/').pop();
      result.downloadUrl = `/temp/${fileId}?filename=${encodeURIComponent(result.filename)}`;
    }

    // Save download to history (skip for Instructions type)
    if (result.type !== 'Instructions') {
      const userInfo = {
        userID: req.body.userID || req.ip || req.connection.remoteAddress, // Use Firebase userID if available
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent') || ''
      };

      await downloadManager.saveDownload({
        url,
        title: result.title,
        platform,
        filename: result.downloadUrl ? result.downloadUrl.split('/').pop().split('?')[0] : 'instructions.txt', // Extract filename from URL or use default
        originalFilename: result.filename,
        downloadUrl: result.downloadUrl,
        quality: quality || 'default',
        actualQuality: result.actualQuality,
        watermarkFree: result.watermarkFree,
        type: result.type,
        duration: result.duration,
        thumbnail: result.thumbnail,
        alternativeDownloads: result.alternativeDownloads
      }, userInfo);

      console.log('Download saved to history:', result.title);
    } else {
      console.log('Instructions response - not saving to history');
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({
      message: error.message || 'An error occurred while processing your request'
    });
  }
});

module.exports = router;
