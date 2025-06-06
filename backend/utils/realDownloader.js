const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Temp directory for downloads
const tempDir = path.join(__dirname, '..', 'temp');

// Ensure temp directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Helper to generate a unique filename
const generateUniqueFilename = (extension) => {
  return `${uuidv4()}.${extension}`;
};

// Detect platform from URL
const detectPlatform = (url) => {
  try {
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
  } catch (error) {
    return 'unknown';
  }
};

// YouTube downloader using yt-dlp-wrap
const downloadYouTube = async (url, quality = 'highest') => {
  try {
    console.log('🎥 Downloading YouTube video...');
    
    // Try yt-dlp-wrap first
    try {
      const YTDlpWrap = require('yt-dlp-wrap').default;
      const ytDlpWrap = new YTDlpWrap();
      
      const outputFilename = generateUniqueFilename('mp4');
      const outputPath = path.join(tempDir, outputFilename);
      
      // Download with yt-dlp-wrap
      await ytDlpWrap.exec([
        url,
        '-o', outputPath,
        '-f', 'best[ext=mp4]/best',
        '--no-warnings'
      ]);
      
      // Verify file exists
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        console.log('✅ YouTube download successful with yt-dlp-wrap');
        
        return {
          title: 'YouTube Video',
          source: 'YouTube',
          type: 'Video',
          downloadUrl: `/temp/${outputFilename}`,
          filename: `YouTube_Video_${quality || 'default'}.mp4`,
          originalUrl: url,
          watermarkFree: true,
          availableQualities: ['1080p', '720p', '480p', '360p', '240p'],
          alternativeDownloads: []
        };
      }
    } catch (ytDlpError) {
      console.log('yt-dlp-wrap failed:', ytDlpError.message);
    }
    
    // Fallback to API approach
    return await downloadYouTubeAPI(url, quality);
    
  } catch (error) {
    console.error('YouTube download error:', error);
    throw new Error('Failed to download YouTube video');
  }
};

// YouTube API fallback
const downloadYouTubeAPI = async (url, quality) => {
  console.log('🔄 Using YouTube API fallback...');
  
  // Extract video ID
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  
  // Try multiple YouTube download APIs
  const apis = [
    {
      name: 'Y2mate',
      url: 'https://www.y2mate.com/mates/en68/analyze/ajax',
      method: 'POST'
    },
    {
      name: 'SaveFrom',
      url: 'https://worker.sf-tools.com/save-from',
      method: 'POST'
    }
  ];
  
  for (const api of apis) {
    try {
      console.log(`Trying ${api.name} API...`);
      
      // This is a simplified approach - in reality, these APIs require
      // complex token handling and may be rate-limited
      const response = await axios.post(api.url, {
        url: url,
        q_auto: 1,
        ajax: 1
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });
      
      // Parse response and extract download URL
      // This is simplified - real implementation would need proper parsing
      if (response.data && response.data.status === 'ok') {
        console.log(`${api.name} API success`);
        // Implementation would continue here...
      }
      
    } catch (apiError) {
      console.log(`${api.name} API failed:`, apiError.message);
      continue;
    }
  }
  
  // If all APIs fail, return instructions
  throw new Error('All YouTube download methods failed');
};

// Extract YouTube video ID
const extractYouTubeVideoId = (url) => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

// TikTok downloader
const downloadTikTok = async (url, quality = 'highest') => {
  try {
    console.log('🎵 Downloading TikTok video...');
    
    // Use SnapTik API
    const response = await axios.post('https://snaptik.app/abc2.php', 
      `url=${encodeURIComponent(url)}&lang=en`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://snaptik.app/'
      },
      timeout: 15000
    });
    
    const html = response.data;
    
    // Parse HTML to find download links
    const videoMatch = html.match(/href="([^"]*)" download[^>]*>.*?Download.*?MP4/i);
    
    if (videoMatch && videoMatch[1]) {
      let videoUrl = videoMatch[1];
      
      if (videoUrl.startsWith('//')) {
        videoUrl = 'https:' + videoUrl;
      }
      
      // Download the video
      const outputFilename = generateUniqueFilename('mp4');
      const outputPath = path.join(tempDir, outputFilename);
      
      const videoResponse = await axios({
        method: 'GET',
        url: videoUrl,
        responseType: 'stream',
        timeout: 30000
      });
      
      const writer = fs.createWriteStream(outputPath);
      videoResponse.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
        console.log('✅ TikTok download successful');
        
        return {
          title: 'TikTok Video',
          source: 'TikTok',
          type: 'Video',
          downloadUrl: `/temp/${outputFilename}`,
          filename: `TikTok_Video_${quality || 'HD'}.mp4`,
          originalUrl: url,
          watermarkFree: true,
          availableQualities: ['HD', '720p', '480p'],
          alternativeDownloads: []
        };
      }
    }
    
    throw new Error('Failed to extract TikTok video URL');
    
  } catch (error) {
    console.error('TikTok download error:', error);
    throw new Error('Failed to download TikTok video');
  }
};

// Main download function
const downloadFromPlatform = async (url, quality = 'highest') => {
  const platform = detectPlatform(url);
  console.log(`Detected platform: ${platform}`);
  
  if (platform === 'unknown') {
    throw new Error('Unsupported platform');
  }
  
  switch (platform) {
    case 'youtube':
      return await downloadYouTube(url, quality);
    case 'tiktok':
      return await downloadTikTok(url, quality);
    case 'instagram':
      // Instagram implementation would go here
      throw new Error('Instagram downloads temporarily unavailable');
    case 'facebook':
      // Facebook implementation would go here
      throw new Error('Facebook downloads temporarily unavailable');
    case 'twitter':
      // Twitter implementation would go here
      throw new Error('Twitter downloads temporarily unavailable');
    case 'fshare':
      // Fshare implementation would go here
      throw new Error('Fshare downloads temporarily unavailable');
    default:
      throw new Error('Unsupported platform');
  }
};

module.exports = {
  downloadFromPlatform,
  detectPlatform
};
