const fs = require('fs');
const path = require('path');
// Using in-memory storage instead of MongoDB - persists across restarts unless manually deleted

class DownloadManager {
  constructor() {
    this.tempDir = path.join(__dirname, '..', 'temp');
    this.maxFileAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.defaultMaxStorageSize = 2 * 1024 * 1024 * 1024; // 2GB default for users
    this.adminMaxStorageSize = -1; // -1 = unlimited for admin

    // In-memory storage for download history (persists across restarts unless manually deleted)
    this.downloadHistory = new Map(); // userID -> downloads[]
    this.userStorageLimits = new Map(); // userID -> storageLimit (bytes)
    this.userRoles = new Map(); // userID -> role (user/admin)

    this.loadHistoryFromDisk();
    this.loadUserSettingsFromDisk();
  }

  // Load history from disk (persists across restarts)
  loadHistoryFromDisk() {
    try {
      const historyFile = path.join(this.tempDir, 'download-history.json');
      if (fs.existsSync(historyFile)) {
        const data = fs.readFileSync(historyFile, 'utf8');
        const historyData = JSON.parse(data);

        // Convert back to Map
        for (const [userID, downloads] of Object.entries(historyData)) {
          this.downloadHistory.set(userID, downloads);
        }

        console.log(`Loaded download history for ${this.downloadHistory.size} users`);
      }
    } catch (error) {
      console.error('Error loading download history:', error);
    }
  }

  // Save history to disk (persists across restarts)
  saveHistoryToDisk() {
    try {
      const historyFile = path.join(this.tempDir, 'download-history.json');

      // Convert Map to Object for JSON serialization
      const historyData = {};
      for (const [userID, downloads] of this.downloadHistory.entries()) {
        historyData[userID] = downloads;
      }

      fs.writeFileSync(historyFile, JSON.stringify(historyData, null, 2));
    } catch (error) {
      console.error('Error saving download history:', error);
    }
  }

  // Load user settings from disk
  loadUserSettingsFromDisk() {
    try {
      const settingsFile = path.join(this.tempDir, 'user-settings.json');
      if (fs.existsSync(settingsFile)) {
        const data = fs.readFileSync(settingsFile, 'utf8');
        const settings = JSON.parse(data);

        // Load storage limits
        if (settings.storageLimits) {
          for (const [userID, limit] of Object.entries(settings.storageLimits)) {
            this.userStorageLimits.set(userID, limit);
          }
        }

        // Load user roles
        if (settings.userRoles) {
          for (const [userID, role] of Object.entries(settings.userRoles)) {
            this.userRoles.set(userID, role);
          }
        }

        console.log(`Loaded settings for ${this.userStorageLimits.size} users`);
      }
    } catch (error) {
      console.error('Error loading user settings:', error);
    }
  }

  // Save user settings to disk
  saveUserSettingsToDisk() {
    try {
      const settingsFile = path.join(this.tempDir, 'user-settings.json');

      const settings = {
        storageLimits: {},
        userRoles: {}
      };

      // Convert Maps to Objects
      for (const [userID, limit] of this.userStorageLimits.entries()) {
        settings.storageLimits[userID] = limit;
      }

      for (const [userID, role] of this.userRoles.entries()) {
        settings.userRoles[userID] = role;
      }

      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  }

  // Set user storage limit (admin function)
  setUserStorageLimit(userID, limitBytes) {
    this.userStorageLimits.set(userID, limitBytes);
    this.saveUserSettingsToDisk();
    console.log(`Set storage limit for ${userID}: ${this.formatBytes(limitBytes)}`);
  }

  // Set user role (admin function)
  setUserRole(userID, role) {
    this.userRoles.set(userID, role);
    this.saveUserSettingsToDisk();
    console.log(`Set role for ${userID}: ${role}`);
  }

  // Get user storage limit
  getUserStorageLimit(userID) {
    const role = this.userRoles.get(userID) || 'user';

    if (role === 'admin' || role === 'super_admin') {
      return this.adminMaxStorageSize; // -1 = unlimited
    }

    return this.userStorageLimits.get(userID) || this.defaultMaxStorageSize;
  }

  // Get user role
  getUserRole(userID) {
    return this.userRoles.get(userID) || 'user';
  }

  // Save download to history
  async saveDownload(downloadData, userInfo = {}) {
    try {
      const { url, title, platform, filename, downloadUrl, type } = downloadData;
      const userID = userInfo.userID || userInfo.ip || 'anonymous';

      // Get file info
      const filePath = path.join(this.tempDir, filename);
      let fileSize = 0;
      let fileExists = false;

      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
        fileExists = true;
      }

      // Create download record
      const downloadRecord = {
        _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        url,
        title,
        platform,
        filename,
        originalFilename: downloadData.originalFilename || filename,
        fileSize,
        filePath,
        downloadUrl,
        quality: downloadData.quality || 'default',
        actualQuality: downloadData.actualQuality || 'Unknown',
        watermarkFree: downloadData.watermarkFree || false,
        type,
        duration: downloadData.duration || '',
        thumbnail: downloadData.thumbnail || '',
        userID,
        userAgent: userInfo.userAgent || '',
        status: 'completed',
        fileExists,
        alternativeDownloads: downloadData.alternativeDownloads || [],
        downloadedAt: new Date(),
        lastAccessedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      };

      // Get user's download history
      if (!this.downloadHistory.has(userID)) {
        this.downloadHistory.set(userID, []);
      }

      const userDownloads = this.downloadHistory.get(userID);
      userDownloads.unshift(downloadRecord); // Add to beginning

      // Keep only last 100 downloads per user
      if (userDownloads.length > 100) {
        userDownloads.splice(100);
      }

      // Save to disk
      this.saveHistoryToDisk();

      console.log(`Download saved to history: ${title}`);
      return downloadRecord;
    } catch (error) {
      console.error('Error saving download to history:', error);
      return null;
    }
  }

  // Check if URL was downloaded before
  async findExistingDownload(url) {
    try {
      // Search through all users' download history
      for (const [userIP, downloads] of this.downloadHistory.entries()) {
        const existing = downloads.find(download =>
          download.url === url &&
          download.status === 'completed' &&
          download.fileExists
        );

        if (existing) {
          // Check if file still exists on disk
          const filePath = path.join(this.tempDir, existing.filename);
          if (fs.existsSync(filePath)) {
            // Update last accessed time
            existing.lastAccessedAt = new Date();
            this.saveHistoryToDisk();
            return existing;
          } else {
            // File doesn't exist, mark as deleted
            existing.status = 'deleted';
            existing.fileExists = false;
            this.saveHistoryToDisk();
            return null;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error finding existing download:', error);
      return null;
    }
  }

  // Get user's download history
  async getUserHistory(userID, limit = 50) {
    try {
      const userDownloads = this.downloadHistory.get(userID) || [];

      // Verify files still exist and filter valid downloads
      const validHistory = [];
      for (const item of userDownloads) {
        if (item.status === 'completed' && item.fileExists) {
          const filePath = path.join(this.tempDir, item.filename);
          if (fs.existsSync(filePath)) {
            validHistory.push(item);
          } else {
            // Mark as deleted if file doesn't exist
            item.status = 'deleted';
            item.fileExists = false;
          }
        }
      }

      // Save changes if any files were marked as deleted
      if (validHistory.length !== userDownloads.filter(d => d.status === 'completed' && d.fileExists).length) {
        this.saveHistoryToDisk();
      }

      return validHistory.slice(0, limit);
    } catch (error) {
      console.error('Error getting user history:', error);
      return [];
    }
  }

  // Delete specific download
  async deleteDownload(downloadId, userIP) {
    try {
      const userDownloads = this.downloadHistory.get(userIP) || [];
      const downloadIndex = userDownloads.findIndex(d => d._id === downloadId);

      if (downloadIndex === -1) {
        return { success: false, message: 'Download not found or access denied' };
      }

      const download = userDownloads[downloadIndex];

      // Delete file from disk
      const filePath = path.join(this.tempDir, download.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }

      // Mark as deleted
      download.status = 'deleted';
      download.fileExists = false;

      // Save changes
      this.saveHistoryToDisk();

      return { success: true, message: 'Download deleted successfully' };
    } catch (error) {
      console.error('Error deleting download:', error);
      return { success: false, message: 'Error deleting download' };
    }
  }

  // Clean up old files
  async cleanupOldFiles() {
    try {
      console.log('Starting cleanup of old files...');

      // Get all files in temp directory
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      let deletedCount = 0;
      let freedSpace = 0;

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);

        // Skip directories
        if (stats.isDirectory()) continue;

        // Check if file is older than maxFileAge
        const fileAge = now - stats.mtime.getTime();
        if (fileAge > this.maxFileAge) {
          try {
            fs.unlinkSync(filePath);
            deletedCount++;
            freedSpace += stats.size;
            console.log(`Deleted old file: ${file}`);

            // Mark as deleted in history
            for (const [userIP, downloads] of this.downloadHistory.entries()) {
              for (const download of downloads) {
                if (download.filename === file) {
                  download.status = 'deleted';
                  download.fileExists = false;
                }
              }
            }
          } catch (error) {
            console.error(`Error deleting file ${file}:`, error);
          }
        }
      }

      // Save changes to disk
      this.saveHistoryToDisk();

      console.log(`Cleanup completed: ${deletedCount} files deleted, ${this.formatBytes(freedSpace)} freed`);
      return { deletedCount, freedSpace };
    } catch (error) {
      console.error('Error during cleanup:', error);
      return { deletedCount: 0, freedSpace: 0 };
    }
  }

  // Get storage statistics for specific user
  async getStorageStats(userIP = null) {
    try {
      if (userIP) {
        // Get stats for specific user
        return this.getUserStorageStats(userIP);
      } else {
        // Get global stats (admin view)
        return this.getGlobalStorageStats();
      }
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        totalSize: 0,
        fileCount: 0,
        totalDownloads: 0,
        activeDownloads: 0,
        maxStorageSize: 0,
        usagePercentage: 0,
        role: 'user'
      };
    }
  }

  // Get storage stats for specific user
  getUserStorageStats(userIP) {
    const userDownloads = this.downloadHistory.get(userIP) || [];
    const userRole = this.getUserRole(userIP);
    const maxStorageSize = this.getUserStorageLimit(userIP);

    let userTotalSize = 0;
    let userFileCount = 0;
    let userTotalDownloads = 0;
    let userActiveDownloads = 0;

    for (const download of userDownloads) {
      if (download.status === 'completed') {
        userTotalDownloads++;
        if (download.fileExists) {
          userActiveDownloads++;
          userTotalSize += download.fileSize || 0;
          userFileCount++;
        }
      }
    }

    const usagePercentage = maxStorageSize === -1 ? 0 : (userTotalSize / maxStorageSize) * 100;

    return {
      totalSize: userTotalSize,
      fileCount: userFileCount,
      totalDownloads: userTotalDownloads,
      activeDownloads: userActiveDownloads,
      maxStorageSize,
      usagePercentage,
      role: userRole,
      isUnlimited: maxStorageSize === -1
    };
  }

  // Get global storage stats (admin view)
  getGlobalStorageStats() {
    const files = fs.readdirSync(this.tempDir);
    let totalSize = 0;
    let fileCount = 0;

    for (const file of files) {
      const filePath = path.join(this.tempDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile() && !file.endsWith('.json')) { // Exclude settings files
          totalSize += stats.size;
          fileCount++;
        }
      } catch (error) {
        // File might have been deleted, skip
      }
    }

    // Count downloads from in-memory storage
    let totalDownloads = 0;
    let activeDownloads = 0;
    let totalUsers = 0;

    for (const [userIP, downloads] of this.downloadHistory.entries()) {
      totalUsers++;
      for (const download of downloads) {
        if (download.status === 'completed') {
          totalDownloads++;
          if (download.fileExists) {
            activeDownloads++;
          }
        }
      }
    }

    return {
      totalSize,
      fileCount,
      totalDownloads,
      activeDownloads,
      totalUsers,
      maxStorageSize: -1, // Global view shows unlimited
      usagePercentage: 0,
      role: 'admin',
      isUnlimited: true
    };
  }

  // Format bytes to human readable
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Schedule automatic cleanup
  startAutoCleanup() {
    // Run cleanup every 6 hours
    setInterval(() => {
      this.cleanupOldFiles();
    }, 6 * 60 * 60 * 1000);

    console.log('Auto cleanup scheduled every 6 hours');
  }
}

module.exports = new DownloadManager();
