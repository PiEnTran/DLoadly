const express = require('express');
const downloadManager = require('../services/downloadManager');

const router = express.Router();

// Get user's download history
router.get('/downloads/history', async (req, res) => {
  try {
    const userID = req.headers['x-user-id'] || req.ip || req.connection.remoteAddress;
    const limit = parseInt(req.query.limit) || 50;

    const history = await downloadManager.getUserHistory(userID, limit);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error getting download history:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving download history'
    });
  }
});

// Check if URL exists in history
router.post('/downloads/check', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'URL is required'
      });
    }

    const existing = await downloadManager.findExistingDownload(url);

    if (existing) {
      res.json({
        success: true,
        exists: true,
        data: existing
      });
    } else {
      res.json({
        success: true,
        exists: false
      });
    }
  } catch (error) {
    console.error('Error checking download:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking download'
    });
  }
});

// Re-download from history
router.post('/downloads/redownload/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userIP = req.ip || req.connection.remoteAddress;

    // Find download in user's history
    const userDownloads = downloadManager.downloadHistory.get(userIP) || [];
    const download = userDownloads.find(d => d._id === id);

    if (!download || download.userIP !== userIP) {
      return res.status(404).json({
        success: false,
        message: 'Download not found or access denied'
      });
    }

    // Check if file still exists
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', 'temp', download.filename);

    if (!fs.existsSync(filePath)) {
      download.status = 'deleted';
      download.fileExists = false;
      downloadManager.saveHistoryToDisk();
      return res.status(404).json({
        success: false,
        message: 'File no longer exists'
      });
    }

    // Update last accessed time
    download.lastAccessedAt = new Date();
    downloadManager.saveHistoryToDisk();

    res.json({
      success: true,
      data: {
        title: download.title,
        thumbnail: download.thumbnail,
        source: download.platform,
        type: download.type,
        downloadUrl: download.downloadUrl,
        filename: download.originalFilename,
        alternativeDownloads: download.alternativeDownloads,
        originalUrl: download.url,
        actualQuality: download.actualQuality,
        watermarkFree: download.watermarkFree
      }
    });
  } catch (error) {
    console.error('Error re-downloading:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing re-download'
    });
  }
});

// Delete specific download
router.delete('/downloads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userIP = req.ip || req.connection.remoteAddress;

    const result = await downloadManager.deleteDownload(id, userIP);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error deleting download:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting download'
    });
  }
});

// Bulk delete downloads
router.post('/downloads/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    const userIP = req.ip || req.connection.remoteAddress;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid download IDs'
      });
    }

    const results = [];
    for (const id of ids) {
      const result = await downloadManager.deleteDownload(id, userIP);
      results.push({ id, ...result });
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      message: `${successCount} downloads deleted successfully`,
      results
    });
  } catch (error) {
    console.error('Error bulk deleting downloads:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting downloads'
    });
  }
});

// Get storage statistics
router.get('/downloads/stats', async (req, res) => {
  try {
    const userID = req.headers['x-user-id'] || req.ip || req.connection.remoteAddress;
    const stats = await downloadManager.getStorageStats(userID);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting storage stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving storage statistics'
    });
  }
});

// Manual cleanup
router.post('/downloads/cleanup', async (req, res) => {
  try {
    const result = await downloadManager.cleanupOldFiles();

    res.json({
      success: true,
      message: 'Cleanup completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Error during cleanup'
    });
  }
});

// Admin routes for user management
router.post('/downloads/admin/set-user-limit', async (req, res) => {
  try {
    // Check Firebase auth and role instead of IP-based role
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // In a real implementation, you would verify the Firebase token here
    // For now, we'll use a simple check
    const { userRole } = req.body;

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - admin only'
      });
    }

    const { userIP, limitGB } = req.body;

    if (!userIP || limitGB === undefined) {
      return res.status(400).json({
        success: false,
        message: 'userIP and limitGB are required'
      });
    }

    const limitBytes = limitGB === -1 ? -1 : limitGB * 1024 * 1024 * 1024; // Convert GB to bytes
    downloadManager.setUserStorageLimit(userIP, limitBytes);

    res.json({
      success: true,
      message: `Storage limit set for ${userIP}: ${limitGB === -1 ? 'Unlimited' : limitGB + 'GB'}`
    });
  } catch (error) {
    console.error('Error setting user storage limit:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting storage limit'
    });
  }
});

router.post('/downloads/admin/set-user-role', async (req, res) => {
  try {
    // Check Firebase auth and role instead of IP-based role
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // In a real implementation, you would verify the Firebase token here
    // For now, we'll use a simple check
    const { userRole } = req.body;

    if (userRole !== 'admin' && userRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - admin only'
      });
    }

    const { userIP, role } = req.body;

    if (!userIP || !role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'userIP and valid role (user/admin) are required'
      });
    }

    downloadManager.setUserRole(userIP, role);

    res.json({
      success: true,
      message: `Role set for ${userIP}: ${role}`
    });
  } catch (error) {
    console.error('Error setting user role:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting user role'
    });
  }
});

router.get('/downloads/admin/users', async (req, res) => {
  try {
    // Check Firebase auth and role instead of IP-based role
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // For GET request, we need to check role differently
    // In a real implementation, you would decode the Firebase token
    // For now, we'll allow access if auth header is present
    // The frontend already checks isAdmin before showing this component

    const users = [];

    // Get all users from download history
    for (const [userIP, downloads] of downloadManager.downloadHistory.entries()) {
      const userRole = downloadManager.getUserRole(userIP);
      const storageLimit = downloadManager.getUserStorageLimit(userIP);
      const stats = downloadManager.getUserStorageStats(userIP);

      users.push({
        userIP,
        role: userRole,
        storageLimit,
        storageLimitFormatted: storageLimit === -1 ? 'Unlimited' : downloadManager.formatBytes(storageLimit),
        currentUsage: stats.totalSize,
        currentUsageFormatted: downloadManager.formatBytes(stats.totalSize),
        usagePercentage: stats.usagePercentage,
        totalDownloads: stats.totalDownloads,
        activeDownloads: stats.activeDownloads,
        lastActivity: downloads.length > 0 ? downloads[0].lastAccessedAt : null
      });
    }

    // Sort by last activity
    users.sort((a, b) => new Date(b.lastActivity || 0) - new Date(a.lastActivity || 0));

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error getting users list:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving users list'
    });
  }
});

module.exports = router;
