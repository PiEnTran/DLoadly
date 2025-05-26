const axios = require('axios');
const environment = require('../config/environment');

class FshareService {
  constructor() {
    this.baseURL = 'https://api.fshare.vn/api';
    this.sessionToken = null;
    this.tokenExpiry = null;
    this.userInfo = null;
    this.dailyQuotaUsed = 0;
    this.dailyQuotaLimit = 150 * 1024 * 1024 * 1024; // 150GB in bytes
    this.isEnabled = process.env.FSHARE_ENABLED === 'true';

    // Credentials from environment
    this.credentials = {
      user_email: process.env.FSHARE_EMAIL,
      password: process.env.FSHARE_PASSWORD,
      app_key: process.env.FSHARE_APP_KEY || 'dMnqMMZMUnN5YpvKENaEhdQQ5jxDqddt'
    };

    console.log('🔧 FshareService initialized:', {
      enabled: this.isEnabled,
      hasCredentials: !!(this.credentials.user_email && this.credentials.password)
    });
  }

  /**
   * Check if Fshare service is enabled and configured
   */
  isConfigured() {
    return this.isEnabled &&
           this.credentials.user_email &&
           this.credentials.password &&
           this.credentials.app_key;
  }

  /**
   * Login to Fshare and get session token
   */
  async login() {
    try {
      if (!this.isConfigured()) {
        throw new Error('Fshare service is not configured or disabled');
      }

      console.log('🔐 Logging into Fshare...');
      console.log('🔐 Using credentials:', {
        email: this.credentials.user_email,
        hasPassword: !!this.credentials.password,
        appKey: this.credentials.app_key
      });

      const response = await axios.post(`${this.baseURL}/user/login`, {
        user_email: this.credentials.user_email,
        password: this.credentials.password,
        app_key: this.credentials.app_key
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      if (response.data && response.data.code === 200) {
        this.sessionToken = response.data.token;
        this.userInfo = response.data;
        this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

        console.log('✅ Fshare login successful:', {
          token: this.sessionToken ? 'Present' : 'Missing',
          expiry: new Date(this.tokenExpiry).toISOString()
        });

        return {
          success: true,
          token: this.sessionToken,
          userInfo: this.userInfo
        };
      } else {
        console.error('❌ Fshare login response:', response.data);
        throw new Error(`Login failed: ${response.data?.msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Fshare login error:', error.message);
      if (error.response) {
        console.error('❌ Response status:', error.response.status);
        console.error('❌ Response data:', error.response.data);
      }
      throw new Error(`Fshare login failed: ${error.message}`);
    }
  }

  /**
   * Check if current session is valid
   */
  isSessionValid() {
    return this.sessionToken &&
           this.tokenExpiry &&
           Date.now() < this.tokenExpiry;
  }

  /**
   * Ensure we have a valid session token
   */
  async ensureValidSession() {
    if (!this.isSessionValid()) {
      await this.login();
    }
    return this.sessionToken;
  }

  /**
   * Get download link for Fshare URL
   */
  async getDownloadLink(fshareUrl, password = '') {
    try {
      if (!this.isConfigured()) {
        throw new Error('Fshare service is not configured or disabled');
      }

      console.log('🔗 Getting Fshare download link for:', fshareUrl);

      // Ensure valid session
      await this.ensureValidSession();

      // Extract file code from URL
      const fileCode = this.extractFileCode(fshareUrl);
      if (!fileCode) {
        throw new Error('Invalid Fshare URL format');
      }

      // Get download token first
      const downloadToken = await this.getDownloadToken(fileCode, password);

      // Get actual download link
      const response = await axios.post(`${this.baseURL}/session/download`, {
        zipflag: 0,
        url: fshareUrl,
        password: password,
        token: downloadToken
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Cookie': `session_id=${this.sessionToken}`
        },
        timeout: 30000
      });

      if (response.data && response.data.code === 200) {
        console.log('✅ Fshare download link obtained successfully');

        return {
          success: true,
          downloadUrl: response.data.location,
          filename: response.data.name || 'fshare_file',
          fileSize: response.data.size || 0,
          token: downloadToken
        };
      } else {
        throw new Error(`Download link failed: ${response.data?.msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Fshare download link error:', error.message);
      throw new Error(`Failed to get Fshare download link: ${error.message}`);
    }
  }

  /**
   * Get download token for file
   */
  async getDownloadToken(fileCode, password = '') {
    try {
      const response = await axios.post(`${this.baseURL}/session/download`, {
        url: `https://www.fshare.vn/file/${fileCode}`,
        password: password,
        zipflag: 0
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      if (response.data && response.data.token) {
        return response.data.token;
      } else {
        throw new Error('Failed to get download token');
      }
    } catch (error) {
      console.error('❌ Fshare download token error:', error.message);
      throw error;
    }
  }

  /**
   * Extract file code from Fshare URL
   */
  extractFileCode(url) {
    try {
      // Support various Fshare URL formats
      const patterns = [
        /fshare\.vn\/file\/([A-Z0-9]+)/i,
        /www\.fshare\.vn\/file\/([A-Z0-9]+)/i,
        /https?:\/\/(?:www\.)?fshare\.vn\/file\/([A-Z0-9]+)/i
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
          return match[1];
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Error extracting file code:', error.message);
      return null;
    }
  }

  /**
   * Check if URL is a Fshare URL
   */
  isFshareUrl(url) {
    return /(?:www\.)?fshare\.vn\/file\//i.test(url);
  }

  /**
   * Get user quota information
   */
  async getQuotaInfo() {
    try {
      if (!this.isConfigured()) {
        return {
          enabled: false,
          message: 'Fshare service is not configured'
        };
      }

      await this.ensureValidSession();

      return {
        enabled: true,
        dailyLimit: this.dailyQuotaLimit,
        dailyUsed: this.dailyQuotaUsed,
        dailyRemaining: this.dailyQuotaLimit - this.dailyQuotaUsed,
        percentUsed: (this.dailyQuotaUsed / this.dailyQuotaLimit) * 100
      };
    } catch (error) {
      console.error('❌ Error getting quota info:', error.message);
      return {
        enabled: false,
        error: error.message
      };
    }
  }

  /**
   * Update daily quota usage
   */
  updateQuotaUsage(downloadSize) {
    this.dailyQuotaUsed += downloadSize;
    console.log(`📊 Fshare quota updated: ${(this.dailyQuotaUsed / (1024 * 1024 * 1024)).toFixed(2)}GB used`);
  }

  /**
   * Check if quota allows download
   */
  canDownload(fileSize = 0) {
    if (!this.isConfigured()) {
      return { allowed: false, reason: 'Service not configured' };
    }

    const remaining = this.dailyQuotaLimit - this.dailyQuotaUsed;

    if (fileSize > remaining) {
      return {
        allowed: false,
        reason: `Insufficient quota. Need ${(fileSize / (1024 * 1024 * 1024)).toFixed(2)}GB, have ${(remaining / (1024 * 1024 * 1024)).toFixed(2)}GB`
      };
    }

    return { allowed: true };
  }

  /**
   * Reset daily quota (should be called daily)
   */
  resetDailyQuota() {
    this.dailyQuotaUsed = 0;
    console.log('🔄 Fshare daily quota reset');
  }

  /**
   * Get file information from Fshare URL
   */
  async getFileInfo(fshareUrl) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Fshare service is not configured or disabled');
      }

      console.log('📄 Getting Fshare file info for:', fshareUrl);

      await this.ensureValidSession();

      const fileCode = this.extractFileCode(fshareUrl);
      if (!fileCode) {
        throw new Error('Invalid Fshare URL format');
      }

      const response = await axios.post(`${this.baseURL}/fileops/get`, {
        url: fshareUrl,
        dirOnly: 0
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.sessionToken}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      if (response.data && response.data.code === 200) {
        const fileInfo = response.data.item;
        return {
          success: true,
          name: fileInfo.name,
          size: fileInfo.size,
          type: fileInfo.linktype,
          created: fileInfo.created,
          modified: fileInfo.modified,
          isFolder: fileInfo.linktype === 1
        };
      } else {
        throw new Error(`File info failed: ${response.data?.msg || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Fshare file info error:', error.message);
      throw new Error(`Failed to get Fshare file info: ${error.message}`);
    }
  }

  /**
   * Download file directly and save to temp directory
   */
  async downloadFile(fshareUrl, password = '', targetEmail = '') {
    try {
      if (!this.isConfigured()) {
        throw new Error('Fshare service is not configured or disabled');
      }

      console.log('⬇️ Starting Fshare file download:', fshareUrl);

      // Get file info first
      const fileInfo = await this.getFileInfo(fshareUrl);

      // Check quota
      const quotaCheck = this.canDownload(fileInfo.size);
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.reason);
      }

      // Get download link
      const downloadInfo = await this.getDownloadLink(fshareUrl, password);

      if (!downloadInfo.success) {
        throw new Error('Failed to get download link');
      }

      // Actually download the file to temp directory
      const path = require('path');
      const fs = require('fs');
      const axios = require('axios');
      const { v4: uuidv4 } = require('uuid');

      const tempDir = path.join(__dirname, '..', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate unique filename
      const fileExtension = path.extname(fileInfo.name) || '.bin';
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const tempFilePath = path.join(tempDir, uniqueFilename);

      console.log('📥 Downloading file from Fshare to:', tempFilePath);

      // Download file from Fshare
      const response = await axios({
        method: 'GET',
        url: downloadInfo.downloadUrl,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://www.fshare.vn/'
        },
        timeout: 300000 // 5 minutes timeout for large files
      });

      const writer = fs.createWriteStream(tempFilePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log('✅ File downloaded successfully to temp directory');

      // Update quota
      this.updateQuotaUsage(fileInfo.size);

      // If targetEmail provided, upload to Google Drive
      if (targetEmail) {
        console.log('📤 Uploading to Google Drive for:', targetEmail);

        const googleDriveService = require('./googleDriveService');

        if (googleDriveService.isInitialized()) {
          try {
            // Create user folder
            const userFolderResult = await googleDriveService.createUserFolder(targetEmail, 'Fshare User');

            if (userFolderResult.success) {
              // Upload file to Google Drive
              const uploadResult = await googleDriveService.uploadFile(
                tempFilePath,
                fileInfo.name,
                this.getMimeType(fileInfo.name),
                {
                  userEmail: targetEmail,
                  userName: 'Fshare User',
                  folderId: userFolderResult.folderId
                }
              );

              // Delete temp file after upload
              try {
                fs.unlinkSync(tempFilePath);
                console.log('🗑️ Temp file deleted after upload');
              } catch (deleteError) {
                console.log('⚠️ Failed to delete temp file:', deleteError.message);
              }

              if (uploadResult.success) {
                console.log('✅ File uploaded to Google Drive successfully');

                // Send email notification
                const emailService = require('./emailService');
                try {
                  await emailService.sendDownloadNotification(
                    targetEmail,
                    'Fshare User',
                    fileInfo.name,
                    uploadResult.webViewLink,
                    'Fshare'
                  );
                  console.log('📧 Email notification sent');
                } catch (emailError) {
                  console.log('⚠️ Email notification failed:', emailError.message);
                }

                return {
                  success: true,
                  title: fileInfo.name,
                  filename: fileInfo.name,
                  downloadUrl: uploadResult.webViewLink,
                  fileSize: fileInfo.size,
                  source: 'Fshare',
                  type: this.getFileType(fileInfo.name),
                  targetEmail: targetEmail,
                  instructions: `File đã được tải xuống từ Fshare và upload lên Google Drive. Link đã được chia sẻ với email: ${targetEmail}`,
                  originalUrl: fshareUrl,
                  platform: 'fshare',
                  driveLink: uploadResult.webViewLink,
                  isAutomatic: true,
                  uploadedToDrive: true
                };
              } else {
                throw new Error('Failed to upload to Google Drive: ' + uploadResult.error);
              }
            } else {
              throw new Error('Failed to create user folder: ' + userFolderResult.error);
            }
          } catch (driveError) {
            console.error('❌ Google Drive upload failed:', driveError.message);
            // Delete temp file on error
            try {
              fs.unlinkSync(tempFilePath);
            } catch (deleteError) {
              console.log('Failed to delete temp file on error:', deleteError.message);
            }
            throw new Error(`Google Drive upload failed: ${driveError.message}`);
          }
        } else {
          // Delete temp file if Drive not available
          try {
            fs.unlinkSync(tempFilePath);
          } catch (deleteError) {
            console.log('Failed to delete temp file:', deleteError.message);
          }
          throw new Error('Google Drive service not initialized');
        }
      } else {
        // Return local download link
        return {
          success: true,
          title: fileInfo.name,
          filename: fileInfo.name,
          downloadUrl: `/temp/${uniqueFilename}?filename=${encodeURIComponent(fileInfo.name)}`,
          fileSize: fileInfo.size,
          source: 'Fshare',
          type: this.getFileType(fileInfo.name),
          targetEmail: targetEmail,
          instructions: 'File đã được tải xuống từ Fshare và sẵn sàng để tải về',
          originalUrl: fshareUrl,
          platform: 'fshare',
          isAutomatic: true,
          localPath: tempFilePath
        };
      }
    } catch (error) {
      console.error('❌ Fshare download error:', error.message);
      throw new Error(`Fshare download failed: ${error.message}`);
    }
  }

  /**
   * Determine file type based on extension
   */
  getFileType(filename) {
    const ext = filename.split('.').pop().toLowerCase();

    const videoExts = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'];
    const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'];
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
    const documentExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];
    const archiveExts = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];

    if (videoExts.includes(ext)) return 'Video';
    if (audioExts.includes(ext)) return 'Audio';
    if (imageExts.includes(ext)) return 'Image';
    if (documentExts.includes(ext)) return 'Document';
    if (archiveExts.includes(ext)) return 'Archive';

    return 'File';
  }

  /**
   * Get MIME type based on file extension
   */
  getMimeType(filename) {
    const ext = filename.toLowerCase().split('.').pop();

    const mimeTypes = {
      // Video
      'mp4': 'video/mp4',
      'avi': 'video/x-msvideo',
      'mkv': 'video/x-matroska',
      'mov': 'video/quicktime',
      'wmv': 'video/x-ms-wmv',
      'flv': 'video/x-flv',
      'webm': 'video/webm',
      'm4v': 'video/x-m4v',

      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'flac': 'audio/flac',
      'aac': 'audio/aac',
      'm4a': 'audio/mp4',
      'ogg': 'audio/ogg',
      'wma': 'audio/x-ms-wma',

      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',

      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',

      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      'bz2': 'application/x-bzip2'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get service status for admin panel
   */
  getServiceStatus() {
    return {
      enabled: this.isEnabled,
      configured: this.isConfigured(),
      sessionValid: this.isSessionValid(),
      quotaInfo: {
        dailyLimit: this.dailyQuotaLimit,
        dailyUsed: this.dailyQuotaUsed,
        dailyRemaining: this.dailyQuotaLimit - this.dailyQuotaUsed,
        percentUsed: (this.dailyQuotaUsed / this.dailyQuotaLimit) * 100
      },
      credentials: {
        hasEmail: !!this.credentials.user_email,
        hasPassword: !!this.credentials.password,
        hasAppKey: !!this.credentials.app_key
      }
    };
  }

  /**
   * Enable/disable service
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🔧 Fshare service ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
module.exports = new FshareService();
